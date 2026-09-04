# RideAdmin - Ride Booking Admin Dashboard

A full-featured admin dashboard for managing ride booking operations with 2FA login, real-time email OTP, and comprehensive management tools.

## Features

- **2FA Admin Login** - Email + Password + OTP verification
- **Dashboard** - Real-time stats, charts, and activity feed
- **User Management** - View, edit, verify, and delete users
- **Driver Management** - Approve/reject drivers, view documents
- **Ride Management** - Track rides, view status, cancel rides
- **Cab Bookings** - Manage bookings with confirm/cancel/complete actions
- **Payments** - Revenue analytics and payment tracking
- **Settings** - Account, security, pricing, and system configuration
- **Email Notifications** - Login alerts, OTP, password reset confirmations

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, TypeScript, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose) |
| Authentication | JWT + Email OTP (2FA) |
| Email | Nodemailer (Gmail SMTP) |
| Charts | Recharts |
| Icons | Font Awesome |

## Project Structure

```
ride-booking/
├── admin-dashboard/       # React admin panel
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   └── services/      # API service
│   └── package.json
├── backend/               # Node.js API server
│   ├── src/
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   └── services/      # Email, OTP services
│   └── package.json
├── mobile-app/            # Rider mobile app (Expo)
└── partner-app/           # Driver mobile app (Expo)
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with App Password

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ride-booking.git
cd ride-booking

# Install backend dependencies
cd backend
npm install

# Install admin dashboard dependencies
cd ../admin-dashboard
npm install
```

### Environment Setup

Create `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/ride_booking
JWT_SECRET=your_64_character_secret_here
JWT_EXPIRES_IN=7d
NODE_ENV=development

# Email (Gmail SMTP)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
ADMIN_EMAIL=your_admin@email.com

# Payment (Optional)
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

### Run Development

```bash
# Start backend (Terminal 1)
cd backend
npm start

# Start admin dashboard (Terminal 2)
cd admin-dashboard
npm run dev
```

Open http://localhost:5173

## Default Credentials

- **Email:** srgrvg90@gmail.com
- **Password:** Venu@123

## Deployment

### Render (Free Tier)

1. Push code to GitHub
2. Create MongoDB Atlas cluster (free M0)
3. Deploy backend as Web Service
4. Deploy admin dashboard as Static Site
5. Set environment variables in Render dashboard

See [Deployment Guide](#step-1-create-github-repository) for detailed instructions.

## Security Features

- JWT authentication with expiration
- 2FA login (password + email OTP)
- Rate limiting on auth routes
- Helmet security headers
- MongoDB injection protection
- CORS restricted to allowed origins
- Passwords hashed with bcrypt
- Login notification emails

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/admin/login-request-otp | Step 1: Verify credentials, send OTP |
| POST | /api/auth/admin/login-verify-otp | Step 2: Verify OTP, return token |
| POST | /api/auth/forgot-password | Send password reset OTP |
| POST | /api/auth/verify-reset-otp | Verify reset OTP |
| POST | /api/auth/reset-password | Set new password |
| GET | /api/admin/stats | Dashboard statistics |
| GET | /api/admin/users | List all users |
| GET | /api/admin/drivers | List all drivers |
| GET | /api/admin/rides | List all rides |

## License

MIT License - See [LICENSE](LICENSE) file

## Support

For issues or questions, open a GitHub issue or contact:
- Email: Srgrvg90@gmail.com
