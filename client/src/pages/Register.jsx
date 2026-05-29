import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import TermsModal from '../components/TermsModal';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('hospital');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSCCode, setBankIFSCCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fileList, setFileList] = useState([]);
  
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Validate step 1 fields before transitioning
  const handleNextStep = () => {
    setError('');
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (!address.trim()) {
      setError('Please enter your address.');
      return;
    }
    setStep(2);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFileList(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!termsAccepted) {
      setError('You must agree to the Terms and Conditions.');
      return;
    }

    if (fileList.length === 0) {
      setError('Please upload at least one licensing document.');
      return;
    }

    const formData = new FormData();
    formData.append('type', type);
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('address', address);
    formData.append('licenseNumber', licenseNumber);
    formData.append('bankAccountNumber', bankAccountNumber);
    formData.append('bankIFSCCode', bankIFSCCode);
    
    fileList.forEach((file) => {
      formData.append('licenses', file);
    });

    setLoading(true);
    try {
      const response = await axios.post('/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setLoading(false);
      alert(response.data.message);
      if (response.status === 201) {
        localStorage.setItem('registrationSuccess', 'true');
        navigate('/login');
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
    <div className="container mx-auto p-4 flex justify-center items-center min-h-[90vh] my-6">
      {loading && <Loader message="Processing Registration..." />}
      
      <div 
        id="registerForm" 
        className="max-w-xl w-full bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-gray-100 animate-fadeIn flex flex-col"
      >
        {/* Header Block */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 text-red-600 mb-3 shadow-md shadow-red-100">
            <i className="bi bi-droplet-fill text-2xl animate-pulse"></i>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h2>
          <p className="text-gray-500 text-sm mt-1">Join BloodLink to connect with the life-saving network</p>
        </div>

        {/* Multi-step progress bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs font-semibold text-gray-500 mb-2">
            <span className={step === 1 ? "text-red-600 font-bold" : "text-gray-400"}>1. Account Information</span>
            <span className={step === 2 ? "text-red-600 font-bold" : "text-gray-400"}>2. Verification & Banking</span>
          </div>
          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-red-500 to-rose-600 h-full transition-all duration-300 ease-out"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: Account Information */}
          <div className={step === 1 ? "space-y-4" : "hidden"}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Registration Type</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <i className="bi bi-person-badge"></i>
                </span>
                <select 
                  name="type" 
                  value={type} 
                  onChange={(e) => setType(e.target.value)}
                  required 
                  className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-gray-700"
                  id="registerType"
                >
                  <option value="hospital">Hospital</option>
                  <option value="bloodbank">Blood Bank</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entity Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <i className={type === 'hospital' ? 'bi bi-hospital' : 'bi bi-droplet'}></i>
                </span>
                <input 
                  type="text" 
                  name="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder={type === 'hospital' ? "e.g. City General Hospital" : "e.g. Lifeline Blood Bank"}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <i className="bi bi-envelope"></i>
                </span>
                <input 
                  type="email" 
                  name="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="contact@domain.com"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <i className="bi bi-lock"></i>
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  name="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="•••••••• (Min. 6 characters)"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Physical Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <i className="bi bi-geo-alt"></i>
                </span>
                <input 
                  type="text" 
                  name="address" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required 
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="123 Health Street, City Name"
                />
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="button"
                onClick={handleNextStep}
                className="w-full bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 font-bold transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-200"
              >
                Continue <i className="bi bi-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* STEP 2: Regulatory & Banking Details */}
          <div className={step === 2 ? "space-y-4" : "hidden"}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <i className="bi bi-file-earmark-medical"></i>
                </span>
                <input 
                  type="text" 
                  name="licenseNumber" 
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required 
                  minLength={5} 
                  maxLength={30} 
                  pattern="[A-Za-z0-9/\-]+" 
                  title="Please enter a valid License Number (letters, numbers, /, -)" 
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                  placeholder="MH/BB/1234 or 27C/12345/2021"
                />
              </div>
              <p className="text-[11px] text-gray-500 mt-1 pl-1">Ex: 27C/12345/2021 or MH/BB/1234</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <i className="bi bi-wallet2"></i>
                  </span>
                  <input 
                    type="text" 
                    name="bankAccountNumber" 
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                    required 
                    minLength={9} 
                    maxLength={18} 
                    pattern="[0-9]+" 
                    title="Account number must be 9 to 18 digits" 
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
                    placeholder="1234567890"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank IFSC Code</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                    <i className="bi bi-bank"></i>
                  </span>
                  <input 
                    type="text" 
                    name="bankIFSCCode" 
                    value={bankIFSCCode}
                    onChange={(e) => setBankIFSCCode(e.target.value.toUpperCase())}
                    required 
                    minLength={11} 
                    maxLength={11} 
                    pattern="[A-Za-z]{4}0[A-Za-z0-9]{6}" 
                    title="Must be 11 characters: 4 letters, followed by 0, and 6 alphanumeric characters" 
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all uppercase"
                    placeholder="SBIN0001234"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Upload Licensing Documents (PDF/Images)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-red-400 transition-colors relative bg-gray-50/50">
                <div className="space-y-1 text-center">
                  <i className="bi bi-cloud-arrow-up text-3xl text-gray-400 block mb-1"></i>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-transparent rounded-md font-semibold text-red-600 hover:text-red-700 focus-within:outline-none">
                      <span>Upload files</span>
                      <input 
                        type="file" 
                        name="licenses" 
                        id="licenses" 
                        multiple 
                        required 
                        onChange={handleFileChange}
                        className="sr-only" 
                        accept=".jpg,.jpeg,.png,.pdf"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-400">PDF, PNG, JPG up to 15MB total</p>
                </div>
              </div>

              {/* Uploaded Files Feedback */}
              {fileList.length > 0 && (
                <div className="mt-3 bg-gray-50 p-3 rounded-lg border space-y-1.5 max-h-[120px] overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Selected Files ({fileList.length})</p>
                  {fileList.map((f, i) => (
                    <div key={i} className="text-xs text-gray-700 flex justify-between items-center bg-white p-1.5 rounded border border-gray-100">
                      <span className="truncate pr-4 flex items-center gap-1 font-medium">
                        <i className="bi bi-file-earmark-check text-green-600 text-sm"></i> {f.name}
                      </span>
                      <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mb-2">
              <label className="inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  id="termsCheckbox" 
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                  className="form-checkbox h-4.5 w-4.5 text-red-600 rounded border-gray-300 focus:ring-red-500 transition duration-150"
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setTermsModalOpen(true); }} className="text-red-600 font-semibold underline hover:text-red-700">Terms and Conditions</a>
                </span>
              </label>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="w-1/3 border-2 border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 font-bold transition flex items-center justify-center gap-1"
              >
                <i className="bi bi-arrow-left"></i> Back
              </button>
              
              <button 
                type="submit"
                className="w-2/3 bg-red-600 text-white py-2.5 rounded-xl hover:bg-red-700 font-bold transition duration-200 flex items-center justify-center gap-1 shadow-lg shadow-red-200"
              >
                Register
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-xl">
              <p className="text-red-700 text-xs font-semibold flex items-center gap-1">
                <i className="bi bi-exclamation-triangle-fill text-red-600 text-sm"></i>
                {error}
              </p>
            </div>
          )}
          
          <div className="text-center mt-6 border-t pt-4">
            <span className="text-gray-500 text-sm">Already have an account? </span>
            <Link to="/login" className="text-red-600 hover:text-red-700 hover:underline text-sm font-bold transition">
              Login here
            </Link>
          </div>
        </form>
      </div>

      <TermsModal isOpen={termsModalOpen} onClose={() => setTermsModalOpen(false)} />
    </div>
  );
};

export default Register;
