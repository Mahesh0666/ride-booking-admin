const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const adminData = {
  name: 'Admin',
  email: 'maheshbabuv57@gmail.com',
  password: 'Venu@123',
  phone: '9999999999',
  role: 'admin',
  isDriver: false,
  isVerified: true,
  onboardingStatus: 'approved',
};

async function seedAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/ride_booking');
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log(`Admin user already exists: ${adminData.email} (role: ${existing.role})`);
      if (existing.role !== 'admin') {
        console.log('Updating role to admin...');
        existing.role = 'admin';
        await existing.save({ validateBeforeSave: false });
        console.log('Role updated to admin');
      }
      await mongoose.disconnect();
      return;
    }

    const admin = await User.create(adminData);
    console.log(`Admin user created successfully:`);
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Password: ${adminData.password}`);
    console.log(`  Role: ${admin.role}`);

    await mongoose.disconnect();
    console.log('Done');
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();
