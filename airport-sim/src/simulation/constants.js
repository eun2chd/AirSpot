// 뷰포트
export const VIEW_W = 1380;
export const VIEW_H = 700;

// 세계 크기 (드래그로 스크롤)
export const WORLD_W = 2500;
export const WORLD_H = 700;

// 지평선
export const GND_Y = 380;

// 지상 레이아웃 (y는 아래로 증가)
export const APR_Y      = 560;  // 계류장/게이트
export const TAXI_IN_Y  = 498;  // 도착 유도로
export const TAXI_OUT_Y = 430;  // 출발 유도로
export const HOLD1_X    = 960;  // 이륙 대기선 x

// 이륙 전용 활주로 (RWY1)
export const RWY1_Y  = 406;  // 중심 y
export const RWY1_H  = 34;
export const RWY1_X0 = 1000;
export const RWY1_X1 = 2460;

// 착륙 전용 활주로 (RWY2)
export const RWY2_Y  = 464;  // 중심 y
export const RWY2_H  = 34;
export const RWY2_X0 = 1000;
export const RWY2_X1 = 2460;

// 게이트 8개
export const GATES = [
  { id:'A1', x:90  }, { id:'A2', x:200 }, { id:'A3', x:310 }, { id:'A4', x:420 },
  { id:'A5', x:530 }, { id:'A6', x:640 }, { id:'A7', x:750 }, { id:'A8', x:860 },
];

export const AIRLINES = [
  { name:'KorAir',    body:'#1a237e', tail:'#c62828' },
  { name:'SunAir',   body:'#e65100', tail:'#1565c0' },
  { name:'GreenWing',body:'#1b5e20', tail:'#f9a825' },
  { name:'RedStar',  body:'#880e4f', tail:'#e0e0e0' },
  { name:'BlueSky',  body:'#006064', tail:'#00bcd4' },
  { name:'JinAir',   body:'#4a148c', tail:'#e040fb' },
];

export const SPONSORS = ['롯데', '삼성', 'SK', '현대', 'LG', '카카오', '쿠팡', 'KB'];

export const STATE_LABEL = {
  boarding:   '✈ 탑승 중',
  pushback:   '↩ 후진',
  taxi_out:   '→ 지상이동 (출발)',
  hold_short: '🛑 이륙 대기',
  lineup:     '⏳ 이륙 준비',
  takeoff:    '🚀 이륙 활주',
  airborne:   '☁ 비행 중',
  approach:   '↘ 접근 중',
  landing:    '🛬 착륙 중',
  taxi_in:    '← 지상이동 (도착)',
  deboarding: '🚶 하기 중',
};
