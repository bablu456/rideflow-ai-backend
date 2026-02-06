import { useState } from 'react';
import { User, Mail, Lock, ArrowRight, Car } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom'; // Navigation ke liye
import axios from 'axios'; // API call ke liye

const Signup = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Backend "USER" role expect karta hai
    const payload = {
      ...formData,
      role: 'USER' 
    };

    try {
      // 🔥 API Call to Register
      const response = await axios.post('http://localhost:8080/api/auth/register', payload);
      
      console.log("Registration Success! Token:", response.data.token);
      
      // ✅ Token Save karo (Auto-Login)
      localStorage.setItem('token', response.data.token);
      
      alert("Account Created Successfully! Welcome to RideFlow 🚖");
      
      // 🚀 Seedha Map wale Home page par bhejo
      navigate('/');
      
    } catch (error) {
      console.error("Signup Failed:", error);
      alert("Registration Failed! Email might be already used.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-black p-8 text-center">
          <div className="flex justify-center mb-2">
            <Car className="text-white w-12 h-12" />
          </div>
          <h2 className="text-3xl font-bold text-white">Join RideFlow</h2>
          <p className="text-gray-400 mt-2">Start your journey with us</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Name Input */}
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

            {/* Email Input */}
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

            {/* Password Input */}
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
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Signup Button */}
            <button
              type="submit"
              className="w-full bg-black hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-all transform hover:scale-[1.02]"
            >
              Create Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </form>

          {/* Footer */}
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