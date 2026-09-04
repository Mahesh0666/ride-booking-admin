import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../constants/config';

class SocketService {
  private socket: any = null;
  private token: string | null = null;
  private registeredListeners: Map<string, Set<(data: any) => void>> = new Map();
  private connectionCallbacks: Array<(connected: boolean) => void> = [];

  async connect(tokenOverride?: string) {
    this.token = tokenOverride || (await AsyncStorage.getItem('token'));
    if (!this.token) return null;
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
      this.connectionCallbacks.forEach((cb) => cb(true));
    });

    this.socket.on('disconnect', () => {
      this.connectionCallbacks.forEach((cb) => cb(false));
    });

    this.socket.on('connect_error', () => {
      this.connectionCallbacks.forEach((cb) => cb(false));
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

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionCallbacks.forEach((cb) => cb(false));
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

  subscribeToRideUpdates(rideId: string) {
    this.emit('subscribe_ride', rideId);
  }

  onConnectionStatus(callback: (connected: boolean) => void) {
    this.connectionCallbacks.push(callback);
    if (this.socket) {
      callback(this.socket.connected);
    }
  }
}

export default new SocketService();
