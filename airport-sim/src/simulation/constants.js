// 뷰포트
export const VIEW_W = 1380;
export const VIEW_H = 700;

// 지평선
export const GND_Y = 380;

// 지상 레이아웃 (y는 아래로 증가)
export const APR_Y      = 560;  // 계류장/게이트
export const TAXI_IN_Y  = 498;  // 도착 유도로
export const TAXI_OUT_Y = 430;  // 출발 유도로

// 게이트 8개 (터미널 브릿지 연결)
export const GATES = [
  { id:'A1', x:90  }, { id:'A2', x:200 }, { id:'A3', x:310 }, { id:'A4', x:420 },
  { id:'A5', x:530 }, { id:'A6', x:640 }, { id:'A7', x:750 }, { id:'A8', x:860 },
];

// 원격 주기장 (게이트 없이 계류만 하는 구역, 최대 42대 — 게이트 8 + 주기장 42 = 총 50대 수용)
const APRON_START   = 900;
const APRON_SPACING = 34;
const APRON_COUNT   = 42;
export const APRON_STANDS = Array.from({ length: APRON_COUNT }, (_, i) => ({
  id: `P${i + 1}`,
  x: APRON_START + i * APRON_SPACING,
}));
const APRON_END = APRON_START + (APRON_COUNT - 1) * APRON_SPACING;

export const HOLD1_X  = APRON_END + 90;   // 이륙 대기선 x
export const RWY1_X0  = HOLD1_X + 40;

// 이륙 전용 활주로 (RWY1)
export const RWY1_Y  = 406;  // 중심 y
export const RWY1_H  = 34;
export const RWY1_X1 = RWY1_X0 + 1460;

// 착륙 전용 활주로 (RWY2, RWY1과 동일 구간)
export const RWY2_Y  = 464;  // 중심 y
export const RWY2_H  = 34;
export const RWY2_X0 = RWY1_X0;
export const RWY2_X1 = RWY1_X1;

// 세계 크기 (드래그로 스크롤) — 활주로 끝 + 이륙 활주 여유
export const WORLD_W = RWY1_X1 + 40;
export const WORLD_H = 700;

export const AIRLINES = [
  { name:'KorAir',    body:'#1a237e', tail:'#c62828' },
  { name:'SunAir',   body:'#e65100', tail:'#1565c0' },
  { name:'GreenWing',body:'#1b5e20', tail:'#f9a825' },
  { name:'RedStar',  body:'#880e4f', tail:'#e0e0e0' },
  { name:'BlueSky',  body:'#006064', tail:'#00bcd4' },
  { name:'JinAir',   body:'#4a148c', tail:'#e040fb' },
];

export const STATE_LABEL = {
  boarding:   '탑승 중',
  pushback:   '↩ 후진',
  taxi_out:   '→ 지상이동 (출발)',
  hold_short: '이륙 대기',
  lineup:     '이륙 준비',
  takeoff:    '▲ 이륙 활주',
  airborne:   '비행 중',
  approach:   '↘ 접근 중',
  landing:    '▼ 착륙 중',
  taxi_in:    '← 지상이동 (도착)',
  deboarding: '하기 중',
};
