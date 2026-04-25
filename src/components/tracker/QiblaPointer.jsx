import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Navigation2, Compass } from 'lucide-react';
import { useLocation } from '@/lib/LocationContext';

const KAABA_LAT = 21.422487;
const KAABA_LON = 39.826206;

function calculateQibla(lat, lon) {
  const phiK = (KAABA_LAT * Math.PI) / 180.0;
  const lambdaK = (KAABA_LON * Math.PI) / 180.0;
  const phi = (lat * Math.PI) / 180.0;
  const lambda = (lon * Math.PI) / 180.0;

  const y = Math.sin(lambdaK - lambda);
  const x = Math.cos(phi) * Math.tan(phiK) - Math.sin(phi) * Math.cos(lambdaK - lambda);

  let qibla = (Math.atan2(y, x) * 180.0) / Math.PI;
  return (qibla + 360) % 360;
}

function getCompassDirection(degrees) {
  const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const index = Math.round(((degrees %= 360) < 0 ? degrees + 360 : degrees) / 22.5) % 16;
  return directions[index];
}

const KaabaIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]">
    {/* Base Cube Isometric */}
    <path d="M12 21l8-4V9l-8-4-8 4v8l8 4z" />
    <path d="M4 9l8 4 8-4" />
    <path d="M12 13v8" />
    {/* Gold trim (kiswah band) */}
    <path d="M4.5 11l7.5 3.75 7.5-3.75" strokeWidth="1.5" className="opacity-80" />
    <path d="M5.5 13l6.5 3.25 6.5-3.25" strokeWidth="0.5" className="opacity-60" />
  </svg>
);

export default function QiblaPointer() {
  const { location } = useLocation();
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location && location.type === 'coords' && location.lat && location.lon) {
      setQiblaAngle(calculateQibla(location.lat, location.lon));
    } else {
      setQiblaAngle(null);
    }
  }, [location]);

  useEffect(() => {
    const handleOrientation = (e) => {
      let compassHeading;

      if (e.webkitCompassHeading !== undefined && e.webkitCompassHeading !== null) {
        // iOS — webkitCompassHeading is degrees clockwise from true North, ready to use
        compassHeading = e.webkitCompassHeading;
      } else if (e.absolute && e.alpha !== null) {
        // Android with absolute orientation — alpha is CCW from North, convert to CW
        compassHeading = (360 - e.alpha) % 360;
      } else if (e.alpha !== null) {
        // Fallback for non-absolute — same conversion; may not be true North on all devices
        compassHeading = (360 - e.alpha) % 360;
      }

      if (compassHeading !== undefined) {
        setHeading(compassHeading);
      }
    };

    if (
      window.DeviceOrientationEvent &&
      typeof window.DeviceOrientationEvent.requestPermission === 'function'
    ) {
      // iOS 13+ requires explicit permission
      setNeedsPermission(true);
    } else {
      // Prefer absolute orientation; fall back to relative
      window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestPermission = async () => {
    try {
      const response = await DeviceOrientationEvent.requestPermission();
      if (response === 'granted') {
        setNeedsPermission(false);
        window.addEventListener('deviceorientation', (e) => {
          const compassHeading = e.webkitCompassHeading ?? (360 - e.alpha) % 360;
          setHeading(compassHeading);
        });
      } else {
        setError('Permission denied');
      }
    } catch (e) {
      setError('Compass not supported');
    }
  };

  // How many degrees off from Qibla the device is pointing (0 = on target)
  const diff = qiblaAngle !== null ? ((heading - qiblaAngle + 360) % 360) : 180;
  const isPointed = qiblaAngle !== null && (diff < 5 || diff > 355);

  // The arrow rotation on screen = qiblaAngle − heading
  // (qiblaAngle is absolute from North; heading tells us how much North has rotated on screen)
  const arrowRotation = qiblaAngle !== null ? (qiblaAngle - heading + 360) % 360 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center text-center relative overflow-hidden">

      {/* Background aesthetic glow when pointed correctly */}
      <div className={`absolute inset-0 bg-primary/10 transition-opacity duration-1000 pointer-events-none ${isPointed ? 'opacity-100' : 'opacity-0'}`} />

      {/* Title */}
      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">Qibla Pointer</h3>

      {/* Status */}
      <p className="text-[10px] font-medium text-primary mb-6 flex items-center gap-1">
        {error ? <span className="text-destructive">{error}</span> :
         needsPermission ? 'Waiting for Permission' :
         qiblaAngle === null ? 'Waiting for Location' : 'Compass Active'}
      </p>

      {/* Compass Face */}
      <div className="relative w-48 h-48 mb-6">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border border-border shadow-inner bg-secondary/20" />
        <div className="absolute inset-2 rounded-full border-[0.5px] border-primary/20" />

        {/* Rotating compass rose — N/S/E/W labels and tick marks spin with the device */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ rotate: -heading }}
          transition={{ type: 'spring', damping: 50, stiffness: 200 }}
        >
          {/* N, E, S, W Markings */}
          <span className="absolute top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-primary">N</span>
          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs font-bold text-muted-foreground">S</span>
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">E</span>
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">W</span>

          {/* Minor ticks */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-border rounded-full"
              style={{ transform: `rotate(${i * 30}deg) translateY(4px)` }}
            />
          ))}
        </motion.div>

        {/* Qibla Arrow — fixed on screen, rotates to always point at Kaaba */}
        {qiblaAngle !== null && (
          <motion.div
            className="absolute inset-0 z-20"
            animate={{ rotate: arrowRotation }}
            transition={{ type: 'spring', damping: 50, stiffness: 200 }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 flex flex-col items-center">
              <Navigation2
                className={`w-8 h-8 transition-colors duration-500 ${
                  isPointed
                    ? 'text-primary fill-primary drop-shadow-[0_0_12px_rgba(212,175,55,1)]'
                    : 'text-primary/70 fill-primary/30'
                }`}
              />
              {/* Crescent indicator */}
              <svg className="w-3 h-3 text-primary mt-1 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.5A9.5 9.5 0 0 1 11.5 22 9.5 9.5 0 0 1 2 12.5 9.5 9.5 0 0 1 11.5 3c-.3.8-.5 1.7-.5 2.5a7 7 0 0 0 7 7c.9 0 1.8-.2 2.6-.5.3.8.4 1.6.4 2.5zm-11-7l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Center Kaaba Motif (static) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-card/80 backdrop-blur-sm rounded-full p-2">
            <KaabaIcon />
          </div>
        </div>
      </div>

      {/* Info & Permissions */}
      {needsPermission ? (
        <button
          onClick={requestPermission}
          className="bg-primary text-primary-foreground text-xs font-bold px-4 py-2 rounded-full shadow-lg hover:opacity-90 transition-opacity"
        >
          Enable Compass
        </button>
      ) : (
        <div className="space-y-1 z-10">
          <p className="text-sm font-semibold text-foreground">
            {qiblaAngle !== null ? `Kaaba is ${Math.round(qiblaAngle)}° ${getCompassDirection(qiblaAngle)}` : '--'}
          </p>
          <p className="text-[9px] text-muted-foreground max-w-[200px] leading-tight mx-auto flex items-center justify-center gap-1">
            <Compass className="w-3 h-3" />
            Requires device compass &amp; geolocation
          </p>
        </div>
      )}
    </div>
  );
}
