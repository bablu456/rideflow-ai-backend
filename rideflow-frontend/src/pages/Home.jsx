import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LogOut, Bike, Clock, Car, Package } from 'lucide-react';
import axios from 'axios';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';

// 🛑 Leaflet Icon Fix
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// 🔥 Helper: Map ko move karne ke liye
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

  // 🛡️ Security Check & Token
  const token = localStorage.getItem('token');
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [navigate, token]);

  // 🔄 Ride flow + UI state
  const [rideStatus, setRideStatus] = useState('INITIAL'); // 'INITIAL' | 'SELECTING_VEHICLE' | 'CONFIRMING_RIDE' | 'SEARCHING_FOR_DRIVER'

  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  // 📍 Coordinates
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);

  // 💰 FARES STATE (Backend se aayega)
  const [fares, setFares] = useState({});

  // 🔢 Ride / OTP details
  const [currentOtp, setCurrentOtp] = useState(null);
  const [currentRideId, setCurrentRideId] = useState(null);

  // 🚕 Selected vehicle & booking state
  const [selectedVehicle, setSelectedVehicle] = useState(null); // { type, label, fare, eta }
  const [isBooking, setIsBooking] = useState(false);

  const typingTimeoutRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('token');

    // Reset local UI state so next login starts clean
    setPickup('');
    setDrop('');
    setSuggestions([]);
    setActiveField(null);
    setPickupCoords(null);
    setDropCoords(null);
    setFares({});
    setRideStatus('INITIAL');
    setCurrentOtp(null);
    setCurrentRideId(null);
    setSelectedVehicle(null);
    setIsBooking(false);

    navigate('/login');
  };

  // 🌍 Fetch Suggestions
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
    if (type === 'pickup') { setPickup(value); setActiveField('pickup'); }
    else { setDrop(value); setActiveField('drop'); }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => fetchSuggestions(value), 1000);
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

  // 🔥 ACTION: FIND DRIVER & GET FARES
  const handleFindDriver = async () => {
    if (!pickupCoords || !dropCoords) {
      alert("Please select valid locations from the list!");
      return;
    }

    try {
      // 1. API Call to Backend
      const response = await axios.get('http://localhost:8080/api/rides/calculate', {
        params: {
          pLat: pickupCoords.lat,
          pLon: pickupCoords.lon,
          dLat: dropCoords.lat,
          dLon: dropCoords.lon
        },
        headers: {
          Authorization: `Bearer ${token}` // 🔑 Token bhejna zaroori hai
        }
      });

      console.log("Fares received:", response.data);
      setFares(response.data); // State update
      setRideStatus('SELECTING_VEHICLE'); // 🚦 Move to vehicle selection state

    } catch (error) {
      console.error("Error fetching fares:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      alert("Could not calculate fare: " + (error.response?.data?.message || error.response?.data?.error || error.message || "Check Backend!"));
    }
  };

  // 🚗 ACTION: BOOK RIDE
  const handleBookRide = async (vehicleType) => {
    if (!pickupCoords || !dropCoords) {
      alert("Please select valid locations first!");
      return;
    }

    try {
      const payload = {
        pickupLatitude: pickupCoords.lat,
        pickupLongitude: pickupCoords.lon,
        dropLatitude: dropCoords.lat,
        dropLongitude: dropCoords.lon,
        vehicleType: vehicleType
      };

      const response = await axios.post('http://localhost:8080/api/rides/request', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Ride booked successfully:", response.data);
      setCurrentOtp(response.data?.otp || null);
      setCurrentRideId(response.data?.id || null);
      setRideStatus('SEARCHING_FOR_DRIVER'); // 🚦 Move to searching state

    } catch (error) {
      console.error("Error booking ride:", error);
      alert("Could not book ride. " + (error.response?.data?.message || error.response?.data?.error || error.message || "Check Backend!"));
    }
  };

  // ✅ Confirm from summary screen
  const handleConfirmBooking = async () => {
    if (!selectedVehicle || !selectedVehicle.type) return;
    setIsBooking(true);
    try {
      await handleBookRide(selectedVehicle.type);
    } finally {
      setIsBooking(false);
    }
  };

  // ❌ Cancel current ride request (both UI + backend, if rideId present)
  const handleCancelRequest = async () => {
    try {
      if (currentRideId) {
        await axios.post(
          `http://localhost:8080/api/rides/${currentRideId}/cancel`,
          null,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error("Error cancelling ride:", error);
    } finally {
      setRideStatus('INITIAL');
      setCurrentOtp(null);
      setCurrentRideId(null);
      setFares({});
      setSelectedVehicle(null);
      setIsBooking(false);
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden font-sans">

      {/* 🔴 LOGOUT */}
      <button onClick={handleLogout} className="absolute top-4 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg hover:bg-red-50 text-red-600 transition">
        <LogOut size={20} />
      </button>

      {/* 🗺️ MAP */}
      <div className="absolute inset-0 z-0">
        <MapContainer center={[25.5941, 85.1376]} zoom={13} zoomControl={false} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {pickupCoords && <MapRecenter lat={pickupCoords.lat} lng={pickupCoords.lon} />}
          {dropCoords && <MapRecenter lat={dropCoords.lat} lng={dropCoords.lon} />}
          {pickupCoords && <Marker position={[pickupCoords.lat, pickupCoords.lon]} />}
          {dropCoords && <Marker position={[dropCoords.lat, dropCoords.lon]} />}
        </MapContainer>
      </div>

      {/* 🚙 DASHBOARD */}
      <div className="absolute top-0 left-0 h-full w-full md:w-[450px] bg-white z-10 shadow-2xl flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">RideFlow</h1>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-[0.25em]">
                Your everyday super app
              </p>
            </div>
          </div>
        </div>

        {rideStatus === 'INITIAL' && (
          // === SEARCH ===
          <div className="p-6 flex-1 overflow-y-auto bg-gradient-to-b from-white via-white to-gray-50">
            {/* Quick options - Super app feel */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-[0.25em]">
                Quick options
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {/* Ride - Active */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-black text-white py-3 shadow-lg">
                  <Car className="w-5 h-5 mb-1" />
                  <span className="text-xs font-semibold">Ride</span>
                </div>
                {/* Package - Placeholder */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-100 text-gray-400 py-3 border border-dashed border-gray-200 cursor-not-allowed">
                  <Package className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Package</span>
                  <span className="text-[10px] mt-0.5">Coming soon</span>
                </div>
                {/* Rentals - Placeholder */}
                <div className="flex flex-col items-center justify-center rounded-2xl bg-gray-100 text-gray-400 py-3 border border-dashed border-gray-200 cursor-not-allowed">
                  <Bike className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium">Rentals</span>
                  <span className="text-[10px] mt-0.5">Coming soon</span>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-semibold mb-4 text-gray-900">Where can we take you?</h2>

            <div className="space-y-4 relative">
              {/* Inputs Code Same as Before... */}
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
          // === 💰 VEHICLE SELECTION (REAL DATA) ===
          <div className="p-6 flex-1 flex flex-col bg-white">
            <button
              onClick={() => {
                setRideStatus('INITIAL');
                setFares({});
              }}
              className="text-gray-500 hover:text-black mb-4 font-medium text-sm"
            >
              ← Back to Search
            </button>

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Choose a ride</h2>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Distance: {fares.distanceKm} km
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {/* UBER GO / CAR */}
              <div
                onClick={() =>
                  setSelectedVehicle({
                    type: 'CAR',
                    label: 'Uber Go',
                    fare: fares.carFare,
                    eta: '3 mins'
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
                <p className="font-bold text-lg">₹{fares.carFare}</p>
              </div>

              {/* MOTO / BIKE */}
              <div
                onClick={() =>
                  setSelectedVehicle({
                    type: 'BIKE',
                    label: 'Moto',
                    fare: fares.bikeFare,
                    eta: '2 mins'
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
                <p className="font-bold text-lg">₹{fares.bikeFare}</p>
              </div>

              {/* PREMIER */}
              <div
                onClick={() =>
                  setSelectedVehicle({
                    type: 'CAR',
                    label: 'Premier',
                    fare: fares.premierFare,
                    eta: '5 mins'
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
                <p className="font-bold text-lg">₹{fares.premierFare}</p>
              </div>
            </div>

            {/* Book Ride Button removed - clicking cards directly books */}
          </div>
        )}

        {rideStatus === 'CONFIRMING_RIDE' && selectedVehicle && (
          // === 📄 BOOKING SUMMARY / CONFIRMATION ===
          <div className="p-6 flex-1 flex flex-col bg-white">
            <button
              onClick={() => setRideStatus('SELECTING_VEHICLE')}
              className="text-gray-500 hover:text-black mb-4 font-medium text-sm text-left"
            >
              ← Change vehicle
            </button>

            <h2 className="text-2xl font-bold mb-4 text-gray-900">Review your ride</h2>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Trip details
                </p>
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
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedVehicle.label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedVehicle.eta ? `${selectedVehicle.eta} away` : 'Nearby driver'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500">
                    Estimated fare
                  </p>
                  <p className="text-xl font-extrabold text-gray-900">
                    ₹{selectedVehicle.fare ?? '--'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">
                  Payment
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-800">Cash</span>
                  <span className="text-xs text-gray-500">Change later</span>
                </div>
              </div>
            </div>

            <div className="mt-auto space-y-3">
              <button
                onClick={handleConfirmBooking}
                disabled={isBooking}
                className="w-full bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-900 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isBooking ? 'Booking your ride...' : 'Confirm & request driver'}
              </button>
              <button
                onClick={() => setRideStatus('INITIAL')}
                className="w-full bg-white text-gray-900 border border-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {rideStatus === 'SEARCHING_FOR_DRIVER' && (
          // === ⏳ SEARCHING / WAITING FOR DRIVER ===
          <div className="p-6 flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-white via-gray-50 to-gray-100">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full border-4 border-gray-200 border-t-black animate-spin mx-auto mb-6" />
              <p className="text-lg font-semibold text-gray-900">
                Connecting you to nearby drivers...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Hang tight while we find the best driver for you.
              </p>
            </div>

            {currentOtp && (
              <div className="mb-8">
                <p className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-2">
                  Your OTP
                </p>
                <p className="text-4xl font-extrabold tracking-[0.35em] text-gray-900">
                  {currentOtp}
                </p>
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

      </div>
    </div>
  );
};

export default Home;