import { useState, useCallback } from 'react';
import AirportCanvas from './components/AirportCanvas.jsx';
import StatusPanel from './components/StatusPanel.jsx';

export default function App() {
  const [hud, setHud] = useState({
    planes: [], stats: { takeoffs:0, landings:0, pax:0 },
    timeInfo: { hour:12, phase:'day' },
    wx: { season:'summer', type:'rain' },
  });

  const handleStats = useCallback((data) => setHud(data), []);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, paddingTop:6 }}>
      <AirportCanvas onStats={handleStats} />
      <StatusPanel
        planes={hud.planes}
        stats={hud.stats}
        timeInfo={hud.timeInfo}
        wx={hud.wx}
      />
    </div>
  );
}
