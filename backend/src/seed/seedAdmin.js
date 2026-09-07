const User = require('../models/User');

async function seedAdmin() {
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || 'maheshmessi78@gmail.com').toLowerCase();

    const adminData = {
      name: 'Admin',
      email: adminEmail,
      password: 'Venu@123',
      phone: '9999999999',
      role: 'admin',
      isDriver: false,
      isVerified: true,
      onboardingStatus: 'approved',
    };

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
      console.log(`Admin user already exists: ${adminEmail} (role: ${existing.role})`);
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save({ validateBeforeSave: false });
        console.log('Role updated to admin');
      }
      return;
    }

    const admin = await User.create(adminData);
    console.log(`Admin user created successfully:`);
    console.log(`  Email: ${adminEmail}`);
    console.log(`  Password: Venu@123`);
    console.log(`  Role: ${admin.role}`);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  }
}

module.exports = { seedAdmin };
