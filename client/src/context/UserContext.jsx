import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/profile');
      if (response.data) {
        setUser(response.data);
        localStorage.setItem("userId", response.data._id || response.data.id || '');
        localStorage.setItem("userEmail", response.data.email);
        localStorage.setItem("userName", response.data.name);
        localStorage.setItem("userType", response.data.type);
        if (response.data.profileImage) {
          localStorage.setItem("profileImage", response.data.profileImage);
        } else {
          localStorage.removeItem("profileImage");
        }
      }
    } catch (error) {
      // Fallback to localStorage if server session is not set
      const id = localStorage.getItem("userId");
      const email = localStorage.getItem("userEmail");
      const name = localStorage.getItem("userName");
      const type = localStorage.getItem("userType");
      const profileImage = localStorage.getItem("profileImage");
      
      if (email && name && type) {
        setUser({ _id: id, id, email, name, type, profileImage });
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("userId", userData._id || userData.id || '');
    localStorage.setItem("userEmail", userData.email);
    localStorage.setItem("userName", userData.name);
    localStorage.setItem("userType", userData.type);
    if (userData.profileImage) {
      localStorage.setItem("profileImage", userData.profileImage);
    } else {
      localStorage.removeItem("profileImage");
    }
  };

  const logout = async () => {
    try {
      await axios.get('/logout');
    } catch (err) {
      console.error("Logout error", err);
    }
    setUser(null);
    localStorage.clear();
    sessionStorage.clear();
  };

  return (
    <UserContext.Provider value={{ user, setUser, loading, login, logout, refreshProfile: fetchProfile }}>
      {children}
    </UserContext.Provider>
  );
};
