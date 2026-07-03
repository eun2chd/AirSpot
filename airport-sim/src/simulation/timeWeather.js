import { GND_Y } from './constants.js';

export function getKSTHour() {
  const d = new Date();
  return ((d.getUTCHours() + 9) % 24) + d.getUTCMinutes() / 60;
}

export function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

export function getTimePhase(h) {
  if (h < 4  || h >= 22) return 'night';
  if (h < 6)              return 'dawn';
  if (h < 8)              return 'sunrise';
  if (h < 17)             return 'day';
  if (h < 19)             return 'sunset';
  return 'dusk';
}

export const SKY_PALETTE = {
  night:   ['#000010', '#000428', '#001a40'],
  dawn:    ['#050523', '#1c1c6e', '#c05820'],
  sunrise: ['#1a237e', '#b0621a', '#ffc044'],
  day:     ['#0d1b4b', '#1565c0', '#42a5f5'],
  sunset:  ['#1a237e', '#991818', '#e07800'],
  dusk:    ['#06061e', '#2a1a48', '#7b1f2e'],
};

export function getAmbient(phase) {
  return { night:0.15, dawn:0.42, sunrise:0.72, day:1.0, sunset:0.78, dusk:0.32 }[phase] ?? 1;
}

// Fixed star positions (seeded)
export const STARS = Array.from({ length: 160 }, (_, i) => [
  Math.abs((i * 13751 + i * i * 37) % 1380),
  Math.abs((i * 9753  + i * i * 41) % 390) * 0.88,
  0.3 + (i % 4) * 0.4,
]);

export function getSunPos(h) {
  if (h <= 5 || h >= 20) return null;
  const t = (h - 6) / 12;
  return {
    x: Math.max(60, Math.min(1320, t * 1380)),
    y: GND_Y * 0.85 - GND_Y * 0.65 * Math.sin(Math.max(0, t) * Math.PI),
    low: h < 8 || h > 17,
  };
}

export function getMoonPos(h) {
  if (h >= 6 && h <= 20) return null;
  const t = h >= 20 ? (h - 20) / 14 : (h + 4) / 14;
  return {
    x: 80 + t * 1220,
    y: 50 + 55 * (1 - Math.sin(t * Math.PI)),
  };
}

// Season → default weather type
export const SEASON_WEATHER = {
  spring: 'petals',
  summer: 'rain',    // 한국 장마철
  autumn: 'leaves',
  winter: 'snow',
};

// Spawn one weather particle based on season
export function spawnWeatherParticle(season, W) {
  const type = SEASON_WEATHER[season];
  if (!type) return null;

  if (type === 'rain') {
    return {
      type: 'rain',
      x: Math.random() * (W + 200) - 100,
      y: -20,
      vx: -2.5,
      vy: 16 + Math.random() * 8,
      len: 10 + Math.random() * 10,
      alpha: 0.35 + Math.random() * 0.35,
    };
  }
  if (type === 'snow') {
    return {
      type: 'snow',
      x: Math.random() * W,
      y: -8,
      vx: (Math.random() - 0.5) * 0.8,
      vy: 0.8 + Math.random() * 1.4,
      r: 1.5 + Math.random() * 2.5,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.75 + Math.random() * 0.25,
    };
  }
  if (type === 'petals') {
    return {
      type: 'petal',
      x: Math.random() * W,
      y: -10,
      vx: (Math.random() - 0.4) * 1.5,
      vy: 0.6 + Math.random() * 0.8,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.06,
      r: 3 + Math.random() * 4,
      alpha: 0.6 + Math.random() * 0.4,
    };
  }
  if (type === 'leaves') {
    return {
      type: 'leaf',
      x: Math.random() * W,
      y: -10,
      vx: (Math.random() - 0.3) * 2.5,
      vy: 0.5 + Math.random() * 1.2,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.1,
      r: 4 + Math.random() * 5,
      col: ['#d84315','#e65100','#f57f17','#ff8f00','#558b2f'][Math.floor(Math.random()*5)],
      alpha: 0.8,
    };
  }
  return null;
}

export function updateWeatherParticle(p) {
  if (p.type === 'rain') {
    p.x += p.vx; p.y += p.vy;
  } else if (p.type === 'snow') {
    p.wobble += p.wobbleSpeed;
    p.x += p.vx + Math.sin(p.wobble) * 0.5;
    p.y += p.vy;
  } else if (p.type === 'petal' || p.type === 'leaf') {
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vrot;
  }
}

export const SEASON_LABEL = {
  spring: '봄', summer: '여름 (장마)', autumn: '가을', winter: '겨울',
};
export const PHASE_LABEL = {
  night: '야간', dawn: '새벽', sunrise: '일출', day: '낮', sunset: '일몰', dusk: '황혼',
};
