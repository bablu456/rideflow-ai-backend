import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import DriverDashboard from './pages/DriverDashboard';
import OtpLogin from './pages/OtpLogin';
import ForgotPassword from './pages/ForgotPassword';
import AiAssistant from './pages/AiAssistant';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/driver"
        element={
          <ProtectedRoute>
            <DriverDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/login-otp" element={<OtpLogin />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/signup" element={<Signup />} />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AiAssistant />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
