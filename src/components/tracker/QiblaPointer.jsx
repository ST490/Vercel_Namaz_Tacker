import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Compass, RotateCcw, MapPin, Info } from 'lucide-react';
import { useLocation } from '@/lib/LocationContext';

const KaabaIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]">
    <path d="M12 21l8-4V9l-8-4-8 4v8l8 4z" />
    <path d="M4 9l8 4 8-4" />
    <path d="M12 13v8" />
    <path d="M4.5 11l7.5 3.75 7.5-3.75" strokeWidth="1.5" className="opacity-80" />
  </svg>
);

export default function QiblaPointer() {
  const { location, requestGeolocation } = useLocation();
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(null);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  const [isAbsolute, setIsAbsolute] = useState(false);
  
  // Use refs for smoothing logic to avoid re-renders on every degree change
  const headingRef = useRef(0);
  const requestRef = useRef();

  // 1. Calculate Qibla Direction (Standard Bearing Formula)
  const calculateQibla = useCallback((lat, lon) => {
    const Φ1 = lat * (Math.PI / 180);
    const λ1 = lon * (Math.PI / 180);
    const Φ2 = 21.4225 * (Math.PI / 180); // Kaaba Lat
    const λ2 = 39.8262 * (Math.PI / 180); // Kaaba Lon

    const Δλ = λ2 - λ1;
    const y = Math.sin(Δλ) * Math.cos(Φ2);
    const x = Math.cos(Φ1) * Math.sin(Φ2) - Math.sin(Φ1) * Math.cos(Φ2) * Math.cos(Δλ);
    
    let qibla = Math.atan2(y, x);
    qibla = (qibla * 180) / Math.PI;
    const finalAngle = (qibla + 360) % 360;
    setQiblaAngle(finalAngle);
  }, []);

  useEffect(() => {
    if (location?.lat && location?.lon) {
      calculateQibla(location.lat, location.lon);
    }
  }, [location, calculateQibla]);

  // 2. Handle Orientation with Smoothing
  const handleOrientation = useCallback((e) => {
    let currentHeading = 0;

    if (e.webkitCompassHeading) {
      // iOS
      currentHeading = e.webkitCompassHeading;
      setIsAbsolute(true);
    } else if (e.alpha !== null) {
      // Android / Chrome
      // We need 'absolute' to be true for actual compass North
      currentHeading = 360 - e.alpha;
      setIsAbsolute(e.absolute || false);
    } else {
      return;
    }

    // Simple Low-Pass Filter for smoothing (Exponential Moving Average)
    const alpha = 0.2; // Smoothing factor (lower = smoother but slower)
    
    // Handle the 360 -> 0 degree jump
    let diff = currentHeading - headingRef.current;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    
    const smoothedHeading = headingRef.current + alpha * diff;
    headingRef.current = (smoothedHeading + 360) % 360;
    
    // Update state for UI
    setHeading(headingRef.current);
  }, []);

  const startCompass = async () => {
    if (!window.DeviceOrientationEvent) {
      alert("Device orientation not supported on this browser.");
      return;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+
        const response = await DeviceOrientationEvent.requestPermission();
        if (response === 'granted') {
          setPermissionState('granted');
          window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
          setPermissionState('denied');
        }
      } else {
        // Android / Non-iOS
        setPermissionState('granted');
        // Prefer 'deviceorientationabsolute' for True North on Android
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        } else {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      }
    } catch (error) {
      console.error('Sensor error:', error);
      setPermissionState('denied');
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleOrientation]);

  // Alignment Logic
  const relativeQibla = qiblaAngle !== null ? (qiblaAngle - heading + 360) % 360 : 0;
  const isAligned = Math.abs((relativeQibla + 180) % 360 - 180) < 4;

  if (!location?.lat) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center relative h-[340px]">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <MapPin className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-sm font-bold mb-2">Location Required</h3>
        <p className="text-[11px] text-muted-foreground mb-6 max-w-[220px]">
          We need your coordinates to calculate the exact degree to the Kaaba from your position.
        </p>
        <button 
          onClick={requestGeolocation}
          className="bg-primary text-primary-foreground text-xs font-bold px-8 py-2.5 rounded-full hover:scale-105 transition-transform"
        >
          Allow Location
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[360px]">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-8">Qibla Compass</h3>

      <div className="relative w-52 h-52 mb-8">
        {/* Background Glow */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-700 blur-2xl ${isAligned ? 'bg-primary/20 opacity-100' : 'bg-primary/5 opacity-0'}`} />

        {/* Outer Ring (Static) */}
        <div className="absolute inset-0 rounded-full border border-border/40" />

        {/* North Indicator (Static reference) */}
        <div className="absolute inset-0 flex flex-col items-center pointer-events-none z-10">
          <div className="w-0.5 h-3 bg-red-500 rounded-full mt-[-2px]" />
          <span className="text-[10px] font-black text-red-500/80 mt-1">N</span>
        </div>

        {/* Rotating Compass Face */}
        <div 
          className="absolute inset-0 transition-transform duration-75 ease-linear"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* Degree Ticks */}
          {[...Array(12)].map((_, i) => (
            <div 
              key={i}
              className="absolute inset-0 flex flex-col items-center"
              style={{ transform: `rotate(${i * 30}deg)` }}
            >
              <div className="w-[1px] h-2 bg-border/60" />
            </div>
          ))}

          {/* Qibla Pointer (The Green/Gold Needle) */}
          <div 
            className="absolute inset-0 flex flex-col items-center transition-all duration-300"
            style={{ transform: `rotate(${qiblaAngle}deg)` }}
          >
            <div className={`w-1.5 h-24 mt-2 rounded-full relative shadow-[0_0_15px_rgba(212,175,55,0.3)] ${isAligned ? 'bg-primary' : 'bg-primary/40'}`}>
              <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-2 border-card ${isAligned ? 'bg-primary' : 'bg-primary/40'}`} />
            </div>
            <div className="mt-26 font-bold text-[10px] text-primary tracking-widest">QIBLA</div>
          </div>
        </div>

        {/* Center Kaaba Icon */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${isAligned ? 'bg-primary/20 scale-110 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-secondary/40 backdrop-blur-sm'}`}>
            <KaabaIcon />
          </div>
        </div>
      </div>

      {permissionState !== 'granted' ? (
        <div className="space-y-3 z-10">
          <button 
            onClick={startCompass}
            className="bg-primary text-primary-foreground text-[11px] font-bold px-8 py-2.5 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
          >
            <Compass className="w-4 h-4" />
            Activate Sensors
          </button>
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground/60">
            <Info className="w-3 h-3" />
            <p className="text-[10px]">Hold phone flat for accuracy</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAligned ? 'bg-primary animate-pulse' : 'bg-border'}`} />
            <p className={`text-xs font-black tracking-widest uppercase transition-colors ${isAligned ? 'text-primary' : 'text-muted-foreground'}`}>
              {isAligned ? 'Aligned' : `${Math.round(heading)}°`}
            </p>
          </div>
          {!isAbsolute && (
            <p className="text-[9px] text-yellow-500/80 font-medium">Relative North - Rotate for True North</p>
          )}
        </div>
      )}

      {/* Vibration/Haptic simulation (visual) */}
      {isAligned && (
        <div className="absolute inset-0 border-2 border-primary/20 rounded-2xl animate-[ping_2s_infinite] pointer-events-none" />
      )}
    </div>
  );
}
