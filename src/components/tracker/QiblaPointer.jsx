import React, { useState, useEffect, useCallback } from 'react';
import { Compass, RotateCcw, AlertCircle, MapPin } from 'lucide-react';
import { useLocation } from '@/lib/LocationContext';

const KaabaIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-primary drop-shadow-[0_0_12px_rgba(212,175,55,0.6)]">
    <path d="M12 21l8-4V9l-8-4-8 4v8l8 4z" />
    <path d="M4 9l8 4 8-4" />
    <path d="M12 13v8" />
    <path d="M4.5 11l7.5 3.75 7.5-3.75" strokeWidth="1.5" className="opacity-80" />
    <path d="M5.5 13l6.5 3.25 6.5-3.25" strokeWidth="0.5" className="opacity-60" />
  </svg>
);

export default function QiblaPointer() {
  const { location, requestGeolocation } = useLocation();
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionState, setPermissionState] = useState('prompt'); // prompt, granted, denied
  const [isCalibrating, setIsCalibrating] = useState(false);

  // Calculate Qibla angle based on location (Initial Bearing Formula)
  const calculateQibla = useCallback((lat, lon) => {
    const KAABA_LAT = 21.4225;
    const KAABA_LON = 39.8262;

    const Φ1 = lat * (Math.PI / 180);
    const λ1 = lon * (Math.PI / 180);
    const Φ2 = KAABA_LAT * (Math.PI / 180);
    const λ2 = KAABA_LON * (Math.PI / 180);

    const y = Math.sin(λ2 - λ1);
    const x = Math.cos(Φ1) * Math.tan(Φ2) - Math.sin(Φ1) * Math.cos(λ2 - λ1);
    
    let qibla = Math.atan2(y, x);
    qibla = qibla * (180 / Math.PI);
    setQiblaAngle((qibla + 360) % 360);
  }, []);

  useEffect(() => {
    if (location?.lat && location?.lon) {
      calculateQibla(location.lat, location.lon);
    }
  }, [location, calculateQibla]);

  const handleOrientation = (e) => {
    let compassHeading = 0;
    
    if (e.webkitCompassHeading) {
      // iOS
      compassHeading = e.webkitCompassHeading;
    } else if (e.absolute && e.alpha !== null) {
      // Android
      compassHeading = 360 - e.alpha;
    } else {
      return;
    }

    setHeading(compassHeading);
  };

  const startCompass = async () => {
    if (!window.DeviceOrientationEvent) {
      setIsSupported(false);
      return;
    }

    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
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
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
        // Fallback to standard if absolute is not available
        window.addEventListener('deviceorientation', handleOrientation, true);
      }
    } catch (error) {
      console.error('Error requesting orientation permission:', error);
      setPermissionState('denied');
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  const isAligned = Math.abs((heading - qiblaAngle + 540) % 360 - 180) < 5;

  if (!location?.lat) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[300px]">
        <MapPin className="w-12 h-12 text-primary/40 mb-4 animate-bounce" />
        <h3 className="text-sm font-bold mb-2">Location Required</h3>
        <p className="text-xs text-muted-foreground mb-6 max-w-[200px]">
          We need your location to calculate the precise Qibla direction.
        </p>
        <button 
          onClick={requestGeolocation}
          className="bg-primary text-primary-foreground text-xs font-bold px-6 py-2 rounded-full hover:scale-105 transition-transform"
        >
          Enable Location
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden h-[340px]">
      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">Qibla Finder</h3>

      <div className="relative w-48 h-48 mb-6">
        {/* Outer Ring / Degree Marks */}
        <div className="absolute inset-0 rounded-full border-2 border-border/50 shadow-2xl flex items-center justify-center">
          {[0, 90, 180, 270].map((deg) => (
            <div 
              key={deg}
              className="absolute text-[8px] font-bold text-muted-foreground/40"
              style={{ 
                transform: `rotate(${deg}deg) translateY(-85px)`,
              }}
            >
              {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : 'W'}
            </div>
          ))}
        </div>

        {/* Compass Disk (Rotates to show current heading) */}
        <div 
          className="absolute inset-0 transition-transform duration-150 ease-out"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          {/* North Indicator */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-3 bg-red-500 rounded-full" />
          
          {/* Qibla Needle */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ transform: `rotate(${qiblaAngle}deg)` }}
          >
            <div className={`w-1 h-32 bg-gradient-to-t from-primary/0 via-primary to-primary rounded-full relative ${isAligned ? 'animate-pulse' : ''}`}>
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-primary rotate-45 border-2 border-card" />
            </div>
          </div>
        </div>

        {/* Center Pivot */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`transition-all duration-500 rounded-full p-3 ${isAligned ? 'bg-primary/20 scale-110' : 'bg-card/80 backdrop-blur-sm'}`}>
            <KaabaIcon />
          </div>
        </div>
      </div>

      {permissionState !== 'granted' ? (
        <div className="space-y-3 z-10">
          <button 
            onClick={startCompass}
            className="bg-primary text-primary-foreground text-xs font-bold px-6 py-2 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Start Compass
          </button>
          <p className="text-[10px] text-muted-foreground max-w-[200px] leading-tight">
            Place your phone on a flat surface and keep away from magnets.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          <p className={`text-xs font-bold transition-colors ${isAligned ? 'text-primary' : 'text-muted-foreground'}`}>
            {isAligned ? 'Qibla Aligned' : `${Math.round(qiblaAngle)}° from North`}
          </p>
          <button 
            onClick={() => setIsCalibrating(!isCalibrating)}
            className="text-[9px] text-muted-foreground/60 flex items-center gap-1 mx-auto hover:text-primary transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Recalibrate
          </button>
        </div>
      )}

      {/* Alignment Glow */}
      {isAligned && (
        <div className="absolute inset-0 bg-primary/5 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
