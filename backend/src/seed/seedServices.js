const Service = require('../models/Service');

const services = [
  {
    code: 'auto',
    name: 'Auto',
    description: 'Hassle-free city rides in a comfortable auto rickshaw',
    icon: '🛺',
    vehicleType: 'auto',
    seats: 3,
    capacity: '3 seats',
    baseFare: 20,
    perKm: 20,
    perMin: 0,
    minFare: 100,
    commissionRate: 0.10,
  },
];

const seedServices = async () => {
  try {
    const count = await Service.countDocuments();
    if (count > 0) {
      console.log(`Services already seeded (${count})`);
      return;
    }

    await Service.insertMany(services);
    console.log(`Seeded ${services.length} ride service`);
  } catch (err) {
    console.error('Failed to seed services:', err.message);
  }
};

module.exports = { seedServices, services };