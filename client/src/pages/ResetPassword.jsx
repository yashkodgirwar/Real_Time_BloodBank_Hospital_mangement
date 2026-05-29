import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState({ width: '0%', color: '#ef4444', text: 'Weak password' });
  const [showStrength, setShowStrength] = useState(false);
  const [matchError, setMatchError] = useState(false);

  const checkStrength = (value) => {
    let score = 0;
    if (!value) return 0;
    if (value.length > 5) score += 1;
    if (value.length > 8) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  };

  useEffect(() => {
    if (password.length > 0) {
      setShowStrength(true);
      const score = checkStrength(password);
      
      let width = '0%';
      let color = '#ef4444'; 
      let text = 'Weak password';
      
      if (score <= 2) { 
        width = '33%'; 
        color = '#ef4444'; 
        text = 'Weak password';
      } else if (score <= 3) { 
        width = '66%'; 
        color = '#f59e0b'; 
        text = 'Good password';
      } else { 
        width = '100%'; 
        color = '#10b981'; 
        text = 'Strong password';
      }

      setStrength({ width, color, text });
    } else {
      setShowStrength(false);
    }
  }, [password]);

  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setMatchError(true);
    } else {
      setMatchError(false);
    }
  }, [password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMatchError(true);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/reset-password/${token}`, { password });
      alert("Password reset successfully! Please log in with your new password.");
      navigate('/login');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to reset password. Token might be invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-shape-container min-h-[90vh] flex items-center justify-center relative p-6 bg-gray-50 overflow-hidden">
      {loading && <Loader message="Updating your password..." />}

      {/* Shapes copied from original CSS style rules */}
      <div className="absolute rounded-full bg-gradient-to-tr from-red-400 to-red-600 opacity-10 w-[500px] h-[500px] -top-[150px] -left-[150px] animate-pulse"></div>
      <div className="absolute rounded-full bg-gradient-to-br from-red-400 to-red-600 opacity-10 w-[700px] h-[700px] -bottom-[300px] -right-[200px] animate-pulse"></div>

      <div className="bg-white/95 backdrop-blur w-full max-w-[440px] p-10 rounded-3xl shadow-2xl border border-white/40 z-10 animate-fadeIn">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h1 className="text-gray-900 text-2xl font-bold mb-2">Set new password</h1>
          <p className="text-gray-500 text-sm leading-relaxed">Your new password must be different from previously used passwords.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition"
              placeholder="••••••••"
            />
            {showStrength && (
              <>
                <div className="h-[4px] rounded bg-gray-200 mt-2 overflow-hidden">
                  <div className="h-full transition-all duration-300" style={{ width: strength.width, backgroundColor: strength.color }}></div>
                </div>
                <p className="text-xs mt-1 font-semibold" style={{ color: strength.color }}>{strength.text}</p>
              </>
            )}
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-1 text-sm">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50 focus:bg-white transition"
              placeholder="••••••••"
            />
            {matchError && (
              <p className="text-red-500 text-xs font-semibold mt-2">Passwords do not match</p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-xl transition duration-200 shadow-lg"
          >
            Reset Password
          </button>
        </form>

        <div className="text-center mt-8">
          <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }} className="text-red-600 font-medium hover:underline text-sm flex items-center justify-center gap-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back to log in
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
