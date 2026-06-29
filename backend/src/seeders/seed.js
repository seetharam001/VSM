require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
require('../models');

const { User, Customer, Mechanic, Service } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ force: true });
    console.log('✅ Database reset and synced');

    // Create Admin
    const adminPass = await bcrypt.hash('Admin@123', 12);
    const adminUser = await User.create({ email: 'admin@vsm.com', password: adminPass, role: 'admin' });
    console.log('✅ Admin created: admin@vsm.com / Admin@123');

    // Create sample customer
    const custPass = await bcrypt.hash('Customer@123', 12);
    const custUser = await User.create({ email: 'john@example.com', password: custPass, role: 'customer' });
    await Customer.create({ userId: custUser.id, name: 'John Doe', phone: '9876543210', address: '123 Main Street, Chennai' });
    console.log('✅ Customer created: john@example.com / Customer@123');

    // Create sample mechanic
    const mechPass = await bcrypt.hash('Mechanic@123', 12);
    const mechUser = await User.create({ email: 'ravi@vsm.com', password: mechPass, role: 'mechanic' });
    await Mechanic.create({ userId: mechUser.id, name: 'Ravi Kumar', phone: '9123456789', experience: 5, specialization: 'Engine & Transmission' });
    console.log('✅ Mechanic created: ravi@vsm.com / Mechanic@123');

    // Create sample mechanic 2
    const mech2Pass = await bcrypt.hash('Mechanic@123', 12);
    const mech2User = await User.create({ email: 'suresh@vsm.com', password: mech2Pass, role: 'mechanic' });
    await Mechanic.create({ userId: mech2User.id, name: 'Suresh Babu', phone: '9234567890', experience: 3, specialization: 'Electrical & AC' });
    console.log('✅ Mechanic 2 created: suresh@vsm.com / Mechanic@123');

    // Create Services
    const services = [
      { name: 'Full Service', description: 'Complete vehicle service including oil change, filter replacement, and inspection', estimatedHours: 4, basePrice: 2500 },
      { name: 'Oil Change', description: 'Engine oil and oil filter replacement', estimatedHours: 1, basePrice: 800 },
      { name: 'Tyre Replacement', description: 'Replace one or more tyres with balancing and alignment', estimatedHours: 2, basePrice: 1500 },
      { name: 'Brake Service', description: 'Brake pad replacement and brake system inspection', estimatedHours: 2.5, basePrice: 1800 },
      { name: 'AC Service', description: 'Air conditioning service, gas refill, and filter cleaning', estimatedHours: 3, basePrice: 2000 },
      { name: 'Battery Replacement', description: 'Battery testing and replacement', estimatedHours: 1, basePrice: 3500 },
      { name: 'Engine Tune-Up', description: 'Spark plug, air filter, and fuel system cleaning', estimatedHours: 3, basePrice: 3000 },
      { name: 'Wheel Alignment', description: 'Four-wheel alignment and balancing', estimatedHours: 1.5, basePrice: 1200 },
      { name: 'Suspension Check', description: 'Suspension inspection and repair', estimatedHours: 2, basePrice: 2200 },
      { name: 'Denting & Painting', description: 'Minor dent removal and touch-up painting', estimatedHours: 8, basePrice: 5000 },
    ];

    await Service.bulkCreate(services);
    console.log('✅ Services created:', services.length);

    console.log('\n🎉 Seeding complete!');
    console.log('\nLogin Credentials:');
    console.log('Admin:    admin@vsm.com    / Admin@123');
    console.log('Customer: john@example.com / Customer@123');
    console.log('Mechanic: ravi@vsm.com     / Mechanic@123');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seed();
