import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const LocationContext = createContext();

const LOCATION_KEY = 'namaz_location';

function loadLocation() {
  try {
    return JSON.parse(localStorage.getItem(LOCATION_KEY) || 'null');
  } catch {
    return null;
  }
}

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(() => loadLocation());
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const saveLocation = (loc) => {
    localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    setLocationState(loc);
  };

  const setCoords = useCallback((lat, lon) => {
    saveLocation({ lat, lon, city: null, type: 'coords' });
    setLocationError(null);
  }, []);

  const setCity = useCallback((city) => {
    if (city && city.trim()) {
      saveLocation({ lat: null, lon: null, city: city.trim(), type: 'city' });
      setLocationError(null);
    }
  }, []);

  const requestGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(pos.coords.latitude, pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        setLocationError('Could not get location: ' + err.message);
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  }, [setCoords]);

  const reset = useCallback(() => {
    localStorage.removeItem(LOCATION_KEY);
    setLocationState(null);
    setLocationError(null);
  }, []);

  return (
    <LocationContext.Provider value={{
      location,
      isLocating,
      locationError,
      setCoords,
      setCity,
      requestGeolocation,
      reset,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
};
