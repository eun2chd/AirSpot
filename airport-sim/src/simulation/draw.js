import {
  VIEW_W, VIEW_H, WORLD_W,
  GND_Y, APR_Y, TAXI_IN_Y, TAXI_OUT_Y, HOLD1_X,
  RWY1_Y, RWY1_H, RWY1_X0, RWY1_X1,
  RWY2_Y, RWY2_H, RWY2_X0, RWY2_X1,
  GATES,
} from './constants.js';
import { STARS } from './timeWeather.js';

// ── SKY (뷰포트 공간, translate 없이) ──────────────────────────
export function drawSky(ctx, { palette, ambient, sunPos, moonPos, phase }) {
  const g = ctx.createLinearGradient(0, 0, 0, GND_Y);
  g.addColorStop(0, palette[0]);
  g.addColorStop(0.5, palette[1]);
  g.addColorStop(1, palette[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, GND_Y);

  if (ambient < 0.75) {
    const a = Math.max(0, (0.75 - ambient) / 0.6);
    ctx.fillStyle = `rgba(255,255,255,${a * 0.85})`;
    STARS.forEach(([sx, sy, sr]) => {
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
    });
  }

  if (moonPos) {
    ctx.save();
    ctx.shadowBlur = 25; ctx.shadowColor = 'rgba(200,220,255,0.8)';
    ctx.beginPath(); ctx.arc(moonPos.x, moonPos.y, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#e8eaf6'; ctx.fill();
    ctx.fillStyle = 'rgba(0,0,30,0.12)';
    ctx.beginPath(); ctx.arc(moonPos.x + 6, moonPos.y - 4, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  if (sunPos) {
    const sunCol  = sunPos.low ? '#ffa726' : '#fff9c4';
    const glowCol = sunPos.low ? 'rgba(255,120,0,0.5)' : 'rgba(255,249,196,0.5)';
    ctx.save();
    ctx.shadowBlur = 60; ctx.shadowColor = glowCol;
    ctx.beginPath(); ctx.arc(sunPos.x, sunPos.y, sunPos.low ? 28 : 32, 0, Math.PI * 2);
    ctx.fillStyle = sunCol; ctx.fill();
    ctx.restore();
    if (sunPos.low) {
      const hg = ctx.createLinearGradient(0, GND_Y - 80, 0, GND_Y);
      hg.addColorStop(0, 'rgba(255,100,0,0)');
      hg.addColorStop(1, 'rgba(255,80,0,0.25)');
      ctx.fillStyle = hg;
      ctx.fillRect(0, GND_Y - 80, VIEW_W, 80);
    }
  }

  const cloudA = phase === 'night' ? 0.18 : 0.72;
  [[260, 75, 1.1], [680, 105, 0.85], [980, 55, 1.3], [480, 130, 0.7]]
    .forEach(([x, y, s]) => drawCloud(ctx, x, y, s, cloudA));
}

function drawCloud(ctx, cx, cy, s, alpha) {
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  [[0, 0, 26], [20, -8, 20], [-18, -5, 18], [38, 2, 15], [-34, 4, 14]]
    .forEach(([dx, dy, r]) => {
      ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2); ctx.fill();
    });
}

// ── 야간 오버레이 (뷰포트 공간) ────────────────────────────────
export function drawNightOverlay(ctx, ambient) {
  if (ambient >= 1) return;
  ctx.fillStyle = `rgba(0,0,15,${(1 - ambient) * 0.65})`;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

// ── 야간 조명 (세계 공간, translate 적용 후) ───────────────────
export function drawNightLights(ctx, ambient) {
  if (ambient > 0.7) return;
  const inten = 1 - ambient / 0.7;

  // 터미널 창문
  ctx.fillStyle = `rgba(255,220,100,${inten * 0.6})`;
  for (let wx = 18; wx < 950; wx += 30)
    for (let wy = GND_Y - 170; wy < GND_Y - 45; wy += 34)
      ctx.fillRect(wx, wy, 18, 20);

  // RWY1 엣지 라이트
  for (let x = RWY1_X0; x <= RWY1_X1; x += 70) {
    ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = `rgba(255,255,255,${inten * 0.9})`;
    ctx.beginPath(); ctx.arc(x, RWY1_Y - RWY1_H / 2 + 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, RWY1_Y + RWY1_H / 2 - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // RWY2 엣지 라이트
  for (let x = RWY2_X0; x <= RWY2_X1; x += 70) {
    ctx.save(); ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,255,255,0.9)';
    ctx.fillStyle = `rgba(255,255,255,${inten * 0.9})`;
    ctx.beginPath(); ctx.arc(x, RWY2_Y - RWY2_H / 2 + 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, RWY2_Y + RWY2_H / 2 - 2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 스레숄드 조명 (초록/빨간)
  const thresholds = [
    { x: RWY1_X0, col: '0,255,80' }, { x: RWY1_X1, col: '255,30,30' },
    { x: RWY2_X0, col: '0,255,80' }, { x: RWY2_X1, col: '255,30,30' },
  ];
  thresholds.forEach(({ x, col }) => {
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.shadowBlur = 10;
      ctx.shadowColor = ctx.fillStyle = `rgba(${col},${inten * 0.9})`;
      ctx.beginPath(); ctx.arc(x + (x < 1500 ? i * 12 : -i * 12), RWY1_Y, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });

  // 출발 유도로 파란 라이트
  for (let x = 0; x <= HOLD1_X; x += 45) {
    ctx.save(); ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(80,160,255,0.8)';
    ctx.fillStyle = `rgba(80,160,255,${inten * 0.7})`;
    ctx.beginPath(); ctx.arc(x, TAXI_OUT_Y, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // 도착 유도로 파란 라이트
  for (let x = 0; x <= RWY2_X0; x += 45) {
    ctx.save(); ctx.shadowBlur = 6; ctx.shadowColor = 'rgba(80,160,255,0.8)';
    ctx.fillStyle = `rgba(80,160,255,${inten * 0.6})`;
    ctx.beginPath(); ctx.arc(x, TAXI_IN_Y, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

// ── 지면 (세계 공간) ────────────────────────────────────────────
export function drawGround(ctx) {
  const g = ctx.createLinearGradient(0, GND_Y, 0, VIEW_H);
  g.addColorStop(0, '#37474f');
  g.addColorStop(1, '#263238');
  ctx.fillStyle = g;
  ctx.fillRect(0, GND_Y, WORLD_W, VIEW_H - GND_Y);

  // 터미널 앞 계류장 (밝은 콘크리트)
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  ctx.fillRect(0, GND_Y, RWY1_X0 + 10, VIEW_H - GND_Y);
}

// ── 터미널 (세계 공간) ──────────────────────────────────────────
export function drawTerminal(ctx) {
  const tx = 0, ty = GND_Y - 195, tw = 960, th = 195;

  // 건물 본체
  ctx.fillStyle = '#b0bec5';
  ctx.fillRect(tx, ty, tw, th);

  // 창문
  ctx.fillStyle = '#4fc3f7';
  for (let wx = tx + 18; wx < tx + tw - 25; wx += 32)
    for (let wy = ty + 20; wy < ty + th - 50; wy += 36)
      ctx.fillRect(wx, wy, 20, 22);

  // 지붕 띠
  ctx.fillStyle = '#78909c';
  ctx.fillRect(tx, ty, tw, 18);

  // 표지판
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('INTERNATIONAL TERMINAL', tx + tw / 2, ty + th - 10);

  // 게이트 브릿지
  GATES.forEach(gate => {
    ctx.fillStyle = '#263238';
    ctx.fillRect(gate.x - 10, GND_Y - 38, 20, 38);
    ctx.fillStyle = '#29b6f6';
    ctx.fillRect(gate.x - 8, GND_Y - 36, 18, 36);

    ctx.fillStyle = '#ffd54f';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(gate.id, gate.x, GND_Y + 11);

    // 게이트 연결 통로
    ctx.strokeStyle = '#607d8b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(gate.x, GND_Y);
    ctx.lineTo(gate.x, APR_Y - 20);
    ctx.stroke();
  });
}

// ── 관제탑 (세계 공간) ──────────────────────────────────────────
export function drawTower(ctx) {
  const tx = 975, tw = 38, baseY = GND_Y, topY = GND_Y - 215;

  ctx.beginPath();
  ctx.moveTo(tx, baseY); ctx.lineTo(tx + tw, baseY);
  ctx.lineTo(tx + tw - 4, topY + 65); ctx.lineTo(tx + 4, topY + 65);
  ctx.closePath();
  ctx.fillStyle = '#90a4ae'; ctx.fill();

  ctx.fillStyle = '#37474f';
  ctx.fillRect(tx - 12, topY, tw + 24, 65);
  ctx.fillStyle = '#4fc3f7';
  ctx.fillRect(tx - 8, topY + 6, tw + 16, 50);

  ctx.strokeStyle = '#cfd8dc'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(tx + tw / 2, topY); ctx.lineTo(tx + tw / 2, topY - 30); ctx.stroke();

  const blink = Math.sin(Date.now() * 0.006) > 0;
  ctx.save(); ctx.shadowBlur = blink ? 12 : 4; ctx.shadowColor = '#ff1744';
  ctx.fillStyle = blink ? '#ff1744' : '#7f0000';
  ctx.beginPath(); ctx.arc(tx + tw / 2, topY - 30, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#fff';
  ctx.font = '9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('TWR', tx + tw / 2, baseY + 12);
}

// ── 활주로 2개 (세계 공간) ──────────────────────────────────────
export function drawRunway(ctx) {
  const rwyLen = RWY1_X1 - RWY1_X0;

  // ── RWY1 이륙 ──
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(RWY1_X0, RWY1_Y - RWY1_H / 2, rwyLen, RWY1_H);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.strokeRect(RWY1_X0 + 1, RWY1_Y - RWY1_H / 2, rwyLen - 2, RWY1_H);

  // 중심선 대쉬
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([40, 28]);
  ctx.beginPath(); ctx.moveTo(RWY1_X0 + 80, RWY1_Y); ctx.lineTo(RWY1_X1 - 60, RWY1_Y); ctx.stroke();
  ctx.setLineDash([]);

  // 스레숄드 마킹
  drawThreshold(ctx, RWY1_X0, RWY1_Y, RWY1_H, true);
  drawThreshold(ctx, RWY1_X1, RWY1_Y, RWY1_H, false);

  // 레이블 (이륙)
  ctx.fillStyle = '#b2dfdb';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▲ 이륙 RWY 36L', RWY1_X0 + rwyLen / 2, RWY1_Y - RWY1_H / 2 - 5);

  // ── RWY2 착륙 ──
  ctx.fillStyle = '#546e7a';
  ctx.fillRect(RWY2_X0, RWY2_Y - RWY2_H / 2, rwyLen, RWY2_H);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
  ctx.strokeRect(RWY2_X0 + 1, RWY2_Y - RWY2_H / 2, rwyLen - 2, RWY2_H);

  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.setLineDash([40, 28]);
  ctx.beginPath(); ctx.moveTo(RWY2_X0 + 80, RWY2_Y); ctx.lineTo(RWY2_X1 - 60, RWY2_Y); ctx.stroke();
  ctx.setLineDash([]);

  drawThreshold(ctx, RWY2_X0, RWY2_Y, RWY2_H, true);
  drawThreshold(ctx, RWY2_X1, RWY2_Y, RWY2_H, false);

  ctx.fillStyle = '#f8bbd0';
  ctx.font = 'bold 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('▼ 착륙 RWY 18R', RWY2_X0 + rwyLen / 2, RWY2_Y + RWY2_H / 2 + 13);

  // HOLD SHORT 마킹
  ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(HOLD1_X, RWY1_Y - RWY1_H / 2 - 5);
  ctx.lineTo(HOLD1_X, RWY2_Y + RWY2_H / 2 + 5);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f9a825';
  ctx.font = 'bold 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('HOLD', HOLD1_X, RWY2_Y + RWY2_H / 2 + 22);
}

function drawThreshold(ctx, x, cy, h, isLeft) {
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 8; i++) {
    const ox = isLeft ? (14 + i * 18) : -(14 + i * 18 + 9);
    ctx.fillRect(x + ox, cy - h / 2 + 4, 9, h - 8);
  }
}

// ── 유도로 (세계 공간) ──────────────────────────────────────────
export function drawTaxiway(ctx) {
  // 출발 유도로 (RWY1 바로 아래)
  ctx.fillStyle = '#455a64';
  ctx.fillRect(0, TAXI_OUT_Y - 14, RWY1_X0 + 20, 28);

  // 도착 유도로 (RWY2 아래)
  ctx.fillStyle = '#3d5460';
  ctx.fillRect(0, TAXI_IN_Y - 14, RWY2_X0 + 20, 28);

  // 출발 유도로 중심선 (노란 점선)
  ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 1.5; ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(0, TAXI_OUT_Y);
  ctx.lineTo(HOLD1_X - 5, TAXI_OUT_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 도착 유도로 중심선 (노란 점선)
  ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 1.5; ctx.setLineDash([18, 14]);
  ctx.beginPath();
  ctx.moveTo(0, TAXI_IN_Y);
  ctx.lineTo(RWY2_X0 - 5, TAXI_IN_Y);
  ctx.stroke();
  ctx.setLineDash([]);

  // 터미널 연결 수직 유도로
  ctx.fillStyle = '#455a64';
  ctx.fillRect(RWY1_X0 - 22, TAXI_OUT_Y, 22, TAXI_IN_Y - TAXI_OUT_Y + 28);

  // 계류장 유도로 (게이트 앞)
  ctx.fillStyle = '#455a64';
  ctx.fillRect(0, APR_Y - 14, RWY1_X0 + 10, 28);
  ctx.strokeStyle = '#f9a825'; ctx.lineWidth = 1; ctx.setLineDash([14, 10]);
  ctx.beginPath(); ctx.moveTo(0, APR_Y); ctx.lineTo(RWY1_X0, APR_Y); ctx.stroke();
  ctx.setLineDash([]);
}

// ── 승객 점 (세계 공간) ─────────────────────────────────────────
export function drawDots(ctx, dots) {
  dots.forEach(d => {
    ctx.fillStyle = d.col;
    ctx.fillRect(d.x - 1, d.y - 2, 2, 4);
  });
}

// ── 비행 중 미니 아이콘 (뷰포트 공간) ──────────────────────────
export function drawAirborneMinis(ctx, planes) {
  const airborne = planes.filter(p => p.state === 'airborne');
  airborne.forEach((p, i) => {
    const mx = 200 + (i % 5) * 200 + Math.sin(Date.now() * 0.0003 + i) * 40;
    const my = 55 + Math.floor(i / 5) * 70 + Math.cos(Date.now() * 0.0002 + i) * 12;
    ctx.save();
    ctx.translate(mx, my);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillRect(-12, -2, 24, 4);
    ctx.fillRect(-4, 2, 8, 7);
    ctx.fillRect(-12, -6, 6, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.tail, 0, 18);
    ctx.restore();
  });
}

// ── 날씨 파티클 (뷰포트 공간) ───────────────────────────────────
export function drawWeather(ctx, particles) {
  particles.forEach(p => {
    if (p.type === 'rain') {
      ctx.save();
      ctx.strokeStyle = `rgba(160,200,255,${p.alpha})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 1.5, p.y + p.len);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'snow') {
      ctx.save();
      ctx.shadowBlur = 4; ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (p.type === 'petal') {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(255,182,193,${p.alpha})`;
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (p.type === 'leaf') {
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.col.replace(')', `,${p.alpha})`).replace('rgb', 'rgba');
      ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.45, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  });
}

// ── 비행기 (세계 공간) ──────────────────────────────────────────
export function drawPlane(ctx, p) {
  if (p.state === 'airborne') return;

  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.dir < 0) ctx.scale(-1, 1);
  ctx.rotate(-p.pitch);
  drawPlaneShape(ctx, p.airline.body, p.airline.tail, p.gearDown);
  ctx.restore();

  // 광고 배너 (꼬리 날개 위, 텍스트는 뒤집기 문제 없도록 세계 공간에서 그림)
  if (p.sponsor) {
    const tailX = p.dir > 0 ? p.x - 38 : p.x + 38;
    const tailY = p.y - 20;
    ctx.save();
    ctx.fillStyle = '#f57f17';
    ctx.fillRect(tailX - 14, tailY - 7, 28, 12);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.sponsor, tailX, tailY);
    ctx.textBaseline = 'alphabetic';
    ctx.restore();
  }

  // hold_short 표시
  if (p.state === 'hold_short') {
    ctx.fillStyle = '#f9a825';
    ctx.font = 'bold 9px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD', p.x, p.y - 42);
  }

  // 탑승/하기 중 꼬리번호
  if (p.state === 'boarding' || p.state === 'deboarding') {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = '8px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(p.tail, p.x, p.y - 38);
  }
}

function drawPlaneShape(ctx, bodyCol, tailCol, gear) {
  if (gear) {
    ctx.fillStyle = '#444';
    ctx.fillRect(-16, 12, 3, 11);
    ctx.fillRect(7, 12, 4, 13);
    ctx.fillRect(16, 12, 4, 13);
    [[-14, 23], [9, 25], [18, 25]].forEach(([x, y]) => {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fillStyle = '#222'; ctx.fill();
    });
  }

  // 동체
  ctx.beginPath();
  ctx.moveTo(-44, 0);
  ctx.lineTo(-40, -5); ctx.lineTo(28, -8);
  ctx.quadraticCurveTo(46, -8, 52, -3);
  ctx.quadraticCurveTo(56, 0, 52, 3);
  ctx.quadraticCurveTo(46, 8, 28, 8);
  ctx.lineTo(-40, 5);
  ctx.closePath();
  ctx.fillStyle = '#f0f0f0'; ctx.fill();
  ctx.strokeStyle = '#bbb'; ctx.lineWidth = 0.5; ctx.stroke();

  // 항공사 스트라이프
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.moveTo(-40, -2); ctx.lineTo(46, -2); ctx.lineTo(46, 3); ctx.lineTo(-40, 3);
  ctx.closePath(); ctx.fill();

  // 창문
  ctx.fillStyle = '#b3e5fc';
  for (let i = 0; i < 9; i++) ctx.fillRect(24 - i * 8, -6, 5, 4);

  // 날개
  ctx.beginPath();
  ctx.moveTo(18, 6); ctx.lineTo(-6, 6); ctx.lineTo(-22, 34); ctx.lineTo(8, 34);
  ctx.closePath();
  ctx.fillStyle = '#d8d8d8'; ctx.fill();
  ctx.strokeStyle = '#aaa'; ctx.lineWidth = 0.5; ctx.stroke();

  // 엔진
  ctx.beginPath(); ctx.ellipse(3, 25, 14, 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#9e9e9e'; ctx.fill();
  ctx.beginPath(); ctx.arc(-10, 25, 4, 0, Math.PI * 2); ctx.fillStyle = '#555'; ctx.fill();

  // 수직 꼬리
  ctx.beginPath();
  ctx.moveTo(-32, -5); ctx.lineTo(-44, -5); ctx.lineTo(-44, -32); ctx.lineTo(-32, -12);
  ctx.closePath();
  ctx.fillStyle = tailCol; ctx.fill();

  // 수평 꼬리
  ctx.beginPath();
  ctx.moveTo(-36, 4); ctx.lineTo(-42, 4); ctx.lineTo(-46, 18); ctx.lineTo(-40, 18);
  ctx.closePath();
  ctx.fillStyle = '#e0e0e0'; ctx.fill();
}
