import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Suggestions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const fetchSuggestion = async () => {
    setLoading(true);
    setData(null);
    try {
      const response = await axios.get('/api/campaign-suggestions');
      setData(response.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Connection error to AI service.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl p-6 animate-fadeIn">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-green-700 flex items-center justify-center gap-2">
          <i className="bi bi-robot"></i> Smart AI Campaign Targeting
        </h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Get intelligent recommendations on where to host your next blood donation camp by analyzing your entire history of past and recent blood requests.
        </p>
      </div>
      
      <div className="mb-6 text-center">
        <button 
          onClick={() => navigate('/')} 
          className="inline-block bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition duration-200 font-semibold"
        >
          ← Go back to Dashboard
        </button>
      </div>
      
      {/* AI Suggestion Container */}
      <div className="bg-white p-8 rounded-2xl shadow-xl mt-8 mx-auto w-full md:w-3/4 border-t-8 border-green-600">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Generate Your AI Campaign Strategy</h2>
        
        <div className="flex justify-center mb-8">
          <button 
            onClick={fetchSuggestion} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-xl shadow-lg font-bold text-xl transition-all transform hover:scale-105 flex items-center gap-3 disabled:opacity-55"
          >
            {loading ? (
              <>
                <i className="bi bi-hourglass-split animate-spin text-2xl"></i>
                Analyzing All Past & Recent Data...
              </>
            ) : (
              <>
                <i className="bi bi-cpu text-2xl"></i>
                {data ? 'Re-Calculate Strategy' : 'Run AI Model'}
              </>
            )}
          </button>
        </div>

        {data && (
          <div id="aiSuggestionResult" className="animate-fadeIn">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-xl font-bold text-green-800 mb-4 border-b border-green-200 pb-2">
                Analysis Complete! <i className="bi bi-check-circle-fill text-green-600"></i>
              </h3>
              
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {/* Location */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <i className="bi bi-geo-alt-fill text-3xl text-red-500 mb-2"></i>
                  <h4 className="text-xs text-gray-500 uppercase font-bold">Recommended Zone</h4>
                  <p className="text-2xl font-bold text-gray-800" id="aiLoc">{data.location || '-'}</p>
                </div>
                
                {/* Blood Group */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <i className="bi bi-droplet-fill text-3xl text-red-500 mb-2"></i>
                  <h4 className="text-xs text-gray-500 uppercase font-bold">High Demand Group</h4>
                  <p className="text-2xl font-bold text-gray-800" id="aiBg">{data.blood_group || '-'}</p>
                </div>
                
                {/* Units */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <i className="bi bi-box-seam-fill text-3xl text-blue-500 mb-2"></i>
                  <h4 className="text-xs text-gray-500 uppercase font-bold">Target Collection</h4>
                  <p className="text-2xl font-bold text-gray-800">
                    <span id="aiUnits">{data.units || '-'}</span> Units
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-green-200 text-sm text-green-700">
                <p>
                  <strong><i class="bi bi-info-circle-fill"></i> Insight:</strong> Your AI model identified this region as having the highest discrepancy between pending orders and available approval trends for this specific blood group. Hosting a campaign here guarantees the most immediate impact saving lives.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Suggestions;
