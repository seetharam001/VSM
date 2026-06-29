import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, PublicRoute } from './utils/ProtectedRoute';
import { NotFound, Forbidden } from './pages/ErrorPages';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminMechanics from './pages/admin/AdminMechanics';
import AdminServices from './pages/admin/AdminServices';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminInvoices from './pages/admin/AdminInvoices';
import AdminFeedback from './pages/admin/AdminFeedback';
import AdminReports from './pages/admin/AdminReports';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CustomerVehicles from './pages/customer/CustomerVehicles';
import CustomerBookings from './pages/customer/CustomerBookings';
import CustomerInvoices from './pages/customer/CustomerInvoices';
import CustomerHistory from './pages/customer/CustomerHistory';
import CustomerFeedback from './pages/customer/CustomerFeedback';
import CustomerProfile from './pages/customer/CustomerProfile';

// Mechanic Pages
import MechanicDashboard from './pages/mechanic/MechanicDashboard';
import MechanicJobs from './pages/mechanic/MechanicJobs';
import MechanicProfile from './pages/mechanic/MechanicProfile';

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
      <Route path="/reset-password/:token" element={<PublicRoute><ResetPassword /></PublicRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/bookings" element={<ProtectedRoute allowedRoles={['admin']}><AdminBookings /></ProtectedRoute>} />
      <Route path="/admin/mechanics" element={<ProtectedRoute allowedRoles={['admin']}><AdminMechanics /></ProtectedRoute>} />
      <Route path="/admin/services" element={<ProtectedRoute allowedRoles={['admin']}><AdminServices /></ProtectedRoute>} />
      <Route path="/admin/customers" element={<ProtectedRoute allowedRoles={['admin']}><AdminCustomers /></ProtectedRoute>} />
      <Route path="/admin/invoices" element={<ProtectedRoute allowedRoles={['admin']}><AdminInvoices /></ProtectedRoute>} />
      <Route path="/admin/feedback" element={<ProtectedRoute allowedRoles={['admin']}><AdminFeedback /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>} />

      {/* Customer Routes */}
      <Route path="/customer" element={<ProtectedRoute allowedRoles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
      <Route path="/customer/vehicles" element={<ProtectedRoute allowedRoles={['customer']}><CustomerVehicles /></ProtectedRoute>} />
      <Route path="/customer/bookings" element={<ProtectedRoute allowedRoles={['customer']}><CustomerBookings /></ProtectedRoute>} />
      <Route path="/customer/invoices" element={<ProtectedRoute allowedRoles={['customer']}><CustomerInvoices /></ProtectedRoute>} />
      <Route path="/customer/history" element={<ProtectedRoute allowedRoles={['customer']}><CustomerHistory /></ProtectedRoute>} />
      <Route path="/customer/feedback" element={<ProtectedRoute allowedRoles={['customer']}><CustomerFeedback /></ProtectedRoute>} />
      <Route path="/customer/profile" element={<ProtectedRoute allowedRoles={['customer']}><CustomerProfile /></ProtectedRoute>} />

      {/* Mechanic Routes */}
      <Route path="/mechanic" element={<ProtectedRoute allowedRoles={['mechanic']}><MechanicDashboard /></ProtectedRoute>} />
      <Route path="/mechanic/jobs" element={<ProtectedRoute allowedRoles={['mechanic']}><MechanicJobs /></ProtectedRoute>} />
      <Route path="/mechanic/profile" element={<ProtectedRoute allowedRoles={['mechanic']}><MechanicProfile /></ProtectedRoute>} />

      {/* Error pages */}
      <Route path="/403" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
