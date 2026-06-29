const User = require('./User');
const Customer = require('./Customer');
const Mechanic = require('./Mechanic');
const Vehicle = require('./Vehicle');
const Service = require('./Service');
const Booking = require('./Booking');
const RepairNote = require('./RepairNote');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Notification = require('./Notification');
const Feedback = require('./Feedback');

// User -> Customer (1:1)
User.hasOne(Customer, { foreignKey: 'userId', as: 'customerProfile' });
Customer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> Mechanic (1:1)
User.hasOne(Mechanic, { foreignKey: 'userId', as: 'mechanicProfile' });
Mechanic.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Customer -> Vehicles (1:Many)
Customer.hasMany(Vehicle, { foreignKey: 'customerId', as: 'vehicles' });
Vehicle.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Customer -> Bookings (1:Many)
Customer.hasMany(Booking, { foreignKey: 'customerId', as: 'bookings' });
Booking.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Vehicle -> Bookings (1:Many)
Vehicle.hasMany(Booking, { foreignKey: 'vehicleId', as: 'bookings' });
Booking.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Service -> Bookings (1:Many)
Service.hasMany(Booking, { foreignKey: 'serviceId', as: 'bookings' });
Booking.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });

// Mechanic -> Bookings (1:Many)
Mechanic.hasMany(Booking, { foreignKey: 'mechanicId', as: 'bookings' });
Booking.belongsTo(Mechanic, { foreignKey: 'mechanicId', as: 'mechanic' });

// Booking -> RepairNotes (1:Many)
Booking.hasMany(RepairNote, { foreignKey: 'bookingId', as: 'repairNotes' });
RepairNote.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// Mechanic -> RepairNotes (1:Many)
Mechanic.hasMany(RepairNote, { foreignKey: 'mechanicId', as: 'repairNotes' });
RepairNote.belongsTo(Mechanic, { foreignKey: 'mechanicId', as: 'mechanic' });

// Booking -> Invoice (1:1)
Booking.hasOne(Invoice, { foreignKey: 'bookingId', as: 'invoice' });
Invoice.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

// Invoice -> InvoiceItems (1:Many)
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoiceId', as: 'items' });
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoiceId', as: 'invoice' });

// User -> Notifications (1:Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Customer -> Feedback (1:Many)
Customer.hasMany(Feedback, { foreignKey: 'customerId', as: 'feedbacks' });
Feedback.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });

// Booking -> Feedback (1:Many)
Booking.hasMany(Feedback, { foreignKey: 'bookingId', as: 'feedbacks' });
Feedback.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });

module.exports = {
  User,
  Customer,
  Mechanic,
  Vehicle,
  Service,
  Booking,
  RepairNote,
  Invoice,
  InvoiceItem,
  Notification,
  Feedback,
};
