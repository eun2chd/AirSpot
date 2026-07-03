import { STATE_LABEL } from '../simulation/constants.js';
import { SEASON_LABEL, PHASE_LABEL } from '../simulation/timeWeather.js';

export default function StatusPanel({ planes, stats, timeInfo, wx }) {
  const hour = timeInfo?.hour ?? 12;
  const hh = Math.floor(hour);
  const mm = String(Math.floor((hour % 1) * 60)).padStart(2, '0');
  const phase = timeInfo?.phase ?? 'day';
  const season = wx?.season ?? 'summer';

  return (
    <div style={{
      position: 'fixed', top: 10, right: 10,
      background: 'rgba(5,15,35,0.92)',
      border: '1px solid #1a4060',
      borderRadius: 6, padding: '10px 13px',
      color: '#7ec8e3', fontFamily: "'Courier New', monospace",
      fontSize: 11, minWidth: 215,
    }}>
      {/* 시간/계절 */}
      <div style={{ borderBottom: '1px solid #1a4060', paddingBottom: 6, marginBottom: 7 }}>
        <div style={{ color: '#00e5ff', fontSize: 13, fontWeight: 'bold', letterSpacing: 1 }}>
          ✈ AIRPORT LIVE
        </div>
        <div style={{ color: '#aaa', marginTop: 3, fontSize: 10 }}>
          🕐 KST {hh}:{mm} &nbsp;·&nbsp; {PHASE_LABEL[phase] ?? phase}
        </div>
        <div style={{ color: '#aaa', fontSize: 10 }}>
          {SEASON_LABEL[season] ?? season}
        </div>
      </div>

      {/* 비행기 목록 */}
      {planes.map(p => {
        const col = p.airline.body === '#1a237e' ? '#90caf9' : p.airline.body;
        const isHold = p.state === 'hold_short';
        return (
          <div key={p.id} style={{
            margin: '3px 0', padding: '4px 6px',
            borderRadius: 3, background: 'rgba(255,255,255,0.04)',
            borderLeft: `2px solid ${isHold ? '#f9a825' : p.state === 'airborne' ? '#2196f3' : '#1a4060'}`,
          }}>
            <span style={{ fontWeight: 'bold', color: col }}>{p.tail}</span>
            <span style={{ color: '#555' }}> {p.airline.name}</span>
            {p.state === 'boarding' && (
              <span style={{ color: '#666' }}> {p.pax}/{p.cap}</span>
            )}
            <br />
            <span style={{ fontSize: 10, color: isHold ? '#f9a825' : '#aaa' }}>
              [{p.gate.id}] {STATE_LABEL[p.state] ?? p.state}
            </span>
          </div>
        );
      })}

      {/* 통계 */}
      <div style={{
        marginTop: 8, paddingTop: 7, borderTop: '1px solid #1a4060',
        display: 'flex', gap: 6,
      }}>
        <Stat value={stats?.takeoffs ?? 0} label="이륙" color="#4caf50" />
        <Stat value={stats?.landings ?? 0} label="착륙" color="#2196f3" />
        <Stat value={(stats?.pax ?? 0).toLocaleString()} label="승객" color="#ff9800" />
      </div>
    </div>
  );
}

function Stat({ value, label, color }) {
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: 14, fontWeight: 'bold', color }}>{value}</div>
      <div style={{ fontSize: 9, color: '#555', marginTop: 1 }}>{label}</div>
    </div>
  );
}
