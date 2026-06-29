const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  bookingId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true,
    references: { model: 'bookings', key: 'id' },
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true,
  },
  serviceCharge: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  labourCharge: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  partsCharge: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  gstRate: {
    type: DataTypes.FLOAT,
    defaultValue: 18,
    comment: 'GST percentage',
  },
  discount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  subtotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  gstAmount: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  grandTotal: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  paymentStatus: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Partial', 'Refunded'),
    defaultValue: 'Pending',
  },
  paymentMethod: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'invoices',
  hooks: {
    beforeCreate: async (invoice) => {
      const count = await invoice.constructor.count();
      invoice.invoiceNumber = `INV${new Date().getFullYear()}${String(count + 1).padStart(5, '0')}`;
    },
    beforeSave: (invoice) => {
      const subtotal = invoice.serviceCharge + invoice.labourCharge + invoice.partsCharge - invoice.discount;
      invoice.subtotal = Math.max(0, subtotal);
      invoice.gstAmount = parseFloat(((invoice.subtotal * invoice.gstRate) / 100).toFixed(2));
      invoice.grandTotal = parseFloat((invoice.subtotal + invoice.gstAmount).toFixed(2));
    },
  },
});

module.exports = Invoice;
