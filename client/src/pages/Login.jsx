import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const Login = () => {
  const { login } = useContext(UserContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('hospital');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/login', { email, password, type });
      if (response.status === 200) {
        // Save current user info to Context
        login(response.data.user);
        
        // Show loaders matching script.js timing
        setTimeout(() => {
          setLoading(false);
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again later.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[80vh]">
      {loading && <Loader message="Logging in to BloodLink..." />}
      
      <div id="loginForm" className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-fadeIn">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Login</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="name@hospital.com"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-1">Type</label>
            <select 
              value={type}
              onChange={(e) => setType(e.target.value)}
              required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            >
              <option value="hospital">Hospital</option>
              <option value="bloodbank">Blood Bank</option>
            </select>
          </div>

          {error && (
            <p className="text-red-600 text-sm font-semibold text-center mt-2">{error}</p>
          )}

          <button 
            type="submit" 
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition duration-200 mt-4 shadow"
          >
            Login
          </button>
          
          <div className="text-center mt-4">
            <Link to="/forgot-password" className="text-red-600 hover:underline text-sm font-medium">
              Forgot Password?
            </Link>
          </div>
          
          <div className="text-center mt-2 border-t pt-4">
            <span className="text-gray-500 text-sm">Don't have an account? </span>
            <Link to="/register" className="text-red-600 hover:underline text-sm font-semibold">
              Register here
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
