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
  Bell,
  X,
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

const NewRideNotification = ({ show, onClose, count }) => {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-bounce-in">
      <div className="bg-black text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[300px] border border-stone-700">
        <div className="bg-green-500 p-3 rounded-full animate-pulse">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-lg">New Ride Request!</h4>
          <p className="text-sm text-stone-300">{count} new ride{count > 1 ? 's' : ''} available nearby.</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-stone-800 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const DriverDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [driver, setDriver] = useState(null);
  const [rides, setRides] = useState([]);
  const [availableRides, setAvailableRides] = useState([]);
  const [otpByRide, setOtpByRide] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  const [showNotification, setShowNotification] = useState(false);
  const [previousAvailableRides, setPreviousAvailableRides] = useState([]);

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

      // Fetch Active/History Rides for this driver
      const ridesResponse = await axios.get(
        `${API_BASE}/api/rides/driver/${driverProfile.id}`,
        {
          headers: authHeaders,
        }
      );
      setRides(ridesResponse.data || []);

      // Fetch Available/Requested Rides (Global)
      const availableResponse = await axios.get(
        `${API_BASE}/api/rides/available`,
        { headers: authHeaders }
      );
      setAvailableRides(availableResponse.data || []);

      const newRides = availableResponse.data || [];

      // Check if there are any NEW rides that weren't there before
      // We check if the length increased OR if there are new IDs
      if (newRides.length > 0 && !loading) {
        const newRideIds = new Set(newRides.map(r => r.id));
        const prevRideIds = new Set(previousAvailableRides.map(r => r.id));

        const hasNew = newRides.some(r => !prevRideIds.has(r.id));

        if (hasNew) {
          setShowNotification(true);
          // Optional: Play sound here
          // const audio = new Audio('/notification.mp3');
          // audio.play().catch(e => console.log('Audio play failed', e));
        }
      }

      setPreviousAvailableRides(newRides);

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
  }
  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) return;
    try {
      await axios.post(`${API_BASE}/api/rides/${rideId}/cancel`, null, {
        headers: authHeaders,
      });
      setBanner(`Ride #${rideId} cancelled.`);
      await fetchDashboardData(true);
    } catch (cancelError) {
      setError(
        cancelError.response?.data?.message ||
        'Unable to cancel ride.'
      );
    }
  };

  const handleDismissRide = (rideId) => {
    // Ideally call an API to hide/archive, but for now just filter out locally
    setRides(prev => prev.filter(r => r.id !== rideId));
  };


  const activeRide = useMemo(() => {
    return rides.find(r => r.status === 'ACCEPTED' || r.status === 'STARTED');
  }, [rides]);

  // availableRides is now managed by separate state from API
  // const availableRides = useMemo(() => {
  //   return rides.filter(r => r.status === 'REQUESTED');
  // }, [rides]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-white to-stone-200 p-4 md:p-8">
      <NewRideNotification
        show={showNotification}
        onClose={() => setShowNotification(false)}
        count={Math.max(1, availableRides.length - previousAvailableRides.length > 0 ? availableRides.length - previousAvailableRides.length : 1)}
      />
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
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${driver?.isAvailable
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
                  {activeRide ? (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold text-stone-900 mb-3 flex items-center gap-2">
                        <Play className="w-5 h-5 text-green-600" /> Current Active Ride
                      </h2>
                      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 shadow-md">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-green-800 mb-1">Ride #{activeRide.id}</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                              {activeRide.status === 'ACCEPTED' ? 'Heading to Pickup' : 'Ride in Progress'}
                            </h3>
                            <p className="text-sm text-stone-500 flex items-center gap-1">
                              Rider: <span className="font-semibold text-stone-800">{activeRide.riderName || 'Unknown User'}</span>
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadgeClass(activeRide.status)}`}>
                            {activeRide.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <p className="text-xs text-gray-500">Pick Up</p>
                            <p className="font-bold text-sm line-clamp-2">{activeRide.pickupArea || 'Location A'}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <p className="text-xs text-gray-500">Drop Off</p>
                            <p className="font-bold text-sm line-clamp-2">{activeRide.dropArea || 'Location B'}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <p className="text-xs text-gray-500">Fare</p>
                            <p className="font-bold text-lg">Rs {activeRide.fare}</p>
                          </div>
                          <div className="bg-white p-3 rounded-xl border border-green-100">
                            <p className="text-xs text-gray-500">Distance</p>
                            <p className="font-bold text-lg">{activeRide.distanceKm} km</p>
                          </div>
                        </div>

                        {activeRide.status === 'ACCEPTED' && (
                          <div className="flex flex-col gap-3">
                            <div className="flex gap-2">
                              <input
                                value={otpByRide[activeRide.id] || ''}
                                onChange={(e) =>
                                  setOtpByRide((prev) => ({ ...prev, [activeRide.id]: e.target.value }))
                                }
                                placeholder="Enter OTP to Start"
                                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-lg outline-none focus:ring-2 focus:ring-green-500"
                              />
                              <button
                                onClick={() => handleStartRide(activeRide.id)}
                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition"
                              >
                                START
                              </button>
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-xs text-gray-500">Ask rider for OTP upon arrival.</p>
                              <button
                                onClick={() => handleCancelRide(activeRide.id)}
                                className="text-red-500 text-xs font-semibold hover:text-red-700 underline"
                              >
                                Cancel Ride
                              </button>
                            </div>
                          </div>
                        )}

                        {activeRide.status === 'STARTED' && (
                          <button
                            onClick={() => handleCompleteRide(activeRide.id)}
                            className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                          >
                            <Flag className="w-5 h-5" /> COMPLETE RIDE
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-xl font-bold text-stone-900">Available Requests</h2>
                        <span className="text-xs uppercase tracking-[0.15em] text-stone-500">{availableRides.length} nearby</span>
                      </div>

                      {availableRides.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-16 text-center">
                          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Car className="w-8 h-8 text-stone-400" />
                          </div>
                          <p className="text-lg font-bold text-stone-600">No pending requests</p>
                          <p className="text-stone-400 text-sm">New rides will appear here automatically.</p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {availableRides.map((ride) => (
                            <div key={ride.id} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition">
                              <div className="flex justify-between items-start mb-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-lg">NEW REQUEST</span>
                                    <span className="text-[10px] text-stone-400 font-medium">
                                      {new Date(ride.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <h3 className="font-bold text-lg">Ride #{ride.id}</h3>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-xs text-stone-500 line-clamp-1"><span className="font-semibold text-stone-700">From:</span> {ride.pickupArea}</p>
                                    <p className="text-xs text-stone-500 line-clamp-1"><span className="font-semibold text-stone-700">To:</span> {ride.dropArea}</p>
                                    <p className="text-xs text-stone-500 mt-1">Rider: <span className="font-semibold text-stone-800">{ride.riderName}</span></p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-stone-500 uppercase">Est. Earning</p>
                                  <p className="text-2xl font-bold text-stone-900">Rs {ride.fare}</p>
                                  <p className="text-xs text-stone-500 mt-1">{ride.distanceKm} km</p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleAcceptRide(ride.id)}
                                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-stone-800 transition flex items-center justify-center gap-2"
                              >
                                <CheckCircle2 className="w-5 h-5" /> ACCEPT RIDE
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* Recent History Section */}
                  {rides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED').length > 0 && (
                    <div className="mt-8 border-t border-stone-200 pt-6">
                      <h3 className="text-lg font-bold text-stone-900 mb-4">Recent History</h3>
                      <div className="space-y-3">
                        {rides.filter(r => r.status === 'COMPLETED' || r.status === 'CANCELLED').map(ride => (
                          <div key={ride.id} className="flex justify-between items-center p-4 bg-white rounded-xl border border-stone-100 shadow-sm opacity-75 hover:opacity-100 transition">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass(ride.status)}`}>{ride.status}</span>
                                <span className="text-xs text-stone-400">{new Date(ride.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="font-semibold text-stone-800">Ride #{ride.id} - Rs {ride.fare}</p>
                              <p className="text-xs text-stone-500">Rider: {ride.riderName || 'Unknown'}</p>
                            </div>
                            <button
                              onClick={() => handleDismissRide(ride.id)}
                              className="text-stone-400 hover:text-red-500 p-2 transition"
                              title="Dismiss from view"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
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
