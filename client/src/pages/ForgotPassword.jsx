import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/forgot-password', { email });
      setLoading(false);
      if (response.data && response.data.message) {
        setMessage(response.data.message);
      }
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[80vh]">
      {loading && <Loader message="Sending password reset link..." />}
      
      <div id="forgotForm" className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 animate-fadeIn">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Forgot Password</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Enter your Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="your-email@domain.com"
            />
          </div>

          {message && (
            <p className="text-green-600 text-sm font-semibold text-center mt-2">{message}</p>
          )}
          {error && (
            <p className="text-red-600 text-sm font-semibold text-center mt-2">{error}</p>
          )}

          <button 
            type="submit" 
            className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition duration-200 shadow"
          >
            Send Reset Link
          </button>
          
          <p className="mt-4 text-center">
            <Link to="/login" className="text-blue-600 hover:underline text-sm font-medium">
              Back to Login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
