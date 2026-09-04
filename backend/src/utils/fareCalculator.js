const defaultPricing = {
  baseFare: 20,
  perKm: 20,
  perMin: 0,
  minFare: 100,
  commissionRate: 0.10,
  currency: 'inr',
  surgeMin: 1.0,
  surgeMax: 3.0,
};

const calculateFare = (distanceKm, durationMin, surge = 1.0, pricing = {}) => {
  const p = { ...defaultPricing, ...pricing };

  const surgeMultiplier = Math.min(
    Math.max(surge, p.surgeMin),
    p.surgeMax
  );

  let fare = p.baseFare + distanceKm * p.perKm + durationMin * p.perMin;

  fare *= surgeMultiplier;

  fare = Math.max(fare, p.minFare);

  const commission = fare * p.commissionRate;
  const driverEarnings = fare - commission;

  return {
    fare: parseFloat(fare.toFixed(2)),
    commission: parseFloat(commission.toFixed(2)),
    driverEarnings: parseFloat(driverEarnings.toFixed(2)),
    currency: p.currency,
  };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

module.exports = {
  defaultPricing,
  calculateFare,
  calculateDistance,
};