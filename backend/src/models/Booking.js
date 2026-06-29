const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'customers', key: 'id' },
  },
  vehicleId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'vehicles', key: 'id' },
  },
  serviceId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'services', key: 'id' },
  },
  mechanicId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'mechanics', key: 'id' },
  },
  preferredDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  problemDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM(
      'Pending',
      'Approved',
      'Mechanic Assigned',
      'Inspection Started',
      'Repair In Progress',
      'Waiting for Parts',
      'Completed',
      'Cancelled'
    ),
    defaultValue: 'Pending',
  },
  adminNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'bookings',
  hooks: {
    beforeCreate: async (booking) => {
      const count = await booking.constructor.count();
      booking.bookingNumber = `BK${String(count + 1).padStart(6, '0')}`;
    },
  },
});

module.exports = Booking;
