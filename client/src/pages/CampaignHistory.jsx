import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Loader from '../components/Loader';

const CampaignHistory = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/campaigns');
      setCampaigns(res.data || []);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setMonthFilter('');
    setDateFilter('');
  };

  // Date constants for comparison
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Apply Filtering
  let filtered = [...campaigns];

  // Filter by Live vs Ended
  if (statusFilter === 'live') {
    filtered = filtered.filter(c => {
      const end = new Date(c.endDate || c.date || c.startDate);
      end.setHours(23, 59, 59, 999);
      return end.getTime() >= today.getTime();
    });
  } else if (statusFilter === 'ended') {
    filtered = filtered.filter(c => {
      const end = new Date(c.endDate || c.date || c.startDate);
      end.setHours(23, 59, 59, 999);
      return end.getTime() < today.getTime();
    });
  }

  // Filter by exact Date (covers the campaign span)
  if (dateFilter) {
    const filterTime = new Date(dateFilter);
    filterTime.setHours(0, 0, 0, 0);

    filtered = filtered.filter(c => {
      const start = new Date(c.startDate || c.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(c.endDate || c.date || c.startDate);
      end.setHours(23, 59, 59, 999);

      return filterTime.getTime() >= start.getTime() && filterTime.getTime() <= end.getTime();
    });
  }

  // Filter by Month (covers the campaign span)
  if (monthFilter) {
    const [year, month] = monthFilter.split('-').map(Number); // YYYY-MM -> [2026, 5]
    filtered = filtered.filter(c => {
      const start = new Date(c.startDate || c.date);
      const end = new Date(c.endDate || c.date || c.startDate);

      const startPeriod = start.getFullYear() * 12 + (start.getMonth() + 1);
      const endPeriod = end.getFullYear() * 12 + (end.getMonth() + 1);
      const targetPeriod = year * 12 + month;

      return targetPeriod >= startPeriod && targetPeriod <= endPeriod;
    });
  }

  // 2. Sort Campaigns: Live/Upcoming first (sorted by start date ascending), Ended last (sorted by end date descending)
  const sortedCampaigns = filtered.sort((a, b) => {
    const startA = new Date(a.startDate || a.date);
    const endA = new Date(a.endDate || a.date || a.startDate);
    const startB = new Date(b.startDate || b.date);
    const endB = new Date(b.endDate || b.date || b.startDate);

    endA.setHours(23, 59, 59, 999);
    endB.setHours(23, 59, 59, 999);

    const aIsLive = endA.getTime() >= today.getTime();
    const bIsLive = endB.getTime() >= today.getTime();

    if (aIsLive && !bIsLive) return -1;
    if (!aIsLive && bIsLive) return 1;

    if (aIsLive && bIsLive) {
      return startA - startB; // closest upcoming first
    }
    return endB - endA; // most recently ended first
  });

  const isAnyFilterActive = statusFilter !== 'all' || monthFilter !== '' || dateFilter !== '';

  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-150 min-h-screen p-6 animate-fadeIn">
      {loading && <Loader message="Loading donation campaigns..." />}

      <div className="max-w-5xl mx-auto mt-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b">
          <div>
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <i className="bi bi-calendar-check text-red-600"></i> Donation Campaigns
            </h2>
            <p className="text-gray-500 text-sm mt-1">View list of live, upcoming, and past blood donation drives.</p>
          </div>
          
          {isAnyFilterActive && (
            <button
              onClick={handleClearFilters}
              className="mt-4 md:mt-0 bg-red-100 hover:bg-red-200 text-red-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
            >
              🧹 Clear Filters
            </button>
          )}
        </div>

        {/* Filters Controls Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-gray-50 p-5 rounded-2xl border border-gray-200">
          <div>
            <label className="block text-gray-600 text-xs mb-1 font-semibold uppercase tracking-wider">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm bg-white shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="live">Live / Upcoming Only</option>
              <option value="ended">Ended Only</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-600 text-xs mb-1 font-semibold uppercase tracking-wider">Filter by Month</label>
            <input 
              type="month" 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm bg-white shadow-sm"
            />
          </div>

          <div>
            <label className="block text-gray-600 text-xs mb-1 font-semibold uppercase tracking-wider">Filter by Date</label>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm bg-white shadow-sm"
            />
          </div>
        </div>

        {/* Campaign List Output */}
        <div id="campaignHistoryList" className="space-y-6 max-h-[65vh] overflow-y-auto pr-2">
          {sortedCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <i className="bi bi-calendar-x text-gray-300 text-5xl block mb-3"></i>
              <p className="text-gray-500 italic font-semibold">No campaigns found matching selected filters.</p>
            </div>
          ) : (
            sortedCampaigns.map((c) => {
              // Determine status
              const end = new Date(c.endDate || c.date || c.startDate);
              end.setHours(23, 59, 59, 999);
              const isLive = end.getTime() >= today.getTime();

              const startFmt = new Date(c.startDate || c.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
              const endFmt = new Date(c.endDate || c.date || c.startDate).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

              return (
                <div 
                  key={c._id} 
                  className={`bg-white rounded-2xl p-6 shadow-md border-2 transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${isLive ? 'border-green-200 hover:border-green-400' : 'border-gray-100 hover:border-gray-300'}`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-800">
                        {c.details || "Blood Donation Campaign"}
                      </h3>
                      {isLive ? (
                        <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Live / Upcoming
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                          Ended
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1.5 text-sm text-gray-600 pt-1">
                      <p className="flex items-center gap-2">
                        <i className="bi bi-geo-alt-fill text-red-500"></i>
                        <span><b>Location:</b> {c.location}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <i className="bi bi-person-fill text-blue-500"></i>
                        <span><b>Organizer:</b> {c.organizerName}</span>
                      </p>
                      <p className="flex items-center gap-2 col-span-1 md:col-span-2">
                        <i className="bi bi-calendar-event-fill text-purple-500"></i>
                        <span>
                          <b>Duration:</b> {startFmt} {startFmt !== endFmt && ` to ${endFmt}`}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-right w-full md:w-auto text-sm space-y-1">
                    <p className="text-xs text-gray-400 font-semibold uppercase">Contact Information</p>
                    <p className="font-bold text-gray-800 flex items-center md:justify-end gap-1.5">
                      <i className="bi bi-telephone-fill text-green-600 text-xs"></i>
                      {c.contact}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default CampaignHistory;
