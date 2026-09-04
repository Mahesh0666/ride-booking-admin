import axios from 'axios';

const OSRM_BASE = 'https://router.project-osrm.org';

export interface RoutePoint {
  latitude: number;
  longitude: number;
}

export interface RouteResult {
  coordinates: RoutePoint[];
  distanceKm: number;
  durationSeconds: number;
}

export async function getRoadRoute(
  pickup: RoutePoint,
  dropoff: RoutePoint
): Promise<RouteResult | null> {
  try {
    const url = `${OSRM_BASE}/route/v1/driving/${pickup.longitude},${pickup.latitude};${dropoff.longitude},${dropoff.latitude}?overview=full&geometries=geojson&steps=false`;
    const response = await axios.get(url, { timeout: 10000 });
    const route = response.data?.routes?.[0];
    if (!route?.geometry?.coordinates) return null;

    const coordinates: RoutePoint[] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })
    );

    return {
      coordinates,
      distanceKm: route.distance / 1000,
      durationSeconds: route.duration,
    };
  } catch (err) {
    console.warn('OSRM routing failed, falling back to straight line');
    return null;
  }
}

export async function getRouteToDriver(
  driverPos: RoutePoint,
  pickup: RoutePoint
): Promise<RoutePoint[] | null> {
  const result = await getRoadRoute(driverPos, pickup);
  return result?.coordinates || null;
}
