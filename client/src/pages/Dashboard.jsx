import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  // Lists state
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Order Wizard state
  const [wizardStep, setWizardStep] = useState('default'); // 'default' | 'order-form' | 'available-banks' | 'patient-form'
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('A+');
  const [unitsRequired, setUnitsRequired] = useState(1);
  const [availableBanks, setAvailableBanks] = useState([]);
  
  // Selected Bank for order
  const [targetBank, setTargetBank] = useState(null); // { id, name, address, availableUnits }
  const [isDirectRequest, setIsDirectRequest] = useState(false);

  // Patient Form state
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState('male');
  const [requiredDate, setRequiredDate] = useState('');
  const [approvalDocs, setApprovalDocs] = useState(null);

  // Load initial data
  const loadDashboardData = async (isBackground = false) => {
    if (!user) return;
    if (!isBackground) setLoading(true);
    try {
      const hRes = await axios.get('/hospitals');
      const bRes = await axios.get('/bloodbanks');
      setHospitals(hRes.data);
      setBloodBanks(bRes.data);

      if (user.type === 'bloodbank') {
        const rRes = await axios.get(`/dashboard-requests?email=${encodeURIComponent(user.email)}`);
        setIncomingRequests(rRes.data);
      }
    } catch (err) {
      console.error("Error loading dashboard lists", err);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        logout();
        navigate('/login');
      }
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleApprove = async (reqId, reqBloodGroup, reqUnits) => {
    const ownBloodBank = bloodBanks.find(b => b.email?.toLowerCase() === user?.email?.toLowerCase());
    const availableUnits = ownBloodBank && ownBloodBank.inventory
      ? (ownBloodBank.inventory[reqBloodGroup] || 0)
      : 0;

    if (availableUnits < reqUnits) {
      alert(`Not enough blood units available! You have ${availableUnits} units of ${reqBloodGroup}, but ${reqUnits} are requested.`);
      return;
    }

    setLoading(true);
    try {
      await axios.post(`/approve-request/${reqId}`);
      alert("Blood request approved successfully!");
      loadDashboardData();
    } catch (err) {
      console.error("Approval failed", err);
      alert(err.response?.data?.message || "Failed to approve request.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    const interval = setInterval(() => {
      loadDashboardData(true);
    }, 30000); // Auto refresh every 30 seconds

    // Min Date constraint for patient form input
    const today = new Date().toISOString().split('T')[0];
    setRequiredDate(today);

    return () => clearInterval(interval);
  }, [user]);

  // Handle Blood Availability Check
  const handleCheckAvailability = async (e) => {
    e.preventDefault();
    if (isDirectRequest) {
      setWizardStep('patient-form');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post('/check-availability', {
        bloodGroup: selectedBloodGroup,
        units: parseInt(unitsRequired),
        hospitalEmail: user.email
      });
      setAvailableBanks(res.data);
      if (res.data.length === 0) {
        alert("fail request");
      }
      setWizardStep('available-banks');
    } catch (err) {
      console.error("Availability check failed", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Select Bank and move to patient details
  const selectBank = (bank) => {
    setTargetBank(bank);
    setWizardStep('patient-form');
  };

  // Handle Order Submit
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!approvalDocs || approvalDocs.length === 0) {
      alert("Please upload at least one approval document.");
      return;
    }

    if (isDirectRequest) {
      const availableUnits = targetBank.inventory ? (targetBank.inventory[selectedBloodGroup] || 0) : 0;
      if (availableUnits === 0) {
        alert("Order not placed: Selected blood group has 0 units in this blood bank.");
        return;
      }
      if (parseInt(unitsRequired) > availableUnits) {
        alert("request is not ful fill");
        return;
      }
    }

    const formData = new FormData();
    formData.append('hospitalEmail', user.email);
    formData.append('bankId', targetBank._id);
    formData.append('bloodGroup', selectedBloodGroup);
    formData.append('units', unitsRequired);
    formData.append('patientName', patientName);
    formData.append('amount', unitsRequired * 1000); // ₹1000 per unit (matches script.js billing logic)
    formData.append('isDirect', isDirectRequest);

    for (let i = 0; i < approvalDocs.length; i++) {
      formData.append('approvalDoc', approvalDocs[i]);
    }

    setLoading(true);
    try {
      const res = await axios.post('/order-blood', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert(res.data.message);
      if (res.status === 201) {
        // Reset and go back to dashboard
        setWizardStep('default');
        setIsDirectRequest(false);
        setPatientName('');
        setPatientAge('');
        setPatientGender('male');
        setApprovalDocs(null);
        loadDashboardData();
      }
    } catch (err) {
      console.error("Order submission failed", err);
      alert("Failed to process order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Filter blood banks to show only own card if bloodbank user
  const displayedBloodBanks = user && user.type === 'bloodbank'
    ? bloodBanks.filter(b => b.email?.toLowerCase() === user.email?.toLowerCase())
    : bloodBanks;

  // Filter hospital to show only own profile if hospital user
  const loggedInHospital = user && user.type === 'hospital'
    ? hospitals.find(h => h.email?.toLowerCase() === user.email?.toLowerCase())
    : null;

  return (
    <div className="container mx-auto p-4 animate-fadeIn">
      {loading && <Loader message="Updating Dashboard Data..." />}

      {/* STEP 1: Main Dashboard Overview */}
      {wizardStep === 'default' && (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          
          {/* LEFT COLUMN: Blood Banks List */}
          <div className="bg-white p-6 rounded-lg shadow-md h-[80vh] flex flex-col">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
              <i className="bi bi-droplet text-red-600"></i> Blood Banks
            </h2>
            
            <div id="bloodBanksList" className="space-y-4 overflow-y-auto flex-1 pr-2">
              {displayedBloodBanks.length === 0 ? (
                <p className="text-gray-500 italic">No blood banks registered.</p>
              ) : (
                displayedBloodBanks.map(bank => (
                  <div 
                    key={bank._id} 
                    className="bg-white p-6 rounded-xl shadow-lg border hover:shadow-xl hover:border-blue-400 transition-all duration-300 space-y-4"
                  >
                    <h3 className="text-xl font-bold text-blue-600 border-b pb-2">
                      🩸 {bank.name}
                    </h3>
                    
                    <p className="text-sm text-gray-600">{bank.address}</p>
                    
                    {/* Inventory Grid */}
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {Object.entries(bank.inventory || {}).map(([group, units]) => (
                        <div key={group} className="bg-gray-100 px-2 py-1 rounded flex flex-col items-center">
                          <span className="font-semibold text-gray-700">{group}</span>
                          <span className="font-bold text-blue-600">{units}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2 border-t mt-3">
                      {user.type === 'hospital' && (
                        <>
                          <button 
                            onClick={() => {
                              setTargetBank(bank);
                              setIsDirectRequest(false);
                              setWizardStep('order-form');
                            }}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
                          >
                            Order Blood
                          </button>
                           <button 
                            onClick={() => {
                              alert("Your request not shown in the global request tab");
                              setTargetBank(bank);
                              setIsDirectRequest(true);
                              setWizardStep('order-form');
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold transition"
                          >
                            Direct Request
                          </button>
                        </>
                      )}
                      
                      {user.type === 'bloodbank' && (
                        <>
                          <button 
                            onClick={() => navigate(`/inventory/${bank._id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition flex items-center gap-1"
                          >
                            <i className="bi bi-plus-square-fill"></i> Add Inventory
                          </button>
                          <button 
                            onClick={() => navigate(`/bloodbank/${bank._id}`)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
                          >
                            Profile Settings →
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Incoming Requests (Blood Bank) OR Hospital Profile (Hospital) */}
          <div className="bg-white p-6 rounded-lg shadow-md h-[80vh] flex flex-col">
            {user.type === 'bloodbank' ? (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2 flex items-center gap-2">
                  <span className="blinking-dot"></span> 🔔 Incoming Requests
                </h2>
                
                <div id="rightSideRequests" className="space-y-4 overflow-y-auto flex-1 pr-2">
                  {incomingRequests.length === 0 ? (
                    <p className="text-gray-500 italic">No incoming pending requests.</p>
                  ) : (
                    incomingRequests.map(req => {
                      const ownBloodBank = bloodBanks.find(b => b.email?.toLowerCase() === user?.email?.toLowerCase());
                      const availableUnits = ownBloodBank && ownBloodBank.inventory
                        ? (ownBloodBank.inventory[req.bloodGroup] || 0)
                        : 0;
                      const canApprove = availableUnits >= req.units;

                      const isDirect = req.isDirect;

                      return (
                        <div 
                          key={req._id} 
                          className={`p-4 rounded-xl shadow mb-3 space-y-2 border-2 transition-all duration-200 ${
                            isDirect 
                              ? 'bg-green-50/80 border-green-200 hover:border-green-400 shadow-green-50' 
                              : 'bg-white border-gray-100 hover:border-blue-400'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p><b>Hospital:</b> {req.hospitalName}</p>
                            {isDirect && (
                              <span className="bg-green-600 text-white text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full shadow-sm">
                                Direct Request
                              </span>
                            )}
                          </div>
                          <p><b>Patient:</b> {req.patientName}</p>
                          <p><b>Blood:</b> {req.bloodGroup}</p>
                          <p><b>Units:</b> {req.units}</p>
                          
                          <div>
                            <b>Approval Document(s):</b><br/>
                            {req.documentPath ? (
                              req.documentPath.split(',').map((doc, idx) => (
                                <a 
                                  key={idx} 
                                  href={`${axios.defaults.baseURL || ''}/uploads/${doc.trim()}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-blue-600 underline hover:text-blue-800 mr-3 text-sm inline-block"
                                >
                                  Doc {idx + 1}
                                </a>
                              ))
                            ) : (
                              <span className="text-gray-400">None</span>
                            )}
                          </div>

                          <p className={isDirect ? "text-green-700 font-bold" : "text-yellow-600 font-semibold"}>Status: Pending {isDirect && '(Direct)'}</p>

                          <div className="pt-2 border-t mt-2">
                            {canApprove ? (
                              <button 
                                onClick={() => handleApprove(req._id, req.bloodGroup, req.units)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition"
                              >
                                ✅ Approve
                              </button>
                            ) : (
                              <>
                                <button 
                                  disabled
                                  className="bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold text-sm cursor-not-allowed"
                                >
                                  ✅ Approve
                                </button>
                                <p className="text-xs text-red-500 mt-1 font-semibold">
                                  Insufficient Inventory ({availableUnits} available)
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">
                  🏥 Your Profile
                </h2>
                
                <div id="hospitalsList" className="space-y-4 overflow-y-auto flex-1 pr-2">
                  {loggedInHospital && (
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 hover:shadow-xl hover:border-red-400 transition-all duration-300 space-y-4">
                      <h3 className="font-bold text-2xl text-red-600 border-b pb-2">
                        🏥 Hospital Name: {loggedInHospital.name}
                      </h3>
                      
                      <div className="space-y-2 text-gray-700 text-sm">
                        <p className="flex gap-2">
                          <span className="font-semibold">Email:</span> 
                          <span>{loggedInHospital.email}</span>
                        </p>
                        <p className="flex gap-2">
                          <span className="font-semibold">Address:</span> 
                          <span>{loggedInHospital.address}</span>
                        </p>
                        <p className="flex gap-2">
                          <span className="font-semibold">License No:</span> 
                          <span className="text-green-600 font-medium">
                            {loggedInHospital.licenseNumber || "Not Available"}
                          </span>
                        </p>
                      </div>

                      <div className="flex justify-between items-center border-t pt-4">
                        <p className="text-xs text-gray-500 italic">Logged in Hospital</p>
                        <button 
                          onClick={() => navigate(`/hospital/${loggedInHospital._id}`)}
                          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition font-semibold"
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* STEP 2: Blood Order Form */}
      {wizardStep === 'order-form' && (
        <div id="bloodOrderForm" className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Order Blood</h2>
          <form onSubmit={handleCheckAvailability}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Blood Group</label>
              <select 
                value={selectedBloodGroup}
                onChange={(e) => setSelectedBloodGroup(e.target.value)}
                required 
                className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Units Required</label>
              <input 
                type="number" 
                value={unitsRequired}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setUnitsRequired(isNaN(val) || val < 1 ? '' : val);
                }}
                required 
                min="1"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 mb-2 font-semibold transition"
            >
              Check Availability
            </button>
            
            <button 
              type="button" 
              onClick={() => {
                setWizardStep('default');
                setIsDirectRequest(false);
              }} 
              className="w-full border border-red-600 text-red-600 py-2 rounded hover:bg-red-50 font-semibold transition"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: Available Blood Banks List */}
      {wizardStep === 'available-banks' && (
        <div id="availableBloodBanks" className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10 relative animate-fadeIn">
          <div className="pb-4 mb-4 border-b">
            <button 
              type="button" 
              onClick={() => setWizardStep('order-form')} 
              className="mb-4 w-full border border-red-600 text-red-600 py-2 rounded hover:bg-red-50 flex items-center justify-center gap-2 font-semibold transition"
            >
              <i className="bi bi-arrow-left"></i> Back to Order Form
            </button>
            <h2 className="text-2xl font-bold text-gray-800">Available Blood Banks</h2>
          </div>
          
          <div id="availableBloodBanksList" className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {availableBanks.length === 0 ? (
              <p className="text-red-600 font-semibold text-center py-4">No blood banks have enough units of {selectedBloodGroup}.</p>
            ) : (
              availableBanks.map((bank, index) => (
                <div key={bank._id} className="border p-4 rounded-xl bg-gray-50 shadow-sm space-y-2 hover:border-red-400 transition-all">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    {index === 0 && <span className="blinking-dot"></span>}
                    {bank.name}
                  </h3>
                  <p className="text-sm text-gray-600">Address: {bank.address}</p>
                  <div className="flex justify-between items-center text-sm text-gray-700">
                    <span>Available {selectedBloodGroup}: <span className="font-bold text-blue-600">{bank.inventory[selectedBloodGroup]}</span></span>
                    {bank.distance !== undefined && (
                      <span className="text-xs text-gray-400 font-medium">{bank.distance.toFixed(1)} km away</span>
                    )}
                  </div>
                  <button 
                    onClick={() => selectBank(bank)} 
                    className="w-full mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold transition"
                  >
                    Select Bank
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STEP 4: Patient Details & Document Upload */}
      {wizardStep === 'patient-form' && (
        <div id="patientDetailsForm" className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-10 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Patient Details & Request Submission</h2>
          <div className="bg-red-50 p-3 rounded mb-4 text-sm text-red-700 border-l-4 border-red-500">
            Ordering <b>{unitsRequired}</b> units of <b>{selectedBloodGroup}</b> from <b>{targetBank?.name}</b>.
          </div>
          
          <form onSubmit={handleOrderSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Patient Name</label>
              <input 
                type="text" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                required 
                pattern="[A-Za-z\s]+" 
                title="Only alphabets and spaces are allowed" 
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. John Doe"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Age</label>
              <input 
                type="number" 
                value={patientAge}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (isNaN(val) || val < 1) setPatientAge('');
                  else if (val > 120) setPatientAge(120);
                  else setPatientAge(val);
                }}
                required 
                min="1" 
                max="120"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. 45"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Gender</label>
              <select 
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                required 
                className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Required Date</label>
              <input 
                type="date" 
                value={requiredDate}
                onChange={(e) => setRequiredDate(e.target.value)}
                required 
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 font-medium">Upload Approval Document(s)</label>
              <input 
                type="file" 
                name="approvalDoc" 
                id="approvalDoc" 
                multiple 
                required 
                onChange={(e) => setApprovalDocs(e.target.files)}
                className="w-full p-2 border rounded focus:outline-none"
                accept=".jpg,.jpeg,.png,.pdf"
              />
            </div>

            <button 
              type="submit" 
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold transition"
            >
              Submit Request
            </button>
            
            <button 
              type="button" 
              onClick={() => {
                if (isDirectRequest) {
                  setWizardStep('order-form');
                } else {
                  setWizardStep('available-banks');
                }
              }} 
              className="w-full border border-red-600 text-red-600 py-2 rounded hover:bg-red-50 font-semibold transition"
            >
              Back
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
