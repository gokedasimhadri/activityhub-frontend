import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Activities from './pages/Activities.jsx';
import ActivityForm from './pages/ActivityForm.jsx';
import ActivityDetail from './pages/ActivityDetail.jsx';
import Registrations from './pages/Registrations.jsx';
import StudentActivities from './pages/student/StudentActivities.jsx';
import StudentRegistration from './pages/student/StudentRegistration.jsx';
import StudentMyRegistrations from './pages/student/StudentMyRegistrations.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">Loading…</div>;
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>;

  // Student Portal Routes
  if (user.role === 'student') {
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<StudentActivities />} />
          <Route path="/activities" element={<StudentActivities />} />
          <Route path="/activities/:id/register" element={<StudentRegistration />} />
          <Route path="/my-registrations" element={<StudentMyRegistrations />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    );
  }

  // Admin / Faculty / HOD Routes
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/activities/new" element={<ActivityForm />} />
        <Route path="/activities/:id" element={<ActivityDetail />} />
        <Route path="/activities/:id/edit" element={<ActivityForm />} />
        <Route path="/registrations" element={<Registrations />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
