import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useContext(UserContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkClass = (path) => {
    const baseClass = "nav-link px-3 py-2 rounded-md transition-all duration-300";
    if (isActive(path)) {
      return `${baseClass} bg-white text-red-600 shadow-sm font-semibold`;
    }
    return `${baseClass} text-white border-b-4 border-transparent hover:border-white`;
  };

  return (
    <nav className="bg-red-600 text-white p-4 sticky top-0 z-50 shadow-md">
      <div className="container mx-auto flex flex-wrap justify-between items-center" style={{ color: 'aliceblue' }}>
        <Link to="/" className="text-2xl font-bold">BloodLink</Link>
        
        <div id="navLinks" className="flex items-center space-x-4">
          {user ? (
            <>
              <Link to="/" className={linkClass('/')}>Dashboard</Link>
              
              <Link to="/request-status" className={linkClass('/request-status')}>Request Status</Link>
              
              <Link to="/services" className={linkClass('/services')}>Services</Link>
              
              {(user.type === 'hospital' || user.type === 'bloodbank') && (
                <Link to="/history" className={linkClass('/history')}>History</Link>
              )}
              
              <Link to="/billing" className={linkClass('/billing')}>Billing</Link>
              
              <Link to="/campaign-history" className={linkClass('/campaign-history')}>Campaign History</Link>
              
              {user.type === 'bloodbank' && (
                <Link to="/suggestions" className={`${linkClass('/suggestions')} text-yellow-300 font-bold`}>
                  <i className="bi bi-robot mr-1"></i> AI Suggestions
                </Link>
              )}
              
              {/* Profile Dropdown */}
              <div className="relative">
                <img 
                  id="navProfileImg" 
                  src={user.profileImage ? (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:') ? user.profileImage : `${axios.defaults.baseURL || ''}${user.profileImage}`) : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                  alt="Profile"
                  className="w-8 h-8 rounded-full cursor-pointer border border-white object-cover" 
                  onClick={() => setDropdownOpen(!dropdownOpen)} 
                />
                
                {dropdownOpen && (
                  <div id="profileDropdown" className="absolute right-0 mt-2 w-56 bg-white text-black rounded-lg shadow-lg py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2 border-b border-gray-100 text-sm">
                      <p className="font-semibold text-gray-800">{user.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs font-semibold text-red-600 capitalize mt-1">{user.type}</p>
                    </div>
                    {user.type === 'hospital' && (
                      <Link 
                        to={`/hospital/${user.id || user._id}`} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                    )}
                    {user.type === 'bloodbank' && (
                      <Link 
                        to={`/bloodbank/${user.id || user._id}`} 
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Profile Settings
                      </Link>
                    )}
                    <button 
                      onClick={() => { setDropdownOpen(false); handleLogout(); }} 
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn px-4 py-2 rounded-lg text-white hover:bg-red-700 transition">Login</Link>
              <Link to="/register" className="register-btn bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition shadow-sm font-medium">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
