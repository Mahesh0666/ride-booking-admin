import axios from 'axios';
import * as Location from 'expo-location';

export interface Place {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  source?: string;
}

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export const autocompleteAddresses = async (
  query: string,
  fallback: Place[] = []
): Promise<Place[]> => {
  if (!query || query.trim().length < 2) return fallback;

  const q = query.trim();
  const localMatches = fallback.filter(
    (p) =>
      p.address.toLowerCase().includes(q.toLowerCase()) ||
      p.label.toLowerCase().includes(q.toLowerCase())
  );

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/search`, {
      params: {
        q,
        format: 'json',
        limit: 6,
        addressdetails: 1,
        countrycodes: 'in',
        'accept-language': 'en',
      },
      timeout: 8000,
    });

    const remote: Place[] = (response.data || [])
      .filter((r: any) => r.lat && r.lon)
      .map((r: any) => ({
        id: `osm_${r.osm_id}`,
        label: (r.address?.city || r.address?.town || r.address?.state || 'Address') as string,
        address: r.display_name as string,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        source: 'search',
      }));

    const seen = new Set(localMatches.map((p) => p.address.toLowerCase()));
    const merged = [...localMatches];
    for (const p of remote) {
      if (!seen.has(p.address.toLowerCase())) {
        seen.add(p.address.toLowerCase());
        merged.push(p);
      }
    }
    return merged.slice(0, 8);
  } catch (err) {
    console.warn('Nominatim search failed:', err);
    return localMatches;
  }
};

const COORDS_FALLBACK = (latitude: number, longitude: number) =>
  `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<string | null> => {
  try {
    const coords = { latitude, longitude };
    const locs = await Location.reverseGeocodeAsync(coords);
    const loc = locs && locs[0];
    if (loc) {
      const parts = [
        loc.district,
        loc.city || loc.subregion || loc.region,
        loc.subregion || loc.region,
        loc.country,
      ].filter(Boolean);
      if (parts.length) return parts.join(', ');
    }
  } catch (err) {
    console.warn('Device reverse geocode failed:', err);
  }

  try {
    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        lat: latitude,
        lon: longitude,
        format: 'json',
        zoom: 18,
        'accept-language': 'en',
      },
      timeout: 8000,
    });
    const data = response.data;
    if (data && data.display_name) {
      return data.display_name;
    }
  } catch (err) {
    console.warn('Reverse geocode failed:', err);
  }
  return null;
};

export const coordsFallback = COORDS_FALLBACK;