import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, UserContext } from './context/UserContext';

// Components
import Navbar from './components/Navbar';

// Pages
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RequestStatus from './pages/RequestStatus';
import Suggestions from './pages/Suggestions';
import Inventory from './pages/Inventory';
import HospitalProfile from './pages/HospitalProfile';
import BloodBankProfile from './pages/BloodBankProfile';
import HospitalAnalytics from './pages/HospitalAnalytics';
import Services from './pages/Services';
import History from './pages/History';
import CampaignHistory from './pages/CampaignHistory';
import Billing from './pages/Billing';

// Route guards
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <div className="text-center py-20 text-red-600 font-bold">Loading BloodLink...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.type)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RootRoute = () => {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <div className="text-center py-20 text-red-600 font-bold">Loading BloodLink...</div>;
  }

  return user ? <Dashboard /> : <Landing />;
};

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Routes - General */}
              <Route 
                path="/request-status" 
                element={
                  <ProtectedRoute>
                    <RequestStatus />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/services" 
                element={
                  <ProtectedRoute>
                    <Services />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/billing" 
                element={
                  <ProtectedRoute>
                    <Billing />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/campaign-history" 
                element={
                  <ProtectedRoute>
                    <CampaignHistory />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes - Blood Bank Only */}
              <Route 
                path="/suggestions" 
                element={
                  <ProtectedRoute allowedRoles={['bloodbank']}>
                    <Suggestions />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/inventory/:bankId" 
                element={
                  <ProtectedRoute allowedRoles={['bloodbank']}>
                    <Inventory />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/bloodbank/:id" 
                element={
                  <ProtectedRoute allowedRoles={['bloodbank']}>
                    <BloodBankProfile />
                  </ProtectedRoute>
                } 
              />

              {/* Protected Routes - Hospital Only */}
              <Route 
                path="/history" 
                element={
                  <ProtectedRoute allowedRoles={['hospital']}>
                    <History />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hospital/:id" 
                element={
                  <ProtectedRoute allowedRoles={['hospital']}>
                    <HospitalProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/hospital-analytics/:id" 
                element={
                  <ProtectedRoute allowedRoles={['hospital']}>
                    <HospitalAnalytics />
                  </ProtectedRoute>
                } 
              />

              {/* Catch All Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;
