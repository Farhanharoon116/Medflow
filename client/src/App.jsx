import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import DashboardLayout from './layouts/DashboardLayout'
import LoginPage from './pages/auth/LoginPage'
import PatientRegisterPage from './pages/auth/PatientRegisterPage'
import RegisterPage from './pages/auth/RegisterPage'

// Dashboards
import AdminDashboard from './pages/dashboard/AdminDashboard'
import DoctorDashboard from './pages/dashboard/DoctorDashboard'
import ReceptionistDashboard from './pages/dashboard/ReceptionistDashboard'

// Shared pages
import PatientsPage from './pages/patients/PatientsPage'
import PatientDetailPage from './pages/patients/PatientDetailPage'
import AppointmentsPage from './pages/appointments/AppointmentsPage'
import PrescriptionsPage from './pages/prescriptions/PrescriptionsPage'
import CreatePrescriptionPage from './pages/prescriptions/CreatePrescriptionPage'

// Patient-only pages
import PatientAppointmentsPage from './pages/patients/PatientAppointmentsPage'
import PatientPrescriptionsPage from './pages/patients/PatientPrescriptionsPage'
import CurrentMedicinesPage from './pages/patients/CurrentMedicinesPage'
import MyLabResultsPage from './pages/patients/MyLabResultsPage'
import PatientProfilePage from './pages/patients/PatientProfilePage'

// Admin-only pages
import ManageStaffPage from './pages/admin/ManageStaffPage'
import SubscriptionPage from './pages/admin/SubscriptionPage'
import ClinicProfilePage from './pages/admin/ClinicProfilePage'
import QueueDisplayPage from './pages/QueueDisplayPage'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }
  return children
}

const DashboardRedirect = () => {
  const { user } = useAuthStore()
  if (user?.role === 'admin') return <Navigate to="/dashboard/admin" replace />
  if (user?.role === 'doctor') return <Navigate to="/dashboard/doctor" replace />
  if (user?.role === 'receptionist') return <Navigate to="/dashboard/receptionist" replace />
  if (user?.role === 'patient') return <Navigate to="/dashboard/my-profile" replace />
  return <Navigate to="/dashboard/appointments" replace />
}

export default function App() {
  const { isAuthenticated, fetchMe } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) fetchMe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register-patient" element={<PatientRegisterPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/queue" element={<QueueDisplayPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard"
        element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardRedirect />} />

        {/* Admin */}
        <Route path="admin"
          element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="staff"
          element={<ProtectedRoute allowedRoles={['admin']}><ManageStaffPage /></ProtectedRoute>} />
        <Route path="subscription"
          element={<ProtectedRoute allowedRoles={['admin']}><SubscriptionPage /></ProtectedRoute>} />
        <Route path="clinic-profile"
          element={<ProtectedRoute allowedRoles={['admin']}><ClinicProfilePage /></ProtectedRoute>} />

        {/* Doctor */}
        <Route path="doctor"
          element={<ProtectedRoute allowedRoles={['doctor', 'admin']}><DoctorDashboard /></ProtectedRoute>} />

        {/* Receptionist */}
        <Route path="receptionist"
          element={<ProtectedRoute allowedRoles={['receptionist']}><ReceptionistDashboard /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="patients" element={<PatientsPage />} />
        <Route path="patients/:id" element={<PatientDetailPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="prescriptions" element={<PrescriptionsPage />} />
        <Route path="prescriptions/new"
          element={<ProtectedRoute allowedRoles={['doctor']}><CreatePrescriptionPage /></ProtectedRoute>} />

        {/* Patient only */}
        <Route path="my-profile"
          element={<ProtectedRoute allowedRoles={['patient']}><PatientProfilePage /></ProtectedRoute>} />
        <Route path="my-appointments"
          element={<ProtectedRoute allowedRoles={['patient']}><PatientAppointmentsPage /></ProtectedRoute>} />
        <Route path="my-prescriptions"
          element={<ProtectedRoute allowedRoles={['patient']}><PatientPrescriptionsPage /></ProtectedRoute>} />
        <Route path="my-medicines"
          element={<ProtectedRoute allowedRoles={['patient']}><CurrentMedicinesPage /></ProtectedRoute>} />
        <Route path="my-lab-results"
          element={<ProtectedRoute allowedRoles={['patient']}><MyLabResultsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}