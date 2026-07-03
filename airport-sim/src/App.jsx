import { useState, useCallback, useEffect } from 'react';
import AirportCanvas from './components/AirportCanvas.jsx';
import StatusPanel from './components/StatusPanel.jsx';
import RegisterPanel from './components/RegisterPanel.jsx';
import { fetchToday } from './api.js';

export default function App() {
  const [hud, setHud] = useState({
    planes: [], stats: { takeoffs:0, landings:0, pax:0 },
    timeInfo: { hour:12, phase:'day' },
    wx: { season:'summer', type:'rain' },
  });
  const [today, setToday] = useState(null);

  const handleStats = useCallback((data) => setHud(data), []);

  const refreshToday = useCallback(async () => {
    try {
      setToday(await fetchToday());
    } catch (err) {
      console.error('failed to load today status', err);
    }
  }, []);

  useEffect(() => {
    refreshToday();
    const id = setInterval(refreshToday, 10000);
    return () => clearInterval(id);
  }, [refreshToday]);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, paddingTop:6 }}>
      <AirportCanvas onStats={handleStats} registryFlights={today?.flights ?? []} />
      <StatusPanel
        planes={hud.planes}
        stats={hud.stats}
        timeInfo={hud.timeInfo}
        wx={hud.wx}
        today={today}
      />
      <RegisterPanel today={today} onRegistered={refreshToday} />
    </div>
  );
}
