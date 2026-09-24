import React from 'react';
import VideoCall from "./pages/VideoCall";
import ViewResources from "./pages/ViewResources";
import MyBookings from './pages/MyBookings';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import MenteeSignupPage from './pages/MenteeSignupPage';
import MentorSignupPage from './pages/MentorSignupPage';
import MenteeDashboard from './pages/MenteeDashboard';
import MentorDashboard from './pages/MentorDashboard';
import ExploreMentors from './pages/ExploreMentors';
import AIChatbot from './pages/AIChatbot';
import FlexibleScheduling from './pages/FlexibleScheduling';
import Roadmap from './pages/Roadmap';
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import CodingTracker from "./pages/CodingTracker";

// Import Mentor Dashboard pages
import ManageMentees from './pages/ManageMentees';  // Create/manage this component
import ScheduleMeetings from './pages/ScheduleMeetings';  // Create/manage this component
import ResourcesMaterials from './pages/ResourcesMaterials';  // Create/manage this component
import ReviewRequests from './pages/ReviewRequests';  // Create/manage this component

import PerformanceDashboard from './pages/PerformanceDashboard';  // Create/manage this component
import MentorAvailability from './pages/MentorAvailability';

function App() {
  return (
    <Router>
      <main className="flex-grow">
        <Routes>
          {/* Common Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/mentee" element={<LoginPage defaultRole="mentee" />} />
          <Route path="/login/mentor" element={<LoginPage defaultRole="mentor" />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/mentee-signup" element={<MenteeSignupPage />} />
          <Route path="/mentor-signup" element={<MentorSignupPage />} />

          {/* Mentee-Specific Routes */}
          <Route path="/mentee-dashboard" element={<MenteeDashboard />} />
          <Route path="/explore-mentors" element={<ExploreMentors />} />
          <Route path="/ai-chatbot" element={<AIChatbot />} />
          <Route path="/flexible-scheduling" element={<FlexibleScheduling />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/my-bookings" element={<MyBookings />} />
          <Route path="/resources" element={<ViewResources />} />
          <Route path="/coding-tracker" element={<CodingTracker />} />

          {/* Mentor-Specific Routes */}
          <Route path="/mentor-dashboard" element={<MentorDashboard />} />
          <Route path="/manage-mentees" element={<ManageMentees />} />  {/* Manage Mentees */}
          <Route path="/schedule-meetings" element={<ScheduleMeetings />} />  {/* Schedule Meetings */}
          <Route path="/resources-materials" element={<ResourcesMaterials />} />  {/* Resources & Materials */}
          <Route path="/review-requests" element={<ReviewRequests />} />  {/* Review Requests */}
          
          <Route path="/performance-dashboard" element={<PerformanceDashboard />} />  {/* Performance Dashboard */}
          <Route path="/mentor-availability" element={<MentorAvailability />} />  {/* Mentor Availability */}
          <Route path="/video-call" element={<VideoCall />} />
          <Route path="/profile" element={<Profile />} />
<Route path="/messages" element={<Messages />} />
<Route path="/settings" element={<Settings />} />
          
        </Routes>
      </main>
    </Router>
  );
}

export default App;
