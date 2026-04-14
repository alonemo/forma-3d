import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageLoader() {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    setProgress(0);

    const t1 = setTimeout(() => setProgress(65), 40);
    const t2 = setTimeout(() => setProgress(85), 250);
    const t3 = setTimeout(() => setProgress(100), 500);
    const t4 = setTimeout(() => setVisible(false), 750);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [location.pathname]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 9999,
      pointerEvents: 'none',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #00e5ff, #7c4dff)',
        boxShadow: '0 0 10px rgba(0,229,255,0.7)',
        transition: progress === 0 ? 'none' : 'width 0.4s ease',
        borderRadius: '0 2px 2px 0',
      }} />
    </div>
  );
}
