import { authenticatedClient } from '../client';
import type { LocationData, WeatherSummaryDto, RecommendEventReqDto } from '../types/api.types';

const buildLocationParams = (locationData: LocationData): URLSearchParams => {
  return new URLSearchParams({
    locationName: locationData.cityName,
    nx: locationData.nx.toString(),
    ny: locationData.ny.toString()
  });
};

export const getTodayWeatherSummary = async (locationData?: LocationData): Promise<WeatherSummaryDto> => {
  let url = '/summary/today/weather';
  
  if (locationData) {
    const params = buildLocationParams(locationData);
    url += `?${params.toString()}`;
  }

  const { data } = await authenticatedClient.get(url);
  return data;
};

export const getTodayScheduleSummary = async (): Promise<any> => {
  const { data } = await authenticatedClient.get('/summary/today/event');
  return data;
};

export const getRecommendations = async (locationData?: LocationData, targetDate?: string): Promise<RecommendEventReqDto[]> => {
  let url = '/summary/recommend';
  const params = new URLSearchParams();

  if (locationData) {
    params.append('locationName', locationData.cityName);
    params.append('nx', locationData.nx.toString());
    params.append('ny', locationData.ny.toString());
  }

  if (targetDate) {
    params.append('targetDate', targetDate);
  }

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const { data } = await authenticatedClient.get(url);
  return data;
};

