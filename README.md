# Ride Booking App

A full-stack ride booking platform with rider and driver mobile apps, plus an admin dashboard.

## Architecture

```
ride-booking/
├── backend/          # Node.js + Express + MongoDB API
├── mobile-app/       # React Native (Expo) - Rider app
├── partner-app/      # React Native (Expo) - Driver app
├── admin-dashboard/  # React + Vite web admin panel
└── shared/           # Shared TypeScript types
```

## Getting Started

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your MongoDB URI and Stripe key
npm run dev
```

### Mobile Apps (Rider & Driver)
```bash
cd mobile-app     # or partner-app
npm install
npm start
```

### Admin Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```

## Tech Stack
- **Backend:** Node.js, Express, MongoDB, Socket.IO, Stripe
- **Mobile:** React Native, Expo, Socket.IO Client, Google Maps
- **Admin:** React, Vite, TailwindCSS, Chart.js

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/online-status` - Toggle online status
- `PUT /api/auth/location` - Update location

### Rides
- `POST /api/rides` - Request a ride
- `GET /api/rides` - Get user's rides
- `GET /api/rides/:id` - Get ride by ID
- `POST /api/rides/:id/accept` - Accept ride (driver)
- `PUT /api/rides/:id/status` - Update ride status (driver)
- `POST /api/rides/:id/cancel` - Cancel ride
- `POST /api/rides/:id/rate` - Rate a ride

### Admin
- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/drivers` - Get all drivers
- `GET /api/admin/payments` - Get all payments
- `PUT /api/admin/users/:id` - Update user status

### Payments
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/my-payments` - Get user's payments
- `GET /api/payments/ride/:rideId` - Get payment for a ride