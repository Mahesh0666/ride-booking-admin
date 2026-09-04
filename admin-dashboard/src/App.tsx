import React from 'react';
import AppRouter from './AppRouter';
import { AuthProvider } from './context/AuthContext';
import './index.css';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}