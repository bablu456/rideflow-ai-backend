import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LogOut, Bike, Clock, Car, Package, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { clearSession, getPrimaryRole } from '../utils/auth';

const API_BASE = 'http://localhost:8080';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapRecenter = ({ lat, lng }) => {
  const map = useMap();

  useEffect(() => {
    if (lat && lng) {
      map.flyTo([lat, lng], 14, { duration: 2 });
    }
  }, [lat, lng, map]);

  return null;
};

const Home = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (getPrimaryRole() === 'DRIVER') {
      navigate('/driver');
    }
  }, [navigate, token]);

  const [rideStatus, setRideStatus] = useState('INITIAL');
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  const [fares, setFares] = useState({});
  const [currentOtp, setCurrentOtp] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);
  const [rideDetails, setRideDetails] = useState(null);

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isBooking, setIsBooking] = useState(false);

  const typingTimeoutRef = useRef(null);

  const resetRideState = () => {
    setRideStatus('INITIAL');
    setCurrentOtp(null);
    setCurrentRideId(null);
    setRideDetails(null);
    setFares({});
    setSelectedVehicle(null);
    setIsBooking(false);
  };

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const handleLogout = () => {
    clearSession();

    setPickup('');
    setDrop('');
    setSuggestions([]);
    setActiveField(null);
    setPickupCoords(null);
    setDropCoords(null);
    resetRideState();

    navigate('/login');
  };

  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) return;

    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`
      );
      setSuggestions(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleInputChange = (e, type) => {
    const value = e.target.value;
    if (type === 'pickup') {
      setPickup(value);
      setActiveField('pickup');
    } else {
      setDrop(value);
      setActiveField('drop');
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => fetchSuggestions(value), 700);
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);

    if (activeField === 'pickup') {
      setPickup(item.display_name);
      setPickupCoords({ lat, lon });
    } else {
      setDrop(item.display_name);
      setDropCoords({ lat, lon });
    }
    setSuggestions([]);
  };

  const handleFindDriver = async () => {
    if (!pickupCoords || !dropCoords) {
      alert('Please select valid locations from the list.');
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/rides/calculate`, {
        params: {
          pLat: pickupCoords.lat,
          pLon: pickupCoords.lon,
          dLat: dropCoords.lat,
          dLon: dropCoords.lon,
        },
        headers: authHeaders,
      });

      setFares(response.data);
      setRideStatus('SELECTING_VEHICLE');
    } catch (error) {
      alert(
        'Could not calculate fare: ' +
          (error.response?.data?.message || error.response?.data?.error || error.message)
      );
    }
  };

  const handleBookRide = async (vehicleType) => {
    if (!pickupCoords || !dropCoords) {
      alert('Please select valid locations first.');
      return;
    }

    const payload = {
      pickupLatitude: pickupCoords.lat,
      pickupLongitude: pickupCoords.lon,
      dropLatitude: dropCoords.lat,
      dropLongitude: dropCoords.lon,
      pickupArea: pickup,
      dropArea: drop,
      vehicleType: vehicleType.toUpperCase(),
    };

    try {
      const response = await axios.post(`${API_BASE}/api/rides/request`, payload, {
        headers: authHeaders,
      });

      const ride = response.data;
      setCurrentOtp(ride.otp || null);
      setCurrentRideId(ride.id || null);
      setRideDetails(ride);
      setRideStatus('SEARCHING_FOR_DRIVER');
    } catch (error) {
      const message =
        error.response?.data?.message || error.response?.data?.error || error.message;

      if (message?.toLowerCase().includes('no drivers available')) {
        alert(
          'No drivers are online right now. Register/login as a driver and go online from Driver Dashboard.'
        );
      } else {
        alert('Could not book ride. ' + message);
      }
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedVehicle?.type) return;

    setIsBooking(true);
    try {
      await handleBookRide(selectedVehicle.type);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      if (currentRideId) {
        await axios.post(`${API_BASE}/api/rides/${currentRideId}/cancel`, null, {
          headers: authHeaders,
        });
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
    } finally {
      resetRideState();
    }
  };

  useEffect(() => {
    if (rideStatus !== 'SEARCHING_FOR_DRIVER' || !currentRideId || !token) return;

    const pollRideStatus = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/rides/${currentRideId}`, {
          headers: authHeaders,
        });
        const latestRide = response.data;
        setRideDetails(latestRide);

        if (latestRide.status === 'STARTED') {
          setRideStatus('RIDE_STARTED');
        }

        if (latestRide.status === 'CANCELLED' || latestRide.status === 'COMPLETED') {
          resetRideState();
        }
      } catch (error) {
        console.error('Polling failed:', error);
      }
    };

    pollRideStatus();
    const interval = setInterval(pollRideStatus, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideStatus, currentRideId, token]);

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans">
      <style>
        {`@keyframes rideflowDrive {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(430px); }
        }`}
      </style>

      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-red-50 text-red-600 transition"
      >
        <LogOut size={20} />
      </button>

      <div className="absolute inset-0 z-0">
        <MapContainer center={[25.5941, 85.1376]} zoom={13} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickupCoords && <MapRecenter lat={pickupCoords.lat} lng={pickupCoords.lon} />}
          {dropCoords && <MapRecenter lat={dropCoords.lat} lng={dropCoords.lon} />}
          {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lon]} />}
          {dropCoords && <Marker position={[dropCoords.lat, dropCoords.lon]} />}
        </MapContainer>
      </div>

      <div className="absolute top-0 left-0 h-full w-full md:w-[450px] bg-white z-10 shadow-2xl flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RideFlow</h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-[0.25em]">Rider App</p>
        </div>

        {rideStatus === 'INITIAL' && (
          <div className="p-6 flex-1 overflow-y-auto bg-gradient-to-b from-white via-white to-gray-50">
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-[0.25em]">
                Quick options
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center justify-center rounded-2xl bg-black text-white py-3 shadow-lg">
                  <Car className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold">Ride</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-100 text-gray-400 py-3 border border-dashed border-gray-200 cursor-not-allowed">
                  <Package className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Package</span>
                  <span className="text-[10px] mt-0.5">Coming soon</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-100 text-gray-400 py-3 border border-dashed border-gray-200 cursor-not-allowed">
                  <Bike className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Rentals</span>
                  <span className="text-[10px] mt-0.5">Coming soon</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-gray-900">Where can we take you?</h2>

            <div className="space-y-4 relative">
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400">
                  <div className="w-2 h-2 bg-black rounded-full"></div>
                </div>
                <input
                  type="text"
                  placeholder="Add a pickup location"
                  className="w-full bg-gray-100 p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  value={pickup}
                  onChange={(e) => handleInputChange(e, 'pickup')}
                />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400">
                  <div className="w-2 h-2 bg-black rounded-sm"></div>
                </div>
                <input
                  type="text"
                  placeholder="Enter your destination"
                  className="w-full bg-gray-100 p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  value={drop}
                  onChange={(e) => handleInputChange(e, 'drop')}
                />
              </div>

              {suggestions.length > 0 && (
                <div className="absolute w-full bg-white shadow-xl rounded-lg mt-1 z-50 max-h-60 overflow-y-auto border border-gray-100">
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b"
                      onClick={() => handleSelectSuggestion(item)}
                    >
                      <div className="bg-gray-200 p-2 rounded-full">
                        <MapPin size={16} />
                      </div>
                      <p className="text-sm text-gray-700 truncate">{item.display_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleFindDriver}
              className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg mt-8 hover:bg-gray-800 transition shadow-lg disabled:bg-gray-300 disabled:text-gray-600 disabled:cursor-not-allowed"
              disabled={!pickupCoords || !dropCoords}
            >
              Search Rides
            </button>
          </div>
        )}

        {rideStatus === 'SELECTING_VEHICLE' && (
          <div className="p-6 flex-1 flex flex-col bg-white">
            <button
              onClick={() => {
                setRideStatus('INITIAL');
                setFares({});
              }}
              className="text-gray-500 hover:text-black mb-4 font-medium text-sm"
            >
              Back to Search
            </button>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Choose a ride</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Distance: {fares.distanceKm} km
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              <div
                onClick={() =>
                  setSelectedVehicle({
                    type: 'CAR',
                    label: 'Uber Go',
                    fare: fares.carFare,
                    eta: '3 mins',
                  }) || setRideStatus('CONFIRMING_RIDE')
                }
                className="flex items-center justify-between p-4 border-2 border-black rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src="https://links.papareact.com/3pn"
                    alt="Car"
                    className="w-16 h-10 object-contain"
                  />
                  <div>
                    <h3 className="font-bold text-lg">Uber Go</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1">
                      <Clock size={12} /> 3 mins away
                    </p>
                  </div>
                </div>
                <p className="font-bold text-lg">Rs {fares.carFare}</p>
              </div>

              <div
                onClick={() =>
                  setSelectedVehicle({
                    type: 'BIKE',
                    label: 'Moto',
                    fare: fares.bikeFare,
                    eta: '2 mins',
                  }) || setRideStatus('CONFIRMING_RIDE')
                }
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 flex justify-center">
                    <Bike className="w-10 h-10 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Moto</h3>
                    <p className="text-gray-500 text-sm">Affordable</p>
                  </div>
                </div>
                <p className="font-bold text-lg">Rs {fares.bikeFare}</p>
              </div>

              <div
                onClick={() =>
                  setSelectedVehicle({
                    type: 'CAR',
                    label: 'Premier',
                    fare: fares.premierFare,
                    eta: '5 mins',
                  }) || setRideStatus('CONFIRMING_RIDE')
                }
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-4">
                  <img
                    src="https://links.papareact.com/5w8"
                    alt="Lux"
                    className="w-16 h-10 object-contain"
                  />
                  <div>
                    <h3 className="font-bold text-lg">Premier</h3>
                    <p className="text-gray-500 text-sm">Luxury rides</p>
                  </div>
                </div>
                <p className="font-bold text-lg">Rs {fares.premierFare}</p>
              </div>
            </div>
          </div>
        )}

        {rideStatus === 'CONFIRMING_RIDE' && selectedVehicle && (
          <div className="p-6 flex-1 flex flex-col bg-white">
            <button
              onClick={() => setRideStatus('SELECTING_VEHICLE')}
              className="text-gray-500 hover:text-black mb-4 font-medium text-sm text-left"
            >
              Change vehicle
            </button>

            <h2 className="text-2xl font-bold mb-4 text-gray-900">Review your ride</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Trip details</p>
                <div className="space-y-3 text-sm text-gray-800">
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">Pickup</p>
                    <p className="font-medium line-clamp-2">{pickup || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-gray-500 mb-1">Destination</p>
                    <p className="font-medium line-clamp-2">{drop || 'Not set'}</p>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-gray-500">Distance</span>
                    <span className="text-sm font-semibold">
                      {fares.distanceKm ? `${fares.distanceKm} km` : '--'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedVehicle.type === 'BIKE' ? (
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      <Bike className="w-6 h-6 text-gray-800" />
                    </div>
                  ) : (
                    <img
                      src={
                        selectedVehicle.label === 'Premier'
                          ? 'https://links.papareact.com/5w8'
                          : 'https://links.papareact.com/3pn'
                      }
                      alt={selectedVehicle.label}
                      className="w-16 h-10 object-contain"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{selectedVehicle.label}</p>
                    <p className="text-xs text-gray-500">
                      {selectedVehicle.eta ? `${selectedVehicle.eta} away` : 'Nearby driver'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500">Estimated fare</p>
                  <p className="text-xl font-extrabold text-gray-900">Rs {selectedVehicle.fare ?? '--'}</p>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-900 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isBooking ? 'Booking your ride...' : 'Confirm and request driver'}
              </button>
              <button
                onClick={resetRideState}
                className="w-full bg-white text-gray-900 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {rideStatus === 'SEARCHING_FOR_DRIVER' && (
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-white via-gray-50 to-gray-100">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-black animate-spin mx-auto mb-6" />
              <p className="text-lg font-semibold text-gray-900">Waiting for your driver...</p>
              <p className="text-sm text-gray-500 mt-2">
                Driver will accept your ride request and start after OTP verification.
              </p>

              {rideDetails && (
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <p>
                    Status:{' '}
                    <span className="font-semibold text-gray-800">{rideDetails.status || 'REQUESTED'}</span>
                  </p>
                  {rideDetails.driverName && (
                    <p>
                      Driver: <span className="font-semibold text-gray-800">{rideDetails.driverName}</span>
                    </p>
                  )}
                  {rideDetails.vehiclePlateNumber && (
                    <p>
                      Vehicle:{' '}
                      <span className="font-semibold text-gray-800">{rideDetails.vehiclePlateNumber}</span>
                    </p>
                  )}
                  {rideDetails.distanceKm && (
                    <p>
                      Distance:{' '}
                      <span className="font-semibold text-gray-800">{rideDetails.distanceKm} km</span>
                    </p>
                  )}
                  {rideDetails.fare && (
                    <p>
                      Fare: <span className="font-semibold text-gray-800">Rs {rideDetails.fare}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            {currentOtp && (
              <div className="mb-6 rounded-xl border border-gray-200 bg-white px-6 py-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">Your OTP</p>
                <p className="text-4xl font-extrabold tracking-[0.35em] text-gray-900">{currentOtp}</p>
                <p className="text-xs text-gray-500 mt-2">Share this OTP with driver only after pickup.</p>
              </div>
            )}

            <button
              onClick={handleCancelRequest}
              className="w-full bg-white text-gray-900 border border-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-sm max-w-xs"
            >
              Cancel Request
            </button>
          </div>
        )}

        {rideStatus === 'RIDE_STARTED' && (
          <div className="p-6 flex-1 flex flex-col items-center justify-center bg-green-50 text-center">
            <div className="w-full rounded-2xl border border-green-200 bg-green-100 p-5 shadow-sm">
              <p className="text-2xl font-extrabold text-green-800">Ride Started! Enjoy your journey.</p>
              <p className="mt-2 text-sm text-green-900 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {rideDetails?.driverName
                  ? `${rideDetails.driverName} is driving you to destination.`
                  : 'Your trip is now in progress.'}
              </p>
            </div>

            <div className="relative mt-8 h-24 w-full max-w-xs overflow-hidden rounded-xl border border-green-200 bg-white">
              <div className="absolute inset-x-0 bottom-3 h-1 bg-green-200" />
              <div
                className="absolute bottom-4 text-green-700"
                style={{ animation: 'rideflowDrive 2.6s linear infinite' }}
              >
                <Car size={36} />
              </div>
            </div>

            <button
              onClick={resetRideState}
              className="mt-8 w-full max-w-xs bg-green-700 text-white py-3 rounded-lg font-semibold hover:bg-green-800 transition"
            >
              Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
