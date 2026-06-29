const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM(
      'booking_created',
      'booking_approved',
      'mechanic_assigned',
      'inspection_started',
      'repair_started',
      'service_completed',
      'invoice_generated',
      'payment_received',
      'general'
    ),
    defaultValue: 'general',
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  referenceId: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID of the related booking/invoice',
  },
  referenceType: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'notifications',
});

module.exports = Notification;
