import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-4xl font-bold mb-4 text-blue-700">Welcome to RideFlow 🚖</h1>
      <p className="text-lg text-gray-600 mb-8">Safe and fast rides at your fingertips.</p>
      <div className="space-x-4">
        <Link to="/login" className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800">Login</Link>
        <Link to="/signup" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">Sign Up</Link>
      </div>
    </div>
  );
};

export default Home;