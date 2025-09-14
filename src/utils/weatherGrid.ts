/**
 * 기상청 격자 좌표 변환 유틸리티
 * GPS 좌표(위도, 경도)를 기상청 격자 좌표(x, y)로 변환합니다.
 */

export interface GridCoordinates {
  x: number;
  y: number;
}

/**
 * GPS 좌표를 기상청 격자 좌표로 변환
 * @param lat 위도 (latitude)
 * @param lon 경도 (longitude)
 * @returns 기상청 격자 좌표 {x, y}
 */
export const convertToGrid = (lat: number, lon: number): GridCoordinates => {
  const RE = 6371.00877; // 지구 반경(km)
  const GRID = 5.0; // 격자 간격(km)
  const SLAT1 = 30.0; // 투영 위도1(degree)
  const SLAT2 = 60.0; // 투영 위도2(degree)
  const OLON = 126.0; // 기준점 경도(degree)
  const OLAT = 38.0; // 기준점 위도(degree)
  const XO = 43; // 기준점 X좌표(GRID)
  const YO = 136; // 기준점 Y좌표(GRID)

  const DEGRAD = Math.PI / 180.0;
  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + (lat) * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  let x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  let y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { x, y };
};

/**
 * 기상청 격자 좌표를 nx, ny 형식으로 반환
 * @param lat 위도
 * @param lon 경도
 * @returns {nx, ny} 기상청 격자 좌표
 */
export const getWeatherGridCoords = (lat: number, lon: number): { nx: number; ny: number } => {
  const grid = convertToGrid(lat, lon);
  return {
    nx: grid.x,
    ny: grid.y
  };
};
