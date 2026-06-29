const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RepairNote = sequelize.define('RepairNote', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'bookings', key: 'id' },
  },
  mechanicId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'mechanics', key: 'id' },
  },
  noteType: {
    type: DataTypes.ENUM('inspection', 'repair', 'parts', 'general'),
    defaultValue: 'general',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  estimatedCompletion: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
}, {
  tableName: 'repair_notes',
});

module.exports = RepairNote;
