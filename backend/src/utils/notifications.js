const { Notification } = require('../models');

/**
 * Create a notification for a user
 */
const createNotification = async ({ userId, title, message, type = 'general', referenceId = null, referenceType = null }) => {
  try {
    await Notification.create({ userId, title, message, type, referenceId, referenceType });
  } catch (err) {
    console.error('Notification creation error:', err.message);
  }
};

/**
 * Notification templates for booking events
 */
const notifyBookingCreated = async (userId, bookingNumber) => {
  await createNotification({
    userId,
    title: 'Booking Created',
    message: `Your booking ${bookingNumber} has been created and is pending approval.`,
    type: 'booking_created',
  });
};

const notifyBookingApproved = async (userId, bookingNumber) => {
  await createNotification({
    userId,
    title: 'Booking Approved',
    message: `Your booking ${bookingNumber} has been approved. A mechanic will be assigned soon.`,
    type: 'booking_approved',
  });
};

const notifyMechanicAssigned = async (userId, bookingNumber, mechanicName) => {
  await createNotification({
    userId,
    title: 'Mechanic Assigned',
    message: `${mechanicName} has been assigned to your booking ${bookingNumber}.`,
    type: 'mechanic_assigned',
  });
};

const notifyServiceCompleted = async (userId, bookingNumber) => {
  await createNotification({
    userId,
    title: 'Service Completed',
    message: `Your vehicle service for booking ${bookingNumber} is complete. Invoice is ready.`,
    type: 'service_completed',
  });
};

const notifyInvoiceGenerated = async (userId, invoiceNumber) => {
  await createNotification({
    userId,
    title: 'Invoice Generated',
    message: `Invoice ${invoiceNumber} has been generated for your service. Please complete payment.`,
    type: 'invoice_generated',
  });
};

const notifyPaymentReceived = async (userId, invoiceNumber) => {
  await createNotification({
    userId,
    title: 'Payment Received',
    message: `Payment for invoice ${invoiceNumber} has been received. Thank you!`,
    type: 'payment_received',
  });
};

module.exports = {
  createNotification,
  notifyBookingCreated,
  notifyBookingApproved,
  notifyMechanicAssigned,
  notifyServiceCompleted,
  notifyInvoiceGenerated,
  notifyPaymentReceived,
};
