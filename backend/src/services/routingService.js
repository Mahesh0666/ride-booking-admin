const axios = require('axios');

const OSRM_BASE = process.env.OSRM_SERVER || 'https://router.project-osrm.org';

const { calculateDistance } = require('../utils/fareCalculator');

const route = async ({ lat1, lng1, lat2, lng2, profile = 'driving' }) => {
  const coords = `${lng1},${lat1};${lng2},${lat2}`;
  const url = `${OSRM_BASE}/route/v1/${profile}/${coords}?overview=false&alternatives=false&steps=false`;

  try {
    const { data } = await axios.get(url, { timeout: 8000 });
    if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const r = data.routes[0];
      return {
        provider: 'osrm',
        distanceKm: r.distance / 1000,
        durationMin: r.duration / 60,
        geometry: r.geometry,
      };
    }
    throw new Error('OSRM route not ok');
  } catch (err) {
    const fallbackKm =
      typeof lat1 === 'number' &&
      typeof lng1 === 'number' &&
      typeof lat2 === 'number' &&
      typeof lng2 === 'number'
        ? calculateDistance(lat1, lng1, lat2, lng2)
        : null;

    return {
      provider: 'haversine',
      distanceKm: fallbackKm,
      durationMin: fallbackKm != null ? fallbackKm * 2 : null,
      geometry: null,
    };
  }
};

module.exports = { route };