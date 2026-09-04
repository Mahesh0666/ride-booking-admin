import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

class SocketService {
  private socket: any = null;
  private token: string | null = null;
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private registeredListeners: Map<string, Set<(data: any) => void>> = new Map();

  async connect(tokenOverride?: string) {
    this.token = tokenOverride || (await AsyncStorage.getItem('driver_token'));
    if (!this.token) {
      return null;
    }

    if (this.socket && this.socket.connected) return this.socket;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    const serverUrl = API_BASE_URL.replace('/api', '');

    this.socket = io(serverUrl, {
      auth: { token: this.token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.reapplyAllListeners();
      this.emitConnectionStatus(true);
    });

    this.socket.on('disconnect', () => {
      this.emitConnectionStatus(false);
    });

    this.socket.on('connect_error', () => {
      this.emitConnectionStatus(false);
    });

    return this.socket;
  }

  private reapplyAllListeners() {
    if (!this.socket) return;
    this.registeredListeners.forEach((callbacks, event) => {
      // Remove existing listeners for this event first to prevent duplicates
      this.socket.removeAllListeners(event);
      callbacks.forEach((callback) => {
        this.socket.on(event, callback);
      });
    });
  }

  onConnectionStatus(cb: (connected: boolean) => void) {
    this.connectionListeners.push(cb);
    if (this.socket) {
      cb(this.socket.connected);
    }
    return () => {
      this.connectionListeners = this.connectionListeners.filter((l) => l !== cb);
    };
  }

  private emitConnectionStatus(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionListeners = [];
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.registeredListeners.has(event)) {
      this.registeredListeners.set(event, new Set());
    }
    this.registeredListeners.get(event)!.add(callback);

    if (this.socket && this.socket.connected) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback?: (data: any) => void) {
    if (callback) {
      const set = this.registeredListeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) this.registeredListeners.delete(event);
      }
      if (this.socket) {
        this.socket.off(event, callback);
      }
    } else {
      this.registeredListeners.delete(event);
      if (this.socket) {
        this.socket.removeAllListeners(event);
      }
    }
  }

  emit(event: string, data: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  reportLocation(lat: number, lng: number) {
    this.emit('driver_location', {
      location: { latitude: lat, longitude: lng },
    });
  }

  subscribeToRideUpdates(rideId: string) {
    this.emit('subscribe_ride', rideId);
  }

  sendDriverPosition(rideId: string, location: { latitude: number; longitude: number }) {
    this.emit('driver_position', { rideId, location });
  }
}

export default new SocketService();
