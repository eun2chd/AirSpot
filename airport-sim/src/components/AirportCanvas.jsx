import { useEffect, useRef } from 'react';
import { VIEW_W, VIEW_H, WORLD_W } from '../simulation/constants.js';
import { createSimulation, updateSimulation, addToRegistry } from '../simulation/engine.js';
import {
  drawSky, drawGround, drawNightOverlay, drawNightLights,
  drawTerminal, drawTower, drawRunway, drawTaxiway, drawApron,
  drawDots, drawAirborneMinis, drawPlane, drawWeather,
} from '../simulation/draw.js';
import {
  getKSTHour, getSeason, getTimePhase,
  SKY_PALETTE, getAmbient, getSunPos, getMoonPos,
} from '../simulation/timeWeather.js';

export default function AirportCanvas({ onStats, registryFlights }) {
  const canvasRef    = useRef(null);
  const simRef       = useRef(null);
  const rafRef       = useRef(null);
  const lastTRef     = useRef(0);
  const onStatsRef   = useRef(onStats);
  const camRef       = useRef({ x: 0, y: 0 });
  const dragRef      = useRef({ active: false, lx: 0, ly: 0 });

  // Keep onStatsRef always pointing to the latest prop
  onStatsRef.current = onStats;

  useEffect(() => {
    simRef.current = createSimulation();
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');

    // ── 드래그 팬 ────────────────────────────────────────────
    function getScale() {
      const rect = canvas.getBoundingClientRect();
      return VIEW_W / rect.width;
    }

    function onMouseDown(e) {
      dragRef.current = { active: true, lx: e.clientX, ly: e.clientY };
      canvas.style.cursor = 'grabbing';
    }
    function onMouseMove(e) {
      const d = dragRef.current;
      if (!d.active) return;
      const sc = getScale();
      const dx = (e.clientX - d.lx) * sc;
      d.lx = e.clientX; d.ly = e.clientY;
      const maxX = WORLD_W - VIEW_W;
      camRef.current.x = Math.max(0, Math.min(maxX, camRef.current.x - dx));
    }
    function onMouseUp() {
      dragRef.current.active = false;
      canvas.style.cursor = 'grab';
    }
    function onTouchStart(e) {
      const t = e.touches[0];
      dragRef.current = { active: true, lx: t.clientX, ly: t.clientY };
    }
    function onTouchMove(e) {
      e.preventDefault();
      const d = dragRef.current;
      if (!d.active) return;
      const t = e.touches[0];
      const sc = getScale();
      const dx = (t.clientX - d.lx) * sc;
      d.lx = t.clientX; d.ly = t.clientY;
      const maxX = WORLD_W - VIEW_W;
      camRef.current.x = Math.max(0, Math.min(maxX, camRef.current.x - dx));
    }

    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('mousemove',  onMouseMove);
    canvas.addEventListener('mouseup',    onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onMouseUp);
    canvas.style.cursor = 'grab';

    // ── 렌더 루프 ────────────────────────────────────────────
    function loop(ts) {
      const dt = Math.min(ts - lastTRef.current, 50);
      lastTRef.current = ts;

      try {
        updateSimulation(simRef.current, dt);
      } catch(e) {
        console.error('SIM ERROR', e);
      }

      const hour    = getKSTHour();
      const phase   = getTimePhase(hour);
      const palette = SKY_PALETTE[phase];
      const ambient = getAmbient(phase);
      const sunPos  = getSunPos(hour);
      const moonPos = getMoonPos(hour);
      const timeInfo = { hour, phase, palette, ambient, sunPos, moonPos };

      const { planes, dots, stats, wx } = simRef.current;
      const cam = camRef.current;

      ctx.clearRect(0, 0, VIEW_W, VIEW_H);

      // 1. 하늘 (뷰포트 공간, translate 없음)
      drawSky(ctx, timeInfo);

      // 2. 세계 공간 오브젝트 (카메라 오프셋 적용)
      ctx.save();
      ctx.translate(-cam.x, 0);

      drawGround(ctx);
      drawTerminal(ctx);
      drawTower(ctx);
      drawRunway(ctx);
      drawTaxiway(ctx);
      drawApron(ctx);
      drawDots(ctx, dots);
      planes.forEach(p => drawPlane(ctx, p));
      drawNightLights(ctx, ambient);

      ctx.restore();

      // 3. 뷰포트 공간 오버레이
      drawAirborneMinis(ctx, planes);
      drawWeather(ctx, wx.particles);
      drawNightOverlay(ctx, ambient);

      // 4. 스크롤 힌트 (카메라가 맨 왼쪽일 때)
      if (cam.x < 50) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'right';
        ctx.fillText('← 드래그해서 활주로 보기 →', VIEW_W - 16, VIEW_H - 14);
        ctx.restore();
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);  // start the loop

    // HUD: poll sim state every 500ms using ref so closure is never stale
    const hudInterval = setInterval(() => {
      if (!simRef.current) return;
      const { planes, stats, wx } = simRef.current;
      const hour     = getKSTHour();
      const phase    = getTimePhase(hour);
      const palette  = SKY_PALETTE[phase];
      const ambient  = getAmbient(phase);
      const sunPos   = getSunPos(hour);
      const moonPos  = getMoonPos(hour);
      const timeInfo = { hour, phase, palette, ambient, sunPos, moonPos };
      onStatsRef.current?.({ planes: [...planes], stats: { ...stats }, timeInfo, wx });
    }, 500);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(hudInterval);
      canvas.removeEventListener('mousedown',  onMouseDown);
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('mouseup',    onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onMouseUp);
    };
  }, []);

  useEffect(() => {
    if (simRef.current && registryFlights?.length) {
      addToRegistry(simRef.current, registryFlights);
    }
  }, [registryFlights]);

  return (
    <div style={{ width: '100vw', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        width={VIEW_W}
        height={VIEW_H}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          border: '1px solid #1a3a5c',
          borderRadius: 4,
          userSelect: 'none',
        }}
      />
    </div>
  );
}
