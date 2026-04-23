import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingSpinner, PageTransition } from './components/UI';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Profile from './pages/Profile';
import OAuthRedirect from './pages/OAuthRedirect';
import AdminDashboard from './pages/AdminDashboard';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import SavedJobs from './pages/SavedJobs';

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

function AnimatedPage({ children }) {
  return <PageTransition>{children}</PageTransition>;
}

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div className="full-screen-center"><LoadingSpinner /></div>;
  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'RECRUITER' ? '/recruiter/dashboard' : '/jobs'} replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AnimatedPage><Login /></AnimatedPage>} />
          <Route path="/register" element={<AnimatedPage><Register /></AnimatedPage>} />
          <Route path="/oauth-redirect" element={<AnimatedPage><OAuthRedirect /></AnimatedPage>} />

          <Route path="/jobs" element={<AnimatedPage><Jobs /></AnimatedPage>} />
          <Route path="/jobs/:jobId" element={<AnimatedPage><JobDetail /></AnimatedPage>} />

          <Route path="/" element={<AnimatedPage><Landing /></AnimatedPage>} />

          <Route
            path="/profile"
            element={<PrivateRoute><AnimatedPage><Profile /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/messages"
            element={<PrivateRoute><AnimatedPage><Messages /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/notifications"
            element={<PrivateRoute><AnimatedPage><Notifications /></AnimatedPage></PrivateRoute>}
          />

          <Route
            path="/applications"
            element={<PrivateRoute allowedRoles={['CANDIDATE']}><AnimatedPage><MyApplications /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/interviews"
            element={<PrivateRoute allowedRoles={['CANDIDATE']}><AnimatedPage><CandidateInterviews /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/saved-jobs"
            element={<PrivateRoute allowedRoles={['CANDIDATE']}><AnimatedPage><SavedJobs /></AnimatedPage></PrivateRoute>}
          />

          <Route
            path="/recruiter/dashboard"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><RecruiterDashboard /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/jobs"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><RecruiterJobs /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/jobs/new"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><JobForm /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/jobs/:jobId/edit"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><JobForm /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/jobs/:jobId/applications"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><JobApplications /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/applications"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><RecruiterApplications /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/interviews"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><RecruiterInterviews /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/analytics"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><RecruiterAnalytics /></AnimatedPage></PrivateRoute>}
          />
          <Route
            path="/recruiter/subscription"
            element={<PrivateRoute allowedRoles={['RECRUITER']}><AnimatedPage><RecruiterSubscription /></AnimatedPage></PrivateRoute>}
          />

          <Route
            path="/admin/dashboard"
            element={<PrivateRoute allowedRoles={['ADMIN']}><AnimatedPage><AdminDashboard /></AnimatedPage></PrivateRoute>}
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
