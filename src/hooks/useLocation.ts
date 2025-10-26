import { useState, useEffect, useRef } from 'react';
import { getLocation, getWeatherLocationInfo } from '@/utils/location';
import { checkDailyLogin } from '@/api/services/auth';
import type { LocationData } from '@/api/types/api.types';
import { useToast } from '@/components/ToastProvider';

export const useLocation = () => {
  const { showToast } = useToast();
  const [resolvedLocation, setResolvedLocation] = useState<LocationData | null>(null);
  const [shouldShowSummary, setShouldShowSummary] = useState<boolean>(false);

  const requestLocationPermission = async (): Promise<{lat: number, lon: number} | null> => {
    try {
      try {
        const cached = localStorage.getItem('pm:lastLocation');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
            const cacheAge = Date.now() - (parsed.ts || 0);
            if (cacheAge < 10 * 60 * 1000) {
              return { lat: parsed.lat, lon: parsed.lon };
            }
          }
        }
      } catch {}

      try {
        const lastFailStr = localStorage.getItem('pm:lastGeoFailTs');
        if (lastFailStr) {
          const lastFail = Number(lastFailStr);
          if (Number.isFinite(lastFail) && Date.now() - lastFail < 5 * 60 * 1000) {
            const cached = localStorage.getItem('pm:lastLocation');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
                return { lat: parsed.lat, lon: parsed.lon };
              }
            }
            return null;
          }
        }
      } catch {}

      let position: GeolocationPosition | null = null;
      try {
        position = await getLocation();
      } catch (e) {
        position = null;
        try { localStorage.setItem('pm:lastGeoFailTs', String(Date.now())); } catch {}
      }
      
      const coords = {
        lat: position?.coords.latitude as number,
        lon: position?.coords.longitude as number
      };

      if (Number.isFinite(coords.lat) && Number.isFinite(coords.lon)) {
        try {
          localStorage.setItem('pm:lastLocation', JSON.stringify({ ...coords, ts: Date.now() }));
        } catch {}
        return coords as {lat: number, lon: number};
      }
      
      try { localStorage.setItem('pm:lastGeoFailTs', String(Date.now())); } catch {}
      return null;
    } catch (error) {
      try {
        const cached = localStorage.getItem('pm:lastLocation');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed.lat === 'number' && typeof parsed.lon === 'number') {
            return { lat: parsed.lat, lon: parsed.lon };
          }
        }
      } catch {}

      return null;
    }
  };

  const handleLocationRequest = async (): Promise<LocationData> => {
    const coords = await requestLocationPermission();
    
    if (!coords) {
      const defaultLocation = { cityName: '서울특별시', nx: 60, ny: 127 };
      try { showToast('현재 위치를 가져오지 못해 서울로 설정했어요', 'info'); } catch {}
      return defaultLocation;
    }
    
    const weatherInfo = await getWeatherLocationInfo(coords.lat, coords.lon);
    const isValidNumber = (v: any) => typeof v === 'number' && isFinite(v) && v > 0;
    const resolved = isValidNumber(weatherInfo.nx) && isValidNumber(weatherInfo.ny)
      ? {
          cityName: weatherInfo.locationName || '서울특별시',
          nx: weatherInfo.nx,
          ny: weatherInfo.ny
        }
      : { cityName: '서울특별시', nx: 60, ny: 127 };
    return resolved;
  };

  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const login = await checkDailyLogin();        
        if (!isMounted) return;
        
        const locationData = await handleLocationRequest();
        if (!isMounted) return;
        setResolvedLocation(locationData);
        
        try {
          if (login.firstLoginToday) {
            setShouldShowSummary(true);
          }
        } catch {}
      } catch (e) {}
    })();
    
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    resolvedLocation,
    shouldShowSummary,
    setShouldShowSummary
  };
};

