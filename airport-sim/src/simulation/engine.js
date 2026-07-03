import {
  GATES, APRON_STANDS, AIRLINES,
  APR_Y, TAXI_IN_Y, TAXI_OUT_Y, HOLD1_X,
  RWY1_Y, RWY1_X0, RWY1_X1,
  RWY2_Y, RWY2_X0, RWY2_X1,
  VIEW_W, WORLD_W,
} from './constants.js';
import { getSeason, spawnWeatherParticle, updateWeatherParticle, SEASON_WEATHER } from './timeWeather.js';

// 게이트(브릿지) + 원격 주기장을 합친 전체 주기 슬롯 (최대 동시 수용 대수)
const SLOTS = [...GATES, ...APRON_STANDS];

let _pid = 0;
function rand(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(rand(a, b)); }
function pick(arr) { return arr[randInt(0, arr.length)]; }

// 아직 못 본 등록 항공편만 registry 큐에 추가 (중복 방지)
export function addToRegistry(sim, flights) {
  const reg = sim.registry;
  for (const f of flights) {
    if (!reg.seenCodes.has(f.code)) {
      reg.seenCodes.add(f.code);
      reg.queue.push(f);
    }
  }
}

// 등록된 항공편만 슬롯에 배정 (미등록 비행기는 만들지 않음)
function makePlane(gi, flight) {
  return {
    id: ++_pid,
    gi,
    gate: SLOTS[gi],
    airline: pick(AIRLINES),
    sponsor: { name: flight.name, desc: flight.desc },
    tail: flight.code,
    x: SLOTS[gi].x,
    y: APR_Y,
    vx: 0,
    vy: 0,
    pitch: 0,
    dir: 1,
    gearDown: true,
    cap: randInt(140, 200),
    pax: 0,
    state: 'boarding',
    t: 0,
    boardT:  rand(3000, 7000),
    debordT: rand(2000, 4000),
    flyT:    rand(8000, 16000),
  };
}

// 빈 슬롯(게이트 또는 주기장)에 대기 중인 등록 항공편을 배정
function spawnFromRegistry(sim) {
  const reg = sim.registry;
  if (reg.queue.length === 0) return;
  const occupied = new Set(sim.planes.map(p => p.gi));
  for (let gi = 0; gi < SLOTS.length && reg.queue.length > 0; gi++) {
    if (occupied.has(gi)) continue;
    sim.planes.push(makePlane(gi, reg.queue.shift()));
    occupied.add(gi);
  }
}

// ── 활주로 관리 ────────────────────────────────────────────────
function claimRwy1(sim, id) {
  if (sim.rwy1.busy) return false;
  sim.rwy1.busy = true; sim.rwy1.holder = id; return true;
}
function releaseRwy1(sim, id) {
  if (sim.rwy1.holder === id) { sim.rwy1.busy = false; sim.rwy1.holder = null; }
}
function claimRwy2(sim, id) {
  if (sim.rwy2.busy) return false;
  sim.rwy2.busy = true; sim.rwy2.holder = id; return true;
}
function releaseRwy2(sim, id) {
  if (sim.rwy2.holder === id) { sim.rwy2.busy = false; sim.rwy2.holder = null; }
}

// 앞 비행기와 충돌 방지 (출발 택시)
function taxiOutBlocked(p, planes) {
  return planes.some(o =>
    o.id !== p.id &&
    ['taxi_out', 'hold_short', 'lineup'].includes(o.state) &&
    o.x > p.x && o.x - p.x < 130
  );
}

// 앞 비행기와 충돌 방지 (도착 택시, 왼쪽으로 이동)
function taxiInBlocked(p, planes) {
  return planes.some(o =>
    o.id !== p.id &&
    ['taxi_in', 'landing'].includes(o.state) &&
    o.x < p.x && p.x - o.x < 130
  );
}

export function createSimulation() {
  const season = getSeason();
  return {
    planes: [],
    dots:   [],
    stats:  { takeoffs: 0, landings: 0, pax: 0 },
    rwy1:   { busy: false, holder: null },  // 이륙 전용
    rwy2:   { busy: false, holder: null },  // 착륙 전용
    wx:     { season, type: SEASON_WEATHER[season], particles: [] },
    registry: { queue: [], seenCodes: new Set() },  // 등록된 항공편 대기열
  };
}

export function updateSimulation(sim, dt) {
  updateWeather(sim, dt);
  spawnFromRegistry(sim);

  const { dots } = sim;
  for (let i = dots.length - 1; i >= 0; i--) {
    const d = dots[i];
    const dx = d.tx - d.x, dy = d.ty - d.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) { dots.splice(i, 1); continue; }
    d.x += dx / dist * d.spd;
    d.y += dy / dist * d.spd;
  }

  sim.planes.forEach(p => updatePlane(p, dt, sim));
  sim.planes = sim.planes.filter(p => p.state !== 'done');
}

function updateWeather(sim, dt) {
  const { wx } = sim;
  const rate = wx.type === 'rain' ? 5 : wx.type === 'snow' ? 2 : 0.5;
  const count = Math.floor(rate * dt / 16);
  for (let i = 0; i < count; i++) {
    const p = spawnWeatherParticle(wx.season, VIEW_W);
    if (p) wx.particles.push(p);
  }
  for (let i = wx.particles.length - 1; i >= 0; i--) {
    const p = wx.particles[i];
    updateWeatherParticle(p);
    if (p.y > 720 || p.x < -100 || p.x > VIEW_W + 100) wx.particles.splice(i, 1);
  }
  if (wx.particles.length > 900) wx.particles.splice(0, wx.particles.length - 900);
}

