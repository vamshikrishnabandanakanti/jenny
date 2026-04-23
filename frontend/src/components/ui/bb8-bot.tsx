import React, { useState, useEffect, useRef } from 'react';
import './bb8-bot.css';

export const BB8Bot = ({ onClick }: { onClick?: () => void }) => {
  const [rotation, setRotation] = useState(0);
  const botRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!botRef.current) return;
      
      const rect = botRef.current.getBoundingClientRect();
      const botCenterX = rect.left + rect.width / 2;
      
      // Calculate horizontal distance from center
      const deltaX = e.clientX - botCenterX;
      
      // Map horizontal distance to a rotation range (-25 to 25 degrees)
      // The further the mouse is, the more the head turns
      const maxRotation = 25;
      const sensitivity = 500; // Pixels for max rotation
      const targetRotation = Math.max(-maxRotation, Math.min(maxRotation, (deltaX / sensitivity) * maxRotation));
      
      setRotation(targetRotation);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bb8-wrapper" ref={botRef} onClick={onClick}>
      <div className="bb8-tag">How can I help you today?</div>
      <div className="bb8">
        <div className="bb8__head-container" style={{ transform: `rotate(${rotation}deg)` }}>
          <div className="bb8__antenna" />
          <div className="bb8__antenna" />
          <div className="bb8__head" />
        </div>
        <div className="bb8__body" />
      </div>
      <div className="artificial__hidden">
        <div className="bb8__shadow" style={{ transform: `skew(${rotation > 0 ? 70 - rotation : -70 - rotation}deg)` }} />
      </div>
    </div>
  );
};
