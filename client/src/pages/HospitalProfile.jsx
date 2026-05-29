import React, { useContext, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

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
      console.error("Error fetching hospital profile", err);
      alert("Failed to load hospital profile details.");
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
      alert("Profile updated successfully!");
      setEditMode(false);
      fetchProfileDetails();
      refreshProfile(); // Sync nav header profile
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Error updating profile settings.");
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
      alert("Profile image uploaded successfully!");
      setSelectedFile(null);
      setFileName('');
      fetchProfileDetails();
      refreshProfile(); // Sync nav header
    } catch (err) {
      console.error("Failed to upload image", err);
      alert("Error uploading profile image.");
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
      alert(res.data.message);
      setPreviewUrl('');
      fetchProfileDetails();
      refreshProfile(); // Sync nav header
    } catch (err) {
      console.error("Failed to remove image", err);
      alert("Error removing profile image.");
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
        alert("Your hospital will be deleted after 29 days.");
        logout();
        navigate('/');
      } catch (err) {
        console.error("Failed to request deletion", err);
        alert("Error requesting account deletion.");
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
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen p-6 animate-fadeIn">
      {loading && <Loader message="Updating profile details..." />}

      <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-3xl shadow-2xl border border-gray-200">
        
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-8">
          <button onClick={() => navigate('/')} className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold text-gray-700">
            ← Back
          </button>

          <h2 className="text-2xl font-bold text-red-600 tracking-wide">
            -----------Hospital Profile-----------
          </h2>

          {!editMode ? (
            <button 
              onClick={() => setEditMode(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow font-semibold"
            >
              Edit
            </button>
          ) : (
            <button 
              onClick={() => setEditMode(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition shadow font-semibold"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Profile Image & Upload Section */}
        <div className="flex flex-col items-center mb-8 border-b pb-6">
          <img 
            src={previewUrl || 'https://via.placeholder.com/120'} 
            alt="Profile Avatar"
            className="w-32 h-32 rounded-full border-4 border-red-500 shadow-lg mb-3 object-cover"
          />

          {previewUrl && (
            <button 
              type="button" 
              onClick={handleRemoveImage}
              className="mb-3 bg-red-500 text-white px-4 py-1 rounded-lg hover:bg-red-600 transition text-sm font-semibold"
            >
              🗑 Remove Image
            </button>
          )}

          {/* UPLOAD FORM */}
          <form onSubmit={handleUploadImage} className="flex flex-col items-center gap-2">
            <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition shadow text-sm font-semibold">
              📁 Choose Image
              <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
            </label>

            {fileName && <p className="text-xs text-gray-500 mt-1 font-semibold">Selected: {fileName}</p>}

            {selectedFile && (
              <button 
                type="submit" 
                className="bg-green-600 text-white px-4 py-1 rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow mt-1"
              >
                Upload Image
              </button>
            )}
          </form>
        </div>

        {/* Info Form */}
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Hospital Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!editMode}
              className={`w-full p-3 border rounded-lg outline-none transition ${!editMode ? 'bg-gray-100 text-gray-700' : 'bg-white focus:ring-2 focus:ring-red-400'}`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!editMode}
              className={`w-full p-3 border rounded-lg outline-none transition ${!editMode ? 'bg-gray-100 text-gray-700' : 'bg-white focus:ring-2 focus:ring-red-400'}`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Address</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={!editMode}
              className={`w-full p-3 border rounded-lg outline-none transition ${!editMode ? 'bg-gray-100 text-gray-700' : 'bg-white focus:ring-2 focus:ring-red-400'}`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">License Number</label>
            <input 
              type="text" 
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              disabled={!editMode}
              className={`w-full p-3 border rounded-lg outline-none transition ${!editMode ? 'bg-gray-100 text-gray-700' : 'bg-white focus:ring-2 focus:ring-red-400'}`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Bank Account Number</label>
            <input 
              type="text" 
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              disabled={!editMode}
              className={`w-full p-3 border rounded-lg outline-none transition ${!editMode ? 'bg-gray-100 text-gray-700' : 'bg-white focus:ring-2 focus:ring-red-400'}`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Bank IFSC Code</label>
            <input 
              type="text" 
              value={bankIFSCCode}
              onChange={(e) => setBankIFSCCode(e.target.value)}
              disabled={!editMode}
              className={`w-full p-3 border rounded-lg outline-none transition ${!editMode ? 'bg-gray-100 text-gray-700' : 'bg-white focus:ring-2 focus:ring-red-400'}`}
            />
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Account Status</label>
            <div className={`mt-1 font-bold ${hospital.status === 'Approved' ? 'text-green-600' : (hospital.status === 'Rejected' ? 'text-red-600' : 'text-yellow-600')}`}>
              {hospital.status || 'Verified'}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 font-semibold block mb-1">Uploaded Licenses</label>
            <div className="mt-2 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
              {hospital.licenses && hospital.licenses.length > 0 ? (
                <ul className="space-y-2">
                  {hospital.licenses.map((licenseUrl, idx) => (
                    <li key={idx}>
                      <a href={licenseUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800 flex items-center gap-1">
                        📄 License {idx + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-gray-400">No licenses available</span>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between mt-8 border-t pt-6">
            {editMode ? (
              <button 
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition shadow font-bold"
              >
                💾 Save Changes
              </button>
            ) : (
              <div />
            )}

            <button 
              type="button" 
              onClick={handleDeleteAccount}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition shadow font-bold"
            >
              Delete Account
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default HospitalProfile;
