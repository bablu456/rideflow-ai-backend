import { useMemo, useState } from 'react';
import { User, Mail, Lock, ArrowRight, Car, Bike, BadgeCheck, Phone } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { saveSession } from '../utils/auth';

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const defaultRole = useMemo(() => {
    const fromQuery = (searchParams.get('role') || '').toUpperCase();
    return fromQuery === 'DRIVER' ? 'DRIVER' : 'RIDER';
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: defaultRole,
    licenseNumber: '',
    vehicleType: 'Car',
    vehiclePlateNumber: '',
    currentLatitude: '12.97',
    currentLongitude: '77.59',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDriver = formData.role === 'DRIVER';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSwitch = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      role: formData.role,
      licenseNumber: isDriver ? formData.licenseNumber : null,
      vehicleType: isDriver ? formData.vehicleType : null,
      vehiclePlateNumber: isDriver ? formData.vehiclePlateNumber : null,
      currentLatitude: isDriver ? Number(formData.currentLatitude) : null,
      currentLongitude: isDriver ? Number(formData.currentLongitude) : null,
      available: isDriver ? true : null,
    };

    try {
      const response = await axios.post('http://localhost:8080/api/auth/register', payload);

      saveSession(response.data);
      const role = response.data?.primaryRole || formData.role;
      navigate(role === 'DRIVER' ? '/driver' : '/');
    } catch (error) {
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Registration failed. Email may already be used.';
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-black p-8 text-center">
          <div className="flex justify-center mb-2">
            <Car className="text-white w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-white">Join RideFlow</h2>
          <p className="text-gray-400 mt-2">Create Rider or Driver account</p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch('RIDER')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                !isDriver ? 'bg-white shadow text-black' : 'text-gray-500'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <User className="w-4 h-4" /> Rider
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch('DRIVER')}
              className={`rounded-lg py-2 text-sm font-semibold transition ${
                isDriver ? 'bg-white shadow text-black' : 'text-gray-500'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Bike className="w-4 h-4" /> Driver
              </span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="Bablu Kumar"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="9876543210"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black outline-none transition-all"
                  placeholder="********"
                  required
                />
              </div>
            </div>

            {isDriver && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-semibold flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4" /> Driver details
                </p>

                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={handleChange}
                  placeholder="License Number"
                  className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    name="vehicleType"
                    value={formData.vehicleType}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Auto">Auto</option>
                  </select>
                  <input
                    type="text"
                    name="vehiclePlateNumber"
                    value={formData.vehiclePlateNumber}
                    onChange={handleChange}
                    placeholder="Plate Number"
                    className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-black"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all transform hover:scale-[1.02] disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating account...' : `Create ${isDriver ? 'Driver' : 'Rider'} Account`}
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-black font-bold hover:underline">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
