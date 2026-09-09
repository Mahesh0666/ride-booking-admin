import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: 'AIzaSyCCVUsWVQfNHQdDJ8J9SsJHQUhsoR3XTLo',
  authDomain: 'ride-booking-eab52.firebaseapp.com',
  projectId: 'ride-booking-eab52',
  storageBucket: 'ride-booking-eab52.firebasestorage.app',
  messagingSenderId: '900449267805',
  appId: '1:900449267805:android:94bf031b1b921d83beddb4',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
