import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSpinner } from './components/UI';

import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Profile from './pages/Profile';
import OAuthRedirect from './pages/OAuthRedirect';
import AdminDashboard from './pages/AdminDashboard';

import MyApplications from './pages/MyApplications';
import CandidateInterviews from './pages/CandidateInterviews';

import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import RecruiterJobs from './pages/recruiter/RecruiterJobs';
import JobForm from './pages/recruiter/JobForm';
import JobApplications from './pages/recruiter/JobApplications';
import RecruiterApplications from './pages/recruiter/RecruiterApplications';
import RecruiterInterviews from './pages/recruiter/RecruiterInterviews';
import RecruiterAnalytics from './pages/recruiter/RecruiterAnalytics';
import RecruiterSubscription from './pages/recruiter/RecruiterSubscription';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="full-screen-center"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
     return <Navigate to={user.role === 'RECRUITER' ? '/recruiter/dashboard' : '/jobs'} replace />;
  }
  
  return children;
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/jobs" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'RECRUITER') return <Navigate to="/recruiter/dashboard" replace />;
  return <Navigate to="/jobs" replace />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-redirect" element={<OAuthRedirect />} />
          
          {/* Public Job Routes */}
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:jobId" element={<JobDetail />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Shared Protected */}
          <Route path="/profile" element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } />

          {/* Candidate Protected */}
          <Route path="/applications" element={
            <PrivateRoute allowedRoles={['CANDIDATE']}>
              <MyApplications />
            </PrivateRoute>
          } />
          <Route path="/interviews" element={
            <PrivateRoute allowedRoles={['CANDIDATE']}>
              <CandidateInterviews />
            </PrivateRoute>
          } />

          {/* Recruiter Protected */}
          <Route path="/recruiter/dashboard" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <RecruiterDashboard />
            </PrivateRoute>
          } />
          <Route path="/recruiter/jobs" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <RecruiterJobs />
            </PrivateRoute>
          } />
          <Route path="/recruiter/jobs/new" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <JobForm />
            </PrivateRoute>
          } />
          <Route path="/recruiter/jobs/:jobId/edit" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <JobForm />
            </PrivateRoute>
          } />
          <Route path="/recruiter/jobs/:jobId/applications" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <JobApplications />
            </PrivateRoute>
          } />
          <Route path="/recruiter/applications" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <RecruiterApplications />
            </PrivateRoute>
          } />
          <Route path="/recruiter/interviews" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <RecruiterInterviews />
            </PrivateRoute>
          } />
          <Route path="/recruiter/analytics" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <RecruiterAnalytics />
            </PrivateRoute>
          } />
          <Route path="/recruiter/subscription" element={
            <PrivateRoute allowedRoles={['RECRUITER']}>
              <RecruiterSubscription />
            </PrivateRoute>
          } />

          {/* Admin Protected */}
          <Route path="/admin/dashboard" element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AdminDashboard />
            </PrivateRoute>
          } />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
