import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const RequestStatus = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const [hospitalRequests, setHospitalRequests] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [bloodBank, setBloodBank] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchRequestStatus = async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setLoading(true);
    try {
      // We will make a JSON call to get the data
      const res = await axios.get('/request-status', {
        headers: { 'Accept': 'application/json' }
      });
      setHospitalRequests(res.data.hospitalRequests || []);
      setPendingRequests(res.data.pendingRequests || []);
      setBloodBank(res.data.bloodBank || null);
    } catch (err) {
      console.error("Error fetching request status lists", err);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        logout();
        navigate('/login');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequestStatus();
    
    const interval = setInterval(() => {
      fetchRequestStatus(true);
    }, 30000); // Auto refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const handleApprove = async (reqId, reqBloodGroup, reqUnits) => {
    // Inventory check logic matching request-status.ejs
    const inventoryVal = bloodBank && bloodBank.inventory
      ? (bloodBank.inventory[reqBloodGroup] || 0)
      : 0;

    if (inventoryVal < reqUnits) {
      alert(`Not enough blood units available! You have ${inventoryVal} units of ${reqBloodGroup}, but ${reqUnits} are requested.`);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/approve-request/${reqId}`);
      alert("Blood request approved successfully!");
      // Reload lists
      fetchRequestStatus();
    } catch (err) {
      console.error("Approval failed", err);
      alert(err.response?.data?.message || "Failed to approve request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 animate-fadeIn">
      {loading && <Loader message="Updating Request Status..." />}

      {/* Page Title */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-red-600">🩸 Request Status</h1>
        <p className="text-gray-600 mt-2">Monitor blood requests from hospitals and approve pending ones in real-time.</p>
      </div>

      <div className="mb-6 text-center">
        <button 
          onClick={() => navigate('/')} 
          className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-200 font-semibold"
        >
          ← Go to Dashboard (Lists)
        </button>
      </div>

      {/* Grid Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Approved Requests Column */}
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[75vh]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2">🏥 Approved Requests</h2>
          <div className="space-y-4 overflow-y-auto scrollbar-thin flex-1 pr-2">
            {hospitalRequests.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">No approved requests yet.</p>
            ) : (
              hospitalRequests.map((req) => (
                <div key={req._id} className="bg-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-black space-y-1">
                  <p><strong>Hospital:</strong> {req.hospitalName}</p>
                  <p><strong>Patient:</strong> {req.patientName}</p>
                  <p><strong>Blood Group:</strong> {req.bloodGroup}</p>
                  <p><strong>Units:</strong> {req.units}</p>
                  <p>
                    <strong>Status: </strong>
                    <span className="text-green-600 font-semibold">Approved</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Requests Column */}
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col h-[75vh]">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 border-b pb-2 flex items-center gap-2">
            <span className="blinking-dot"></span>
            📥 All Pending Blood Bank Requests
          </h2>
          
          <div className="space-y-4 overflow-y-auto scrollbar-thin flex-1 pr-2">
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500 italic text-center py-8">No pending requests at the moment.</p>
            ) : (
              pendingRequests.map((req) => {
                const inventoryVal = bloodBank && bloodBank.inventory
                  ? (bloodBank.inventory[req.bloodGroup] || 0)
                  : 0;
                const canApprove = inventoryVal >= req.units;

                return (
                  <div key={req._id} className="bg-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-black space-y-2">
                    <div>
                      <p><strong>Hospital:</strong> {req.hospitalName} <span className="blinking-dot"></span></p>
                      <p><strong>Patient:</strong> {req.patientName}</p>
                      <p><strong>Blood Group:</strong> {req.bloodGroup}</p>
                      <p><strong>Units:</strong> {req.units}</p>
                      <p><strong>Status:</strong> <span className="text-yellow-600 font-semibold">Pending</span></p>
                    </div>

                    <p>
                      <strong>Approval Document(s):</strong><br/>
                      {req.documentPath ? (
                        req.documentPath.split(',').map((doc, index) => (
                          <a 
                            key={index} 
                            href={`/uploads/${doc.trim()}`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="text-blue-600 underline hover:text-blue-800 mr-3 text-sm inline-block"
                          >
                            Doc {index + 1}
                          </a>
                        ))
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </p>

                    {user?.type === 'bloodbank' ? (
                      <div className="pt-2 border-t mt-2">
                        {canApprove ? (
                          <button 
                            onClick={() => handleApprove(req._id, req.bloodGroup, req.units)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
                          >
                            ✅ Approve 
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleApprove(req._id, req.bloodGroup, req.units)}
                              className="bg-gray-400 cursor-pointer text-white px-4 py-2 rounded-lg font-semibold transition"
                            >
                              ✅ Approve 
                            </button>
                            <p className="text-xs text-red-500 mt-1 font-semibold">
                              Insufficient Inventory ({inventoryVal} available)
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 text-red-500 font-semibold text-sm">
                        Only bloodbanks can approve requests
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default RequestStatus;
