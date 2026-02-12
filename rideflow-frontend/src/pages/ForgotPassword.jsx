import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [debugOtp, setDebugOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSending(true);

    try {
      const response = await axios.post(`${API_BASE}/api/auth/password/forgot`, { identifier });
      setOtpSent(true);
      setDebugOtp(response.data?.debugOtp || '');
      setMessage(response.data?.message || 'Reset OTP sent successfully');
    } catch (sendError) {
      setError(
        sendError.response?.data?.message ||
        sendError.response?.data?.error ||
        'Failed to send password reset OTP'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsResetting(true);

    try {
      const response = await axios.post(`${API_BASE}/api/auth/password/reset`, {
        identifier,
        otp,
        newPassword,
      });

      setMessage(response.data?.message || 'Password reset successful');
      setTimeout(() => navigate('/login'), 1000);
    } catch (resetError) {
      setError(
        resetError.response?.data?.message ||
        resetError.response?.data?.error ||
        'Password reset failed'
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-black p-8 text-center">
          <h2 className="text-3xl font-bold text-white">Forgot Password</h2>
          <p className="text-gray-300 mt-2">Reset using OTP verification</p>
        </div>

        <div className="p-8 space-y-5">
          {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}
          {message && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">{message}</div>}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email or Phone</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@example.com or 9876543210"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isSending ? 'Sending OTP...' : 'Send Reset OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">OTP</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                  required
                />
              </div>

              {debugOtp && (
                <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  Dev OTP: <span className="font-bold tracking-wider">{debugOtp}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isResetting}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
              >
                {isResetting ? 'Resetting password...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSending}
                className="w-full border border-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                Resend OTP
              </button>
            </form>
          )}

          <div className="text-sm text-center text-gray-600">
            <Link to="/login" className="font-semibold text-black hover:underline">Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
