import React, { createContext, useState, useContext, useCallback } from 'react';
import { storage } from './storage';

const LocationContext = createContext();

const LOCATION_KEY = 'namaz_location';
const SCHOOL_KEY = 'namaz_school';

function loadLocation() {
  return storage.get(LOCATION_KEY);
}

function loadSchool() {
  return storage.get(SCHOOL_KEY) || '0';
}

export const LocationProvider = ({ children }) => {
  const [location, setLocationState] = useState(() => loadLocation());
  const [school, setSchoolState] = useState(() => loadSchool());
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);

  const saveLocation = (loc) => {
    storage.set(LOCATION_KEY, loc);
    setLocationState(loc);
  };

  const setSchool = useCallback((val) => {
    storage.set(SCHOOL_KEY, val);
    setSchoolState(val);
  }, []);

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
    storage.remove(LOCATION_KEY);
    setLocationState(null);
    setLocationError(null);
  }, []);

  return (
    <LocationContext.Provider value={{
      location,
      school,
      isLocating,
      locationError,
      setCoords,
      setCity,
      setSchool,
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