function spawnDot(dots, fx, fy, tx, ty, col) {
  dots.push({ x: fx, y: fy, tx, ty, col, spd: rand(0.6, 1.2) });
}

function updatePlane(p, dt, sim) {
  p.t += dt;
  const { planes, dots, stats } = sim;

  switch (p.state) {

    case 'boarding': {
      if (p.pax < p.cap && Math.random() < 0.25) {
        spawnDot(dots, p.gate.x + rand(-15, 15), APR_Y - 14, p.x - 10, p.y - 6, '#90caf9');
        p.pax++;
      }
      if (p.t >= p.boardT) { p.state = 'pushback'; p.t = 0; }
      break;
    }

    case 'pushback': {
      p.x -= 0.6;
      if (p.t > 2200) { p.state = 'taxi_out'; p.t = 0; p.dir = 1; p.vx = 0.7; }
      break;
    }

    case 'taxi_out': {
      if (taxiOutBlocked(p, planes)) {
        p.vx = 0;
      } else {
        p.vx = 0.7;
        p.x += p.vx;
      }

      // 계류장 → 출발 유도로: y가 APR_Y에서 TAXI_OUT_Y로 올라감
      const gx = p.gate.x;
      const progress = Math.max(0, Math.min(1, (p.x - gx) / Math.max(1, HOLD1_X - 80 - gx)));
      p.y = APR_Y - (APR_Y - TAXI_OUT_Y) * progress;

      if (p.x >= HOLD1_X) {
        p.x = HOLD1_X;
        p.y = TAXI_OUT_Y;
        p.vx = 0;
        p.state = 'hold_short';
        p.t = 0;
      }
      break;
    }

    case 'hold_short': {
      // RWY1은 별도 관리 → 접근 확인 불필요 (RWY2 독립)
      if (claimRwy1(sim, p.id)) {
        p.x = RWY1_X0;
        p.y = RWY1_Y;
        p.state = 'lineup';
        p.t = 0;
      }
      break;
    }

    case 'lineup': {
      if (p.t > 2000) { p.state = 'takeoff'; p.t = 0; p.vx = 0; }
      break;
    }

    case 'takeoff': {
      p.vx = Math.min(p.vx + 0.07, 11);
      p.x += p.vx;
      if (p.vx > 7) {
        p.pitch = Math.min(p.pitch + 0.015, 0.30);
        p.y -= p.vx * Math.sin(p.pitch) * 0.65;
        if (p.pitch > 0.12) p.gearDown = false;
      }
      if (p.x > WORLD_W + 150) {
        releaseRwy1(sim, p.id);
        p.state = 'airborne';
        p.t = 0;
        stats.takeoffs++;
        p.flyT = rand(10000, 20000);
      }
      break;
    }

    case 'airborne': {
      if (p.t > p.flyT) {
        if (claimRwy2(sim, p.id)) {
          // 오른쪽 멀리서 접근 시작
          p.state = 'approach';
          p.t = 0;
          p.x = WORLD_W + 220;
          p.y = 185;
          p.vx = -3.5;
          p.vy = 1.85;
          p.pitch = -0.08;
          p.dir = -1;
          p.gearDown = true;
        } else {
          p.flyT += 3500;
        }
      }
      break;
    }

    case 'approach': {
      p.x += p.vx;
      if (p.y < RWY2_Y) p.y = Math.min(RWY2_Y, p.y + p.vy);
      // 착지: 활주로 위 + 고도 맞음
      if (p.y >= RWY2_Y && p.x <= RWY2_X1 && p.x >= RWY2_X0) {
        p.y = RWY2_Y;
        p.pitch = 0;
        p.state = 'landing';
        p.t = 0;
        stats.landings++;
      }
      break;
    }

    case 'landing': {
      p.x += p.vx;
      p.vx += 0.09;  // 감속 (vx가 음수 → 0쪽으로)
      if (p.vx > -0.9) {
        p.vx = -0.9;
        releaseRwy2(sim, p.id);
        p.state = 'taxi_in';
        p.t = 0;
      }
      break;
    }

    case 'taxi_in': {
      if (taxiInBlocked(p, planes)) {
        p.vx = 0;
      } else {
        p.vx = -0.7;
        p.x += p.vx;
      }

      // 활주로 벗어나면 도착 유도로로 내려감
      if (p.x < RWY2_X0 && p.y < TAXI_IN_Y) p.y = Math.min(TAXI_IN_Y, p.y + 0.5);
      // 게이트 근처에서 계류장으로 내려감
      if (p.x < p.gate.x + 120 && p.y < APR_Y) p.y = Math.min(APR_Y, p.y + 0.5);

      if (p.x <= p.gate.x && p.y >= APR_Y - 4) {
        p.x = p.gate.x;
        p.y = APR_Y;
        p.vx = 0;
        p.dir = 1;
        p.state = 'deboarding';
        p.t = 0;
        p.pax = p.cap;
      }
      break;
    }

    case 'deboarding': {
      if (p.pax > 0 && Math.random() < 0.30) {
        spawnDot(dots, p.x - 10, p.y - 6, p.gate.x + rand(-15, 15), APR_Y - 14, '#ffcc80');
        p.pax--;
        stats.pax++;
      }
      if (p.pax <= 0 && p.t > p.debordT) {
        p.state = 'done';  // 운항 완료 → 게이트 비움, 다음 등록 항공편에 배정
      }
      break;
    }
  }
}
