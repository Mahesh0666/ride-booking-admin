import { Coordinates } from './location';

interface PendingLocation {
  pickup?: Coordinates;
  dropoff?: Coordinates;
}

const pending: PendingLocation = {};

export const setPendingLocation = (key: keyof PendingLocation, value: Coordinates) => {
  pending[key] = value;
};

export const consumePendingLocation = (key: keyof PendingLocation): Coordinates | undefined => {
  const value = pending[key];
  delete pending[key];
  return value;
};

export const clearPendingLocations = () => {
  delete pending.pickup;
  delete pending.dropoff;
};