export const getGeolocationOnce = (options?: PositionOptions): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
};

export const getLocation = async (): Promise<GeolocationPosition> => {
  try {
    return await getGeolocationOnce({ enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 });
  } catch (err: any) {
    try {
      return await getGeolocationOnce({ enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 });
    } catch (err2) {
      throw err2 || err;
    }
  }
};

export const getWeatherLocationInfo = async (lat: number, lon: number): Promise<{locationName: string, nx: number, ny: number}> => {
  try {
    const KAKAO_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
    if (!KAKAO_API_KEY) {
      throw new Error('카카오 REST API 키가 설정되지 않았습니다');
    }
    
    const url = `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lon}&y=${lat}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `KakaoAK ${KAKAO_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`카카오맵 API 에러: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      const addressInfo = data.documents[0].address;
      const locationName = `${addressInfo.region_1depth_name} ${addressInfo.region_2depth_name}`;
      
      // getWeatherGridCoords는 별도로 import해야 함
      const { getWeatherGridCoords } = await import('./weatherGrid');
      const { nx, ny } = getWeatherGridCoords(lat, lon);
      
      return { locationName, nx, ny };
    }
    
    throw new Error('위치 정보를 찾을 수 없습니다');
  } catch (error) {
    const { getWeatherGridCoords } = await import('./weatherGrid');
    const { nx, ny } = getWeatherGridCoords(lat, lon);
    return {
      locationName: '알 수 없는 위치',
      nx,
      ny
    };
  }
};

