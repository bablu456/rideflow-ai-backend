import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Car,
  CheckCircle2,
  Clock3,
  Flag,
  LogOut,
  Power,
  RefreshCw,
  Play,
} from 'lucide-react';
import { clearSession, getPrimaryRole } from '../utils/auth';

const API_BASE = 'http://localhost:8080';

const statusBadgeClass = (status) => {
  switch (status) {
    case 'REQUESTED':
      return 'bg-amber-100 text-amber-900 border-amber-200';
    case 'ACCEPTED':
      return 'bg-blue-100 text-blue-900 border-blue-200';
    case 'STARTED':
      return 'bg-green-100 text-green-900 border-green-200';
    case 'COMPLETED':
      return 'bg-gray-200 text-gray-700 border-gray-300';
    case 'CANCELLED':
      return 'bg-rose-100 text-rose-800 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const DriverDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [driver, setDriver] = useState(null);
  const [rides, setRides] = useState([]);
  const [otpByRide, setOtpByRide] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (getPrimaryRole() !== 'DRIVER') {
      navigate('/');
    }
  }, [navigate, token]);

  const fetchDashboardData = async (silent = false) => {
    if (!token) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError('');

    try {
      const meResponse = await axios.get(`${API_BASE}/api/driver/me`, {
        headers: authHeaders,
      });
      const driverProfile = meResponse.data;
      setDriver(driverProfile);

      const ridesResponse = await axios.get(
        `${API_BASE}/api/rides/driver/${driverProfile.id}`,
        {
          headers: authHeaders,
        }
      );
      setRides(ridesResponse.data || []);
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          fetchError.response?.data?.error ||
          'Unable to load driver dashboard.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 8000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const handleAvailability = async (nextAvailable) => {
    if (!driver?.id) return;

    try {
      const response = await axios.put(
        `${API_BASE}/api/driver/${driver.id}/availability`,
        null,
        {
          params: { available: nextAvailable },
          headers: authHeaders,
        }
      );

      setDriver(response.data);
      setBanner(nextAvailable ? 'You are now online and receiving rides.' : 'You are now offline.');
      await fetchDashboardData(true);
    } catch (availabilityError) {
      setError(
        availabilityError.response?.data?.message ||
          availabilityError.response?.data?.error ||
          'Failed to update availability.'
      );
    }
  };

  const handleAcceptRide = async (rideId) => {
    try {
      await axios.post(`${API_BASE}/api/rides/${rideId}/accept`, null, {
        headers: authHeaders,
      });
      setBanner(`Ride #${rideId} accepted.`);
      await fetchDashboardData(true);
    } catch (acceptError) {
      setError(
        acceptError.response?.data?.message ||
          acceptError.response?.data?.error ||
          'Unable to accept ride.'
      );
    }
  };

  const handleStartRide = async (rideId) => {
    const otp = (otpByRide[rideId] || '').trim();
    if (!otp) {
      setError('Please enter OTP before starting the ride.');
      return;
    }

    try {
      await axios.post(
        `${API_BASE}/api/rides/${rideId}/start`,
        { otp },
        { headers: authHeaders }
      );
      setBanner(`Ride #${rideId} started.`);
      await fetchDashboardData(true);
    } catch (startError) {
      setError(
        startError.response?.data?.message ||
          startError.response?.data?.error ||
          'Unable to start ride.'
      );
    }
  };

  const handleCompleteRide = async (rideId) => {
    try {
      await axios.post(`${API_BASE}/api/rides/${rideId}/complete`, null, {
        headers: authHeaders,
      });
      setBanner(`Ride #${rideId} completed.`);
      await fetchDashboardData(true);
    } catch (completeError) {
      setError(
        completeError.response?.data?.message ||
          completeError.response?.data?.error ||
          'Unable to complete ride.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-white to-stone-200 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
          <div className="p-6 md:p-8 bg-gradient-to-r from-stone-900 to-zinc-800 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-300 mb-2">Driver Console</p>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Car className="w-8 h-8" /> RideFlow Driver
                </h1>
                <p className="text-stone-300 mt-2 text-sm">
                  Manage availability and handle your assigned rides in real time.
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2 text-sm font-semibold transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            {error && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 text-rose-800 p-3 text-sm">
                {error}
              </div>
            )}
            {banner && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 p-3 text-sm">
                {banner}
              </div>
            )}

            {loading ? (
              <div className="text-sm text-stone-600">Loading driver dashboard...</div>
            ) : (
              <>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-1">Driver profile</p>
                    <p className="text-lg font-bold text-stone-900">{driver?.user?.name || 'Driver'}</p>
                    <p className="text-sm text-stone-600">{driver?.vehicleType || 'Vehicle'} - {driver?.vehiclePlateNumber || 'N/A'}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAvailability(!(driver?.isAvailable ?? false))}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
                        driver?.isAvailable
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-zinc-900 text-white hover:bg-black'
                      }`}
                    >
                      <Power className="w-4 h-4" />
                      {driver?.isAvailable ? 'Go Offline' : 'Go Online'}
                    </button>

                    <button
                      onClick={() => fetchDashboardData(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-sm font-semibold transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold text-stone-900">Assigned Rides</h2>
                    <span className="text-xs uppercase tracking-[0.15em] text-stone-500">{rides.length} total</span>
                  </div>

                  {rides.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-500">
                      No rides yet. Stay online to receive requests.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rides.map((ride) => (
                        <div key={ride.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div>
                              <p className="font-semibold text-stone-900">Ride #{ride.id}</p>
                              <p className="text-sm text-stone-600">
                                Fare: Rs {ride.fare ?? '--'} | Distance: {ride.distanceKm ?? '--'} km
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-xs font-bold w-fit ${statusBadgeClass(ride.status)}`}>
                              {ride.status}
                            </span>
                          </div>

                          <div className="mt-4">
                            {ride.status === 'REQUESTED' && (
                              <button
                                onClick={() => handleAcceptRide(ride.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 text-sm font-semibold transition"
                              >
                                <CheckCircle2 className="w-4 h-4" /> Accept Ride
                              </button>
                            )}

                            {ride.status === 'ACCEPTED' && (
                              <div className="flex flex-col md:flex-row gap-2">
                                <input
                                  value={otpByRide[ride.id] || ''}
                                  onChange={(e) =>
                                    setOtpByRide((prev) => ({ ...prev, [ride.id]: e.target.value }))
                                  }
                                  placeholder="Enter rider OTP"
                                  className="flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-500"
                                />
                                <button
                                  onClick={() => handleStartRide(ride.id)}
                                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-semibold transition"
                                >
                                  <Play className="w-4 h-4" /> Start Ride
                                </button>
                              </div>
                            )}

                            {ride.status === 'STARTED' && (
                              <button
                                onClick={() => handleCompleteRide(ride.id)}
                                className="inline-flex items-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-semibold transition"
                              >
                                <Flag className="w-4 h-4" /> Complete Ride
                              </button>
                            )}

                            {(ride.status === 'COMPLETED' || ride.status === 'CANCELLED') && (
                              <p className="inline-flex items-center gap-2 text-sm text-stone-500">
                                <Clock3 className="w-4 h-4" /> Ride closed
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
