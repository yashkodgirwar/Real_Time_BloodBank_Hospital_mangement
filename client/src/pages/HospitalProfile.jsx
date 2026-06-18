import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';

const HospitalProfile = () => {
  const { id } = useParams();
  const { logout, refreshProfile } = useContext(UserContext);
  const navigate = useNavigate();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIFSCCode, setBankIFSCCode] = useState('');

  // Image states
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [fileName, setFileName] = useState('');

  const fetchProfileDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/hospital/${id}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = res.data;
      setHospital(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      setLicenseNumber(data.licenseNumber || '');
      setBankAccountNumber(data.bankAccountNumber || '');
      setBankIFSCCode(data.bankIFSCCode || '');
      setPreviewUrl(data.profileImage || '');
    } catch (err) {
      toast.error("Failed to load hospital profile details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
  }, [id]);

  // Handle Details Update
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`/update-hospital/${id}`, {
        name, email, address, licenseNumber, bankAccountNumber, bankIFSCCode
      });
      toast.success("Profile updated successfully!");
      setEditMode(false);
      fetchProfileDetails();
      refreshProfile(); // Sync nav header profile
    } catch (err) {
      toast.error("Error updating profile settings.");
    } finally {
      setLoading(false);
    }
  };

  // Image upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setFileName(file.name);

    // Local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('profileImage', selectedFile);

    setLoading(true);
    try {
      await axios.post(`/upload-profile/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Profile image uploaded successfully!");
      setSelectedFile(null);
      setFileName('');
      fetchProfileDetails();
      refreshProfile(); // Sync nav header
    } catch (err) {
      toast.error("Error uploading profile image.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    const confirmAction = window.confirm("Are you sure you want to remove your profile image?");
    if (!confirmAction) return;

    setLoading(true);
    try {
      const res = await axios.post(`/remove-profile/${id}`);
      toast.success(res.data.message || "Profile image removed successfully!");
      setPreviewUrl('');
      fetchProfileDetails();
      refreshProfile(); // Sync nav header
    } catch (err) {
      toast.error("Error removing profile image.");
    } finally {
      setLoading(false);
    }
  };

  // Account delete
  const handleDeleteAccount = async () => {
    const confirmAction = window.confirm(
      "⚠️ Warning!\n\nAfter 29 days review, all details of your hospital will be deleted permanently.\n\nDo you want to continue?"
    );

    if (confirmAction) {
      setLoading(true);
      try {
        await axios.get(`/delete-hospital/${id}`);
        toast.success("Your hospital will be deleted after 29 days.");
        logout();
        navigate('/');
      } catch (err) {
        toast.error("Error requesting account deletion.");
      } finally {
        setLoading(false);
      }
    }
  };

  if (!hospital) {
    return (
      <div className="text-center py-20 text-gray-500 font-semibold">
        {loading ? <Loader message="Loading Hospital Profile..." /> : "Profile not found."}
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen p-4 md:p-8 animate-fadeIn">
      {loading && <Loader message="Updating profile details..." />}

      <div className="max-w-3xl mx-auto mt-6 bg-white p-6 md:p-8 rounded-3xl shadow-xl border border-gray-200">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition font-bold text-xs"
          >
            <i className="bi bi-arrow-left"></i> Back
          </button>

          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-red-600 text-xl">🩸</span> Hospital Profile
          </h2>

          {!editMode ? (
            <button 
              onClick={() => setEditMode(true)}
              className="bg-red-600 text-white px-4 py-1.5 rounded-xl hover:bg-red-700 transition shadow font-bold text-xs flex items-center gap-1"
            >
              <i className="bi bi-pencil-square"></i> Edit
            </button>
          ) : (
            <button 
              onClick={() => { setEditMode(false); fetchProfileDetails(); }}
              className="bg-gray-650 text-white px-4 py-1.5 rounded-xl hover:bg-gray-700 transition shadow font-bold text-xs flex items-center gap-1"
            >
              <i className="bi bi-x-circle"></i> Cancel
            </button>
          )}
        </div>

        {/* Profile Image & Upload Section */}
        <div className="flex flex-col items-center mb-8 border-b border-gray-200 pb-8">
          <div className="relative group">
            <img 
              src={previewUrl ? (previewUrl.startsWith('http') || previewUrl.startsWith('data:') ? previewUrl : `${axios.defaults.baseURL || ''}${previewUrl}`) : 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
              alt="Profile Avatar"
              className="w-28 h-28 rounded-full border-4 border-red-500/30 shadow-md mb-2 object-cover transition duration-300 group-hover:scale-105"
            />
            
            {previewUrl && (
              <button 
                type="button" 
                onClick={handleRemoveImage}
                title="Remove Image"
                className="absolute top-0 right-0 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow border border-white transition-transform hover:scale-115 flex items-center justify-center"
              >
                <i className="bi bi-trash text-xs"></i>
              </button>
            )}
          </div>

          {/* UPLOAD FORM */}
          <form onSubmit={handleUploadImage} className="flex flex-col items-center gap-2 mt-4">
            <div className="flex items-center gap-2.5">
              <label className="cursor-pointer bg-gray-200 text-gray-800 px-4 py-1.5 rounded-xl hover:bg-gray-300 transition text-xs font-bold border border-gray-300 flex items-center gap-1.5">
                <i className="bi bi-folder-plus text-sm"></i> Choose Image
                <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
              </label>

              {selectedFile && (
                <button 
                  type="submit" 
                  className="bg-green-600 text-white px-4 py-1.5 rounded-xl hover:bg-green-700 transition text-xs font-bold shadow flex items-center gap-1.5 animate-pulse"
                >
                  <i className="bi bi-cloud-arrow-up-fill text-sm"></i> Upload Image
                </button>
              )}
            </div>
            {fileName && <p className="text-[10px] text-gray-500 font-semibold mt-1">Selected: {fileName}</p>}
          </form>
        </div>

        {/* Info Form */}
        <form onSubmit={handleUpdate} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Hospital Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!editMode}
                className={`w-full p-3 border rounded-xl outline-none transition text-sm font-semibold ${!editMode ? 'bg-gray-100/70 text-gray-700 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-350 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'}`}
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!editMode}
                className={`w-full p-3 border rounded-xl outline-none transition text-sm font-semibold ${!editMode ? 'bg-gray-100/70 text-gray-700 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-350 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'}`}
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">License Number</label>
              <input 
                type="text" 
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                disabled={!editMode}
                className={`w-full p-3 border rounded-xl outline-none transition text-sm font-semibold ${!editMode ? 'bg-gray-100/70 text-gray-700 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-350 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'}`}
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Address</label>
              <input 
                type="text" 
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={!editMode}
                className={`w-full p-3 border rounded-xl outline-none transition text-sm font-semibold ${!editMode ? 'bg-gray-100/70 text-gray-700 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-350 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'}`}
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Bank Account Number</label>
              <input 
                type="text" 
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                disabled={!editMode}
                className={`w-full p-3 border rounded-xl outline-none transition text-sm font-semibold ${!editMode ? 'bg-gray-100/70 text-gray-700 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-350 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'}`}
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Bank IFSC Code</label>
              <input 
                type="text" 
                value={bankIFSCCode}
                onChange={(e) => setBankIFSCCode(e.target.value)}
                disabled={!editMode}
                className={`w-full p-3 border rounded-xl outline-none transition text-sm font-semibold ${!editMode ? 'bg-gray-100/70 text-gray-700 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-350 focus:ring-2 focus:ring-red-400/20 focus:border-red-500'}`}
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Account Status</label>
            <div className="flex items-center">
              {hospital.status?.toLowerCase() === 'approved' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Approved
                </span>
              ) : hospital.status?.toLowerCase() === 'rejected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Rejected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Under Review
                </span>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="text-[11px] text-gray-600 font-bold block uppercase tracking-wider mb-1.5">Uploaded Licenses</label>
            <div className="bg-gray-100/50 p-4 rounded-2xl border border-gray-200">
              {hospital.licenses && hospital.licenses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {hospital.licenses.map((licenseUrl, idx) => (
                    <a 
                      key={idx}
                      href={licenseUrl.startsWith('http') || licenseUrl.startsWith('data:') ? licenseUrl : `${axios.defaults.baseURL || ''}${licenseUrl.startsWith('/') ? '' : '/'}${licenseUrl}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-2 p-2.5 bg-white border border-gray-200 rounded-xl hover:border-red-200 hover:shadow-sm transition text-xs font-bold text-gray-700 group"
                    >
                      <i className="bi bi-file-earmark-pdf-fill text-red-500 text-lg"></i>
                      <span className="truncate flex-1">License {idx + 1}</span>
                      <i className="bi bi-box-arrow-up-right text-gray-400 group-hover:text-red-500 transition"></i>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-gray-500 font-semibold">No licenses available</span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            {editMode ? (
              <button 
                type="submit"
                className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 transition shadow font-bold text-xs flex items-center gap-1.5"
              >
                <i className="bi bi-check-lg text-sm"></i> Save Changes
              </button>
            ) : (
              <div />
            )}

            <button 
              type="button" 
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl transition shadow font-bold text-xs flex items-center gap-1.5"
            >
              <i className="bi bi-trash3-fill"></i> Delete Account
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default HospitalProfile;
