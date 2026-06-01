import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const History = () => {
  const { user, logout } = useContext(UserContext);
  const navigate = useNavigate();

  const [orderHistory, setOrderHistory] = useState([]);
  const [campaignHistory, setCampaignHistory] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [uniqueBanks, setUniqueBanks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters State
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [bankFilter, setBankFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Get orders history
      const ordersRes = await axios.get('/history');
      const orderData = ordersRes.data || [];
      setOrderHistory(orderData);
      setFilteredOrders(orderData);

      // Populate unique blood banks list for dropdown filter
      const banks = [...new Set(orderData.map(o => o.bankName).filter(name => name && name !== 'N/A' && name !== 'Unknown'))];
      setUniqueBanks(banks);

      // Get campaigns list
      const campaignRes = await axios.get('/campaigns');
      setCampaignHistory(campaignRes.data || []);
    } catch (err) {
      console.error("Failed to load history data", err);
      if (err.response && err.response.status === 401) {
        alert("Session expired. Please log in again.");
        logout();
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  // Apply filters on orders
  useEffect(() => {
    let filtered = [...orderHistory];

    if (monthFilter) {
      filtered = filtered.filter(o => {
        const d = new Date(o.date);
        const mStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
        return mStr === monthFilter;
      });
    }

    if (dateFilter) {
      filtered = filtered.filter(o => {
        const d = new Date(o.date);
        const dStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        return dStr === dateFilter;
      });
    }

    if (bankFilter) {
      filtered = filtered.filter(o => o.bankName === bankFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter(o => o.status === statusFilter);
    }

    if (paymentFilter) {
      filtered = filtered.filter(o => (o.paymentStatus || 'Unpaid') === paymentFilter);
    }

    setFilteredOrders(filtered);
  }, [monthFilter, dateFilter, bankFilter, statusFilter, paymentFilter, orderHistory]);

  return (
    <div className="container mx-auto p-6 animate-fadeIn">
      {loading && <Loader message="Fetching historical records..." />}

      <div id="history" className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 border-b pb-2 text-gray-800">Order History</h2>

        {/* Filters for Order History */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-gray-700 text-xs mb-1 font-semibold">Filter by Month</label>
            <input 
              type="month" 
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs mb-1 font-semibold">Filter by Date</label>
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-gray-700 text-xs mb-1 font-semibold">Filter by Blood Bank</label>
            <select 
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
            >
              <option value="">All Blood Banks</option>
              {uniqueBanks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs mb-1 font-semibold">Order Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 text-xs mb-1 font-semibold">Payment Status</label>
            <select 
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
            >
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        {/* Orders List */}
        <div id="orderHistory" className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {filteredOrders.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">No order history found matching filters.</p>
          ) : (
            filteredOrders.map((entry) => {
              const fileLinks = entry.documentPath
                ? entry.documentPath.split(',').map((f, idx) => (
                    <a 
                      key={idx}
                      href={`${axios.defaults.baseURL || ''}/uploads/${f.trim().split('/').pop()}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-blue-600 underline text-sm mr-3 inline-block"
                    >
                      View Doc {idx + 1}
                    </a>
                  ))
                : <span className="text-gray-400 text-sm">No Document</span>;

              return (
                <div 
                  key={entry._id} 
                  className="bg-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-black space-y-1"
                >
                  <p><strong>Type:</strong> Blood Order</p>
                  <p><strong>Date:</strong> {new Date(entry.date).toLocaleString()}</p>
                  <p><strong>Patient:</strong> {entry.patientName}</p>
                  <p><strong>Blood Group:</strong> {entry.bloodGroup}</p>
                  <p><strong>Units:</strong> {entry.units}</p>
                  <p><strong>Amount:</strong> ₹{entry.amount}</p>
                  <p>
                    <strong>Order Status: </strong>
                    {entry.status === 'Approved' ? (
                      <span className="text-green-600 font-bold">Approved by {entry.bankName || 'Unknown Blood Bank'}</span>
                    ) : (
                      <span className="text-yellow-600 font-bold">{entry.status}</span>
                    )}
                  </p>
                  <p>
                    <strong>Payment Status: </strong>
                    <span className={`font-bold ${entry.paymentStatus === 'Paid' ? 'text-green-600' : 'text-red-500'}`}>
                      {entry.paymentStatus || 'Unpaid'}
                    </span>
                  </p>
                  <div className="pt-1 border-t mt-1">
                    {fileLinks}
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

export default History;
