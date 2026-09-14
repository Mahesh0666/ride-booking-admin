export async function registerForPushNotifications(): Promise<string | null> {
  console.log('Push notifications require a development build, not Expo Go');
  return null;
}

export function addNotificationListeners() {
  return () => {};
}
