import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const Services = () => {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [serviceView, setServiceView] = useState('menu'); // 'menu' | 'certificate' | 'campaign'
  const [bloodBanks, setBloodBanks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Certificate State
  const [selectedBankName, setSelectedBankName] = useState('');
  const [certificateName, setCertificateName] = useState('');

  // Campaign State
  const [campaignName, setCampaignName] = useState('');
  const [campaignStartDate, setCampaignStartDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignLocation, setCampaignLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');

  // Load blood banks for dropdown
  const loadBloodBanks = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/bloodbanks');
      setBloodBanks(res.data || []);
      if (res.data.length > 0) {
        setSelectedBankName(res.data[0].name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (serviceView === 'certificate') {
      loadBloodBanks();
    }
    
    // Prevent past date selections in campaigns
    if (serviceView === 'campaign') {
      const today = new Date().toISOString().split('T')[0];
      setCampaignStartDate(today);
      setCampaignEndDate(today);
    }
  }, [serviceView]);

  // Handle Campaign Submit
  const handleCampaignSubmit = async (e) => {
    e.preventDefault();

    // Regex check contact: phone (10-15 digits) or email
    const phoneRegex = /^\+?[0-9\s\-()]{10,15}$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!phoneRegex.test(contactPerson) && !emailRegex.test(contactPerson)) {
      alert("Invalid Contact Details! Please enter a valid phone number (10-15 digits) or email address.");
      return;
    }

    // Regex check location: 5-100 characters standard symbols
    const locationRegex = /^[a-zA-Z0-9\s.,'()\-]{5,100}$/;
    if (!locationRegex.test(campaignLocation)) {
      alert("Invalid Location! Location must be between 5 to 100 characters and contain standard characters.");
      return;
    }

    // Details check
    if (campaignName.trim().length < 5) {
      alert("Invalid Description! Description must be at least 5 characters long.");
      return;
    }

    // Date range validation
    const start = new Date(campaignStartDate);
    const end = new Date(campaignEndDate);
    if (end < start) {
      alert("End date must be greater than or equal to start date!");
      return;
    }

    setLoading(true);

    const campaignData = {
      organizerName: user?.name || "Anonymous",
      location: campaignLocation,
      startDate: campaignStartDate,
      endDate: campaignEndDate,
      contact: contactPerson,
      details: campaignName
    };

    try {
      const response = await axios.post('/create-campaign', campaignData);
      alert(response.data.message || "Campaign arranged successfully!");
      // Reset form
      setCampaignName('');
      setCampaignLocation('');
      setContactPerson('');
      setCampaignStartDate('');
      setCampaignEndDate('');
      setServiceView('menu');
    } catch (err) {
      console.error(err);
      alert("Failed to submit campaign arrangement.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Certificate PDF Download
  const handleCertificateDownload = (e) => {
    e.preventDefault();
    if (!selectedBankName || !certificateName.trim()) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      const { jsPDF } = window.jspdf;
      // Create A3 Landscape
      const doc = new jsPDF('landscape', 'pt', 'a3');

      // Light orange background
      doc.setFillColor(255, 223, 186); 
      doc.rect(0, 0, doc.internal.pageSize.width, doc.internal.pageSize.height, 'F');

      // Border
      doc.setLineWidth(5);
      doc.setDrawColor(255, 165, 0); 
      doc.rect(10, 10, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 20);

      let y = 100;

      // Title
      doc.setFontSize(30);
      doc.setTextColor(0, 102, 204); 
      doc.text("Certificate of Blood Donation", doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 80;

      // Recipient name
      doc.setFontSize(22);
      doc.setTextColor(0, 0, 0); 
      doc.text(`This certifies that`, doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 50;

      doc.setFontSize(26);
      doc.setTextColor(220, 38, 38); // Red for donor name
      doc.text(`${certificateName}`, doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 60;

      // Additional text
      doc.setFontSize(16);
      doc.setTextColor(0, 51, 102); 
      doc.text(`has successfully donated blood at ${selectedBankName}.`, doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 50;
      doc.text("Your generous act of donating blood helps save lives and supports those in need.", doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 50;
      doc.text("Thank you for your selfless contribution to the community and for making a difference.", doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 50;
      doc.text("Every drop counts, and your donation can help save up to three lives!", doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 50;
      doc.text("We appreciate your commitment to helping others and encourage you to continue this noble act.", doc.internal.pageSize.width / 2, y, { align: "center" });

      y += 50;
      const todayString = new Date().toLocaleDateString();
      doc.text(`Date: ${todayString}`, doc.internal.pageSize.width / 2, y, { align: "center" });

      // Save file
      doc.save(`${certificateName.replace(/\s+/g, '_')}_Blood_Donation_Certificate.pdf`);
    } catch (err) {
      console.error("PDF generation failed", err);
      alert("Failed to download certificate. Check browser console.");
    }
  };

  return (
    <div className="container mx-auto p-4 animate-fadeIn">
      {loading && <Loader message="Accessing Services..." />}

      {/* VIEW 1: Service Choices */}
      {serviceView === 'menu' && (
        <div id="services" className="mt-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">Available BloodLink Services</h2>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            
            {/* Certificate download */}
            <div className="bg-white p-6 rounded-2xl shadow-md border hover:shadow-lg transition flex flex-col items-center justify-between text-center space-y-4">
              <i className="bi bi-award text-red-600 text-5xl"></i>
              <div>
                <h3 className="text-xl font-bold mb-2">Download Certificates</h3>
                <p className="text-sm text-gray-600">Enter your donation details and download your custom official digital certificate instantly.</p>
              </div>
              <button 
                onClick={() => setServiceView('certificate')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
              >
                Get Certificate
              </button>
            </div>
            
            {/* Arrange Campaign */}
            <div className="bg-white p-6 rounded-2xl shadow-md border hover:shadow-lg transition flex flex-col items-center justify-between text-center space-y-4">
              <i className="bi bi-calendar-event text-blue-600 text-5xl"></i>
              <div>
                <h3 className="text-xl font-bold mb-2">Blood Campaign</h3>
                <p className="text-sm text-gray-600">Register new blood donation drives and coordinate nearby volunteer resources.</p>
              </div>
              <button 
                onClick={() => setServiceView('campaign')}
                className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 font-semibold transition"
              >
                Arrange Campaign
              </button>
            </div>

          </div>
        </div>
      )}

      {/* VIEW 2: Certificate Download Form */}
      {serviceView === 'certificate' && (
        <div id="certificateDownloadForm" className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-8 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Download Certificate</h2>
          <form onSubmit={handleCertificateDownload}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Select Blood Bank</label>
              <select 
                value={selectedBankName}
                onChange={(e) => setSelectedBankName(e.target.value)}
                required 
                className="w-full p-2 border rounded bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                {bloodBanks.map(bank => (
                  <option key={bank._id} value={bank.name}>{bank.name}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2 font-medium">Your Name</label>
              <input 
                type="text" 
                value={certificateName}
                onChange={(e) => setCertificateName(e.target.value.replace(/[^A-Za-z\s]/g, ''))}
                required 
                pattern="[A-Za-z\s]+"
                title="Only alphabets and spaces are allowed" 
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Candidate Name"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold transition"
            >
              Download Certificate
            </button>
            
            <button 
              type="button" 
              onClick={() => setServiceView('menu')}
              className="mt-3 w-full border border-red-600 text-red-600 py-2 rounded hover:bg-red-50 font-semibold transition"
            >
              Back
            </button>
          </form>
        </div>
      )}

      {/* VIEW 3: Campaign Form */}
      {serviceView === 'campaign' && (
        <div id="campaignForm" className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md mt-8 animate-fadeIn">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center text-red-600 border-b pb-2">Arrange Blood Campaign</h2>
          <form onSubmit={handleCampaignSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1 text-xs font-semibold uppercase tracking-wider">Campaign Description / Name (Min 5 chars)</label>
              <input 
                type="text" 
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                required 
                minLength={5}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. Life Saver Drive 2026"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1 text-xs font-semibold uppercase tracking-wider">Start Date</label>
                <input 
                  type="date" 
                  value={campaignStartDate}
                  onChange={(e) => setCampaignStartDate(e.target.value)}
                  required 
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-xs font-semibold uppercase tracking-wider">End Date</label>
                <input 
                  type="date" 
                  value={campaignEndDate}
                  onChange={(e) => setCampaignEndDate(e.target.value)}
                  required 
                  min={campaignStartDate || new Date().toISOString().split('T')[0]}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-xs font-semibold uppercase tracking-wider">Location (5-100 chars)</label>
              <input 
                type="text" 
                value={campaignLocation}
                onChange={(e) => setCampaignLocation(e.target.value)}
                required 
                pattern="^[a-zA-Z0-9\s.,'()\-]{5,100}$"
                title="Must be between 5 to 100 characters and contain standard characters (alphanumeric, space, basic punctuation)."
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. Community Center Hall"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 mb-1 text-xs font-semibold uppercase tracking-wider">Contact Person Details (Phone or Email)</label>
              <input 
                type="text" 
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required 
                pattern="^\+?[0-9\s\-()]{10,15}$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                title="Must be a valid 10-15 digit phone number or email address."
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. +91 9876543210 or email@domain.com"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 font-bold transition-all shadow-md hover:shadow-lg"
            >
              Submit Campaign
            </button>
            
            <button 
              type="button" 
              onClick={() => setServiceView('menu')}
              className="mt-3 w-full border border-red-600 text-red-600 py-2 rounded hover:bg-red-50 font-semibold transition"
            >
              Back
            </button>
          </form>
        </div>
      )}

    </div>
  );
};

export default Services;
