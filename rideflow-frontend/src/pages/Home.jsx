import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, LogOut, Bike, Clock } from 'lucide-react';
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);
  
  // 📍 Coordinates
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropCoords, setDropCoords] = useState(null);
  
  // 💰 FARES STATE (Backend se aayega)
  const [fares, setFares] = useState({});
  const [showVehicles, setShowVehicles] = useState(false);

  const typingTimeoutRef = useRef(null);

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
    if(!pickupCoords || !dropCoords) {
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
      setShowVehicles(true); // Panel show karo

    } catch (error) {
      console.error("Error fetching fares:", error);
      alert("Could not calculate fare. Check Backend!");
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
          <h1 className="text-3xl font-bold text-gray-800">RideFlow</h1>
        </div>

        {!showVehicles ? (
          // === SEARCH ===
          <div className="p-6 flex-1 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Where can we take you?</h2>
            
            <div className="space-y-4 relative">
              {/* Inputs Code Same as Before... */}
               <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400"><div className="w-2 h-2 bg-black rounded-full"></div></div>
                <input type="text" placeholder="Add a pickup location" className="w-full bg-gray-100 p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  value={pickup} onChange={(e) => handleInputChange(e, 'pickup')} />
              </div>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400"><div className="w-2 h-2 bg-black rounded-sm"></div></div>
                <input type="text" placeholder="Enter your destination" className="w-full bg-gray-100 p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  value={drop} onChange={(e) => handleInputChange(e, 'drop')} />
              </div>

              {suggestions.length > 0 && (
                <div className="absolute w-full bg-white shadow-xl rounded-lg mt-1 z-50 max-h-60 overflow-y-auto border border-gray-100">
                  {suggestions.map((item, idx) => (
                    <div key={idx} className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b"
                         onClick={() => handleSelectSuggestion(item)}>
                      <div className="bg-gray-200 p-2 rounded-full"><MapPin size={16}/></div>
                      <p className="text-sm text-gray-700 truncate">{item.display_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={handleFindDriver} className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg mt-8 hover:bg-gray-800 transition shadow-lg">
              Search Rides
            </button>
          </div>

        ) : (
          // === 💰 VEHICLE SELECTION (REAL DATA) ===
          <div className="p-6 flex-1 flex flex-col">
            <button onClick={() => setShowVehicles(false)} className="text-gray-500 hover:text-black mb-4 font-medium text-sm">
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
              <div className="flex items-center justify-between p-4 border-2 border-black rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100">
                <div className="flex items-center gap-4">
                  <img src="https://links.papareact.com/3pn" alt="Car" className="w-16 h-10 object-contain" /> 
                  <div>
                    <h3 className="font-bold text-lg">Uber Go</h3>
                    <p className="text-gray-500 text-sm flex items-center gap-1"><Clock size={12}/> 3 mins away</p>
                  </div>
                </div>
                <p className="font-bold text-lg">₹{fares.carFare}</p> {/* 🔥 REAL PRICE */}
              </div>

              {/* MOTO / BIKE */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-16 flex justify-center"><Bike className="w-10 h-10 text-gray-700"/></div>
                  <div>
                    <h3 className="font-bold text-lg">Moto</h3>
                    <p className="text-gray-500 text-sm">Affordable</p>
                  </div>
                </div>
                <p className="font-bold text-lg">₹{fares.bikeFare}</p> {/* 🔥 REAL PRICE */}
              </div>

              {/* PREMIER */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer">
                <div className="flex items-center gap-4">
                   <img src="https://links.papareact.com/5w8" alt="Lux" className="w-16 h-10 object-contain" />
                  <div>
                    <h3 className="font-bold text-lg">Premier</h3>
                    <p className="text-gray-500 text-sm">Luxury rides</p>
                  </div>
                </div>
                <p className="font-bold text-lg">₹{fares.premierFare}</p> {/* 🔥 REAL PRICE */}
              </div>

            </div>

            <button className="w-full bg-black text-white py-4 rounded-lg font-bold text-lg mt-4 hover:bg-gray-800 transition shadow-lg">
              Book Ride
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Home;