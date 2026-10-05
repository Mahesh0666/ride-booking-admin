import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { API_BASE_URL } from '../constants/config';
import axios from 'axios';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: any = null;
if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (err) {
    Notifications = null;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    return null;
  }
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync();

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    return token.data;
  } catch (err) {
    return null;
  }
}

export async function sendPushTokenToServer(pushToken: string, authToken: string): Promise<void> {
  try {
    await axios.post(
      `${API_BASE_URL}/auth/push-token`,
      { pushToken },
      { headers: { Authorization: `Bearer ${authToken}` }, timeout: 10000 }
    );
  } catch (err) {
    // silently fail
  }
}

export function addNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationTapped?: (response: any) => void
) {
  if (isExpoGo || !Notifications) {
    return () => {};
  }
  try {
    const receivedSub = Notifications.addNotificationReceivedListener((notification: any) => {
      onNotificationReceived?.(notification);
    });

    const responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      onNotificationTapped?.(response);
    });

    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  } catch (err) {
    return () => {};
  }
}
