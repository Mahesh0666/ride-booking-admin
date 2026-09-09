import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './apiClient';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4361ee',
      });
    }

    await registerTokenWithBackend(expoPushToken);

    return expoPushToken;
  } catch (err) {
    console.error('Failed to get push token:', err);
    return null;
  }
}

async function registerTokenWithBackend(token: string) {
  try {
    await api.post('/auth/fcm-token', { fcmToken: token });
  } catch (err) {
    console.error('Failed to register FCM token:', err);
  }
}

export function addNotificationListeners(
  onReceive?: (notification: Notifications.Notification) => void,
  onResponder?: (response: Notifications.NotificationResponse) => void
) {
  const receiveSub = Notifications.addNotificationReceivedListener((notification) => {
    onReceive?.(notification);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onResponder?.(response);
  });

  return () => {
    receiveSub.remove();
    responseSub.remove();
  };
}
