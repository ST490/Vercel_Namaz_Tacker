import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Compass } from 'lucide-react';

// ── Kaaba coordinates ──
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function toRad(d) { return d * Math.PI / 180; }
function toDeg(r) { return r * 180 / Math.PI; }

function calcQibla(lat, lng) {
  const dLng = toRad(KAABA_LNG - lng);
  const φ1 = toRad(lat), φ2 = toRad(KAABA_LAT);
  const y = Math.sin(dLng) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function calcDistance(lat, lng) {
  const R = 6371;
  const dLat = toRad(KAABA_LAT - lat);
  const dLng = toRad(KAABA_LNG - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(KAABA_LAT)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

const KaabaIcon = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 21l8-4V9l-8-4-8 4v8l8 4z" />
    <path d="M4 9l8 4 8-4" />
    <path d="M12 13v8" />
    <path d="M4.5 11l7.5 3.75 7.5-3.75" strokeWidth="1.5" opacity="0.8" />
    <path d="M5.5 13l6.5 3.25 6.5-3.25" strokeWidth="0.5" opacity="0.6" />
  </svg>
);

export default function QiblaPointer() {
  const [qiblaAngle, setQiblaAngle] = useState(null);   // bearing to Mecca from North
  const [heading, setHeading] = useState(0);             // device compass heading
  const [distance, setDistance] = useState(null);        // km to Mecca
  const [hasCompass, setHasCompass] = useState(false);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [status, setStatus] = useState({ type: 'warn', msg: 'Requesting location…' });

  const headingRef = useRef(0);

  // ── Orientation handler ──
  const onOrientation = useCallback((e) => {
    let h;
    if (e.webkitCompassHeading !== undefined) {
      h = e.webkitCompassHeading;           // iOS (already absolute)
    } else if (e.alpha !== null) {
      h = (360 - e.alpha) % 360;            // Android
    } else return;

    headingRef.current = h;
    setHeading(h);
    setHasCompass(true);
    setStatus({ type: 'ok', msg: 'Compass active' });
  }, []);

  // ── Init compass listeners ──
  const initCompass = useCallback(() => {
    if (
      typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
      // iOS 13+ — needs user gesture
      setNeedsPermission(true);
    } else {
      window.addEventListener('deviceorientationabsolute', onOrientation, true);
      window.addEventListener('deviceorientation', onOrientation, true);
    }
  }, [onOrientation]);

  const requestCompassPermission = useCallback(() => {
    DeviceOrientationEvent.requestPermission()
      .then((state) => {
        if (state === 'granted') {
          setNeedsPermission(false);
          window.addEventListener('deviceorientationabsolute', onOrientation, true);
          window.addEventListener('deviceorientation', onOrientation, true);
          setStatus({ type: 'warn', msg: 'Waiting for compass…' });
        }
      })
      .catch(console.error);
  }, [onOrientation]);

  // ── Geolocation ──
  useEffect(() => {
    const onSuccess = (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      setQiblaAngle(calcQibla(lat, lng));
      setDistance(calcDistance(lat, lng));
      setStatus({ type: 'ok', msg: 'Location acquired' });
      initCompass();
    };

    const onError = () => {
      // Fallback — default to Bengaluru
      const lat = 12.9716, lng = 77.5946;
      setQiblaAngle(calcQibla(lat, lng));
      setDistance(calcDistance(lat, lng));
      setStatus({ type: 'warn', msg: 'Using default location' });
      initCompass();
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
    });

    return () => {
      window.removeEventListener('deviceorientationabsolute', onOrientation, true);
      window.removeEventListener('deviceorientation', onOrientation, true);
    };
  }, [initCompass, onOrientation]);

  // ── Derived angles ──
  const needleRotation = -heading;                                       // compass needle always points North
  const qiblaBearing = qiblaAngle !== null
    ? ((qiblaAngle - heading) + 360) % 360
    : null;                                                               // degrees to turn from current facing

  // ── Status colours ──
  const statusStyles = {
    ok: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    warn: 'bg-yellow-500/10  border-yellow-500/30  text-yellow-400',
    err: 'bg-red-500/10     border-red-500/30     text-red-400',
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">

      {/* Title */}
      <h3 className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-5">
        Qibla Pointer
      </h3>

      {/* ── Compass face ── */}
      <div className="relative w-44 h-44 mb-5">

        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border border-border shadow-inner bg-secondary/20" />
        <div className="absolute inset-2 rounded-full border-[0.5px] border-primary/20" />

        {/* Tick marks */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 176 176"
          xmlns="http://www.w3.org/2000/svg"
        >
          {Array.from({ length: 72 }).map((_, i) => {
            const angle = (i * 5) * Math.PI / 180;
            const isMajor = i % 6 === 0;
            const isMid = i % 3 === 0;
            const r1 = 86;
            const r2 = r1 - (isMajor ? 10 : isMid ? 6 : 3.5);
            const cx = 88;
            return (
              <line
                key={i}
                x1={cx + r1 * Math.sin(angle)} y1={cx - r1 * Math.cos(angle)}
                x2={cx + r2 * Math.sin(angle)} y2={cx - r2 * Math.cos(angle)}
                stroke={isMajor ? 'rgba(var(--primary-rgb,212,175,55),0.55)' : 'rgba(var(--primary-rgb,212,175,55),0.18)'}
                strokeWidth={isMajor ? '1.2' : '0.7'}
              />
            );
          })}
        </svg>

        {/* Cardinal labels */}
        {[
          { label: 'N', style: 'top-[6%]  left-1/2 -translate-x-1/2 text-primary font-bold' },
          { label: 'S', style: 'bottom-[6%] left-1/2 -translate-x-1/2' },
          { label: 'E', style: 'top-1/2 right-[6%] -translate-y-1/2' },
          { label: 'W', style: 'top-1/2 left-[6%]  -translate-y-1/2' },
        ].map(({ label, style }) => (
          <span
            key={label}
            className={`absolute text-[10px] font-semibold tracking-wider text-muted-foreground ${style}`}
          >
            {label}
          </span>
        ))}

        {/* Qibla arrow (rotates toward Mecca) */}
        {qiblaBearing !== null && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ transform: `rotate(${qiblaBearing}deg)`, transition: 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)' }}
          >
            <svg width="176" height="176" viewBox="0 0 176 176" style={{ position: 'absolute', inset: 0 }}>
              {/* Dashed guide line */}
              <line x1="88" y1="88" x2="88" y2="24" stroke="currentColor" strokeWidth="1" strokeDasharray="3,4" opacity="0.25" className="text-primary" />
              {/* Arrow tip */}
              <polygon points="88,16 93,30 88,26 83,30" fill="currentColor" className="text-primary" opacity="0.9" />
              {/* Small Kaaba rect at tip */}
              <rect x="83" y="8" width="10" height="7" rx="1" fill="currentColor" className="text-primary" opacity="0.85" />
              <line x1="83" y1="11.5" x2="93" y2="11.5" stroke="var(--card,#111)" strokeWidth="0.8" />
            </svg>
          </div>
        )}

        {/* Compass needle (counter-rotates to always point North) */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transition: 'transform 0.25s cubic-bezier(0.25,0.46,0.45,0.94)', transform: `rotate(${needleRotation}deg)` }}
        >
          <div className="relative flex flex-col items-center" style={{ height: '130px' }}>
            {/* North tip */}
            <div style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderBottom: '60px solid',
              filter: 'drop-shadow(0 0 5px rgba(212,175,55,0.6))',
            }} className="text-primary border-b-current" />
            {/* South tip */}
            <div style={{
              width: 0, height: 0,
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '60px solid rgba(100,100,100,0.4)',
            }} />
          </div>
        </div>

        {/* Center Kaaba motif */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-card/80 backdrop-blur-sm rounded-full p-1.5">
            <KaabaIcon size={28} className="text-primary drop-shadow-[0_0_6px_rgba(212,175,55,0.4)] opacity-30" />
          </div>
        </div>

        {/* Center jewel */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-card shadow-[0_0_6px_rgba(212,175,55,0.5)] z-10" />
      </div>

      {/* ── Info bar ── */}
      <div className="flex gap-2 w-full mb-4">
        {[
          { label: 'Qibla', value: qiblaAngle !== null ? `${Math.round(qiblaAngle)}°` : '—' },
          { label: 'Bearing', value: qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '—' },
          { label: 'Distance', value: distance !== null ? `${distance.toLocaleString()} km` : '—' },
        ].map(({ label, value }) => (
          <div key={label} className="flex-1 rounded-xl border border-border bg-secondary/10 py-2 px-1">
            <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-1">{label}</p>
            <p className="text-sm font-semibold text-primary leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Status pill ── */}
      <div className={`text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full border inline-flex items-center gap-1.5 ${statusStyles[status.type]}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {status.msg}
      </div>

      {/* iOS permission button */}
      {needsPermission && (
        <button
          onClick={requestCompassPermission}
          className="mt-3 px-4 py-1.5 rounded-lg border border-primary/40 bg-primary/10 text-primary text-[10px] font-semibold uppercase tracking-widest hover:bg-primary/20 transition-colors"
        >
          Enable Compass
        </button>
      )}

      {/* Hint */}
      {!hasCompass && !needsPermission && (
        <p className="text-[9px] text-muted-foreground mt-2 flex items-center gap-1">
          <Compass className="w-3 h-3" />
          Open on mobile for live compass tracking
        </p>
      )}
