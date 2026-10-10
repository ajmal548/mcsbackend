import AppError from '../../utils/appError';

export interface RouteCoordinates {
  latitude: number;
  longitude: number;
}

export interface DirectionsResult {
  polyline: string;
  distanceMeters: number;
  durationSeconds: number;
  summary: string;
  startAddress?: string;
  endAddress?: string;
}

export const getRouteDirectionsService = async (
  origin: RouteCoordinates,
  destination: RouteCoordinates
): Promise<DirectionsResult> => {
  const apiKey = process.env.GOOGLE_MAPS_APIKEY;
  if (!apiKey) {
    throw new AppError('Google Maps API key is not configured on the server', 500);
  }

  const originStr = `${origin.latitude},${origin.longitude}`;
  const destStr = `${destination.latitude},${destination.longitude}`;

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    originStr
  )}&destination=${encodeURIComponent(destStr)}&mode=driving&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new AppError(`Google Directions HTTP error: ${res.statusText}`, res.status);
  }

  const data: any = await res.json();
  if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
    throw new AppError(data.error_message || `Could not calculate route: ${data.status}`, 400);
  }

  const route = data.routes[0];
  const leg = route.legs?.[0];

  return {
    polyline: route.overview_polyline?.points || '',
    distanceMeters: leg?.distance?.value || 0,
    durationSeconds: leg?.duration?.value || 0,
    summary: route.summary || '',
    startAddress: leg?.start_address || '',
    endAddress: leg?.end_address || '',
  };
};
