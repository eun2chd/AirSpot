import { useState } from 'react';
import { registerFlight } from '../api.js';

const panelStyle = {
  position: 'fixed', top: 10, left: 10,
  background: 'rgba(7,21,38,0.92)',
  border: '1px solid var(--bg-3)',
  borderRadius: 6, padding: '10px 13px',
  color: 'var(--text-2)', fontFamily: 'var(--font-terminal)',
  fontSize: 11, minWidth: 215,
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)', border: '1px solid var(--bg-3)',
  borderRadius: 3, color: 'var(--text-1)', fontFamily: 'inherit', fontSize: 11,
  padding: '5px 6px', marginTop: 3, marginBottom: 7,
};

export default function RegisterPanel({ today, onRegistered }) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const data = await registerFlight({ name, desc, link });
      setResult(data);
      setName(''); setDesc(''); setLink('');
      onRegistered?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={panelStyle}>
      <div style={{ color: 'var(--neon-1)', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginBottom: 6 }}>
        내 비행기 띄우기
      </div>

      {today && (
        <div style={{ color: 'var(--text-muted-1)', fontSize: 10, marginBottom: 8 }}>
          오늘의 슬롯 {today.activeCount}/{today.capacity}
          {today.remaining <= 0 && ' · 마감, 등록하면 대기열로'}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <label>
          비행기 이름
          <input
            style={inputStyle} value={name} maxLength={20}
            onChange={e => setName(e.target.value)}
            placeholder="예: Strawberry Air" required
          />
        </label>
        <label>
          한 줄 문구
          <input
            style={inputStyle} value={desc} maxLength={40}
            onChange={e => setDesc(e.target.value)}
            placeholder="예: 오늘의 추천 제품" required
          />
        </label>
        <label>
          링크 (선택)
          <input
            style={inputStyle} value={link} maxLength={200} type="url"
            onChange={e => setLink(e.target.value)}
            placeholder="https://..."
          />
        </label>

        <button
          type="submit" disabled={busy}
          style={{
            width: '100%', padding: '6px 0', borderRadius: 3, border: 'none',
            background: busy ? 'var(--bg-3)' : 'var(--neon-1)',
            color: busy ? 'var(--text-muted-1)' : 'var(--bg-1)',
            fontFamily: 'inherit', fontSize: 11, fontWeight: 'bold',
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {busy ? '등록 중...' : '오늘 공항에 띄우기'}
        </button>
      </form>

      {error && (
        <div style={{ color: 'var(--danger-1)', fontSize: 10, marginTop: 7 }}>
          등록 실패: {error}
        </div>
      )}

      {result && (
        <div style={{
          marginTop: 8, paddingTop: 7, borderTop: '1px solid var(--bg-3)',
          fontSize: 10, color: 'var(--text-1)',
        }}>
          {result.status === 'active'
            ? <>오늘 {result.slotNo}번째 출발편으로 등록되었습니다.</>
            : <>오늘 슬롯이 가득 찼습니다. 대기 순번 {result.queuePosition}번 — 내일 첫 출발편으로 자동 배정됩니다.</>}
          <br />
          항공편 코드: <span style={{ color: 'var(--neon-1)', fontWeight: 'bold' }}>{result.code}</span>
        </div>
      )}
    </div>
  );
}
