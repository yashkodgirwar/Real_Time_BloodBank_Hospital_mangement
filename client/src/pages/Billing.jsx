import React, { useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const Billing = () => {
  const { user } = useContext(UserContext);

  const [loading, setLoading] = useState(false);
  const [billingData, setBillingData] = useState([]);
  const [filterList, setFilterList] = useState([]); // bloodbanks for hospital, hospitals for bloodbank
  const [grossTotal, setGrossTotal] = useState(0);

  // Filter values
  const [selectedEntity, setSelectedEntity] = useState(''); // bankId or hospitalEmail
  const [monthFilter, setMonthFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('Unpaid');

  // Open breakthroughs state (by entity ID)
  const [openBreakthroughs, setOpenBreakthroughs] = useState({});

  const toggleBreakthrough = (id) => {
    setOpenBreakthroughs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Load filtering list (hospitals or bloodbanks)
  const loadFilterEntities = async () => {
    try {
      if (user.type === 'hospital') {
        const res = await axios.get('/bloodbanks');
        setFilterList(res.data || []);
      } else {
        const res = await axios.get('/hospitals');
        setFilterList(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load filter items", err);
    }
  };

  // Fetch billing stats
  const fetchBillingData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let url = '';
      let params = {};

      if (user.type === 'hospital') {
        url = '/hospital-billing';
        params = {
          bankId: selectedEntity,
          month: monthFilter,
          date: dateFilter,
          paymentStatus: 'All' // Get all to group, or pass filter
        };
      } else {
        url = '/bloodbank-pending-bills';
        params = {
          hospitalEmail: selectedEntity,
          month: monthFilter,
          date: dateFilter,
          paymentStatus: paymentStatusFilter
        };
      }

      const res = await axios.get(url, { params });
      setBillingData(res.data || []);

      // Calculate total pending
      let total = 0;
      res.data.forEach(item => {
        // If hospital view, only add up unpaid orders
        if (user.type === 'hospital') {
          const isAllPaid = item.orders && item.orders.every(o => o.paymentStatus === 'Paid');
          if (!isAllPaid) {
            total += item.totalPending;
          }
        } else {
          total += item.totalPending;
        }
      });
      setGrossTotal(total);
    } catch (err) {
      console.error("Error fetching billing list", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadFilterEntities();
      fetchBillingData();
    }
  }, [user]);

  // Trigger search on filter changes for Blood Bank
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchBillingData();
  };

  // Razorpay payment integration
  const processPayment = async (amount, backendBody) => {
    try {
      setLoading(true);

      // Get Razorpay client key ID
      const configRes = await axios.get('/api/config/razorpay');
      const keyId = configRes.data.key_id;

      // Create Razorpay Order
      let order = null;
      try {
        const orderRes = await axios.post('/create-razorpay-order', { amount });
        order = orderRes.data;
      } catch (err) {
        console.warn("Order creation failed on server. Proceeding with simulation.");
      }

      // Check if dummy keys are detected or order creation failed
      if (!order || !order.id || !keyId || keyId.startsWith('dummy')) {
        alert("Simulating successful payment flow...");

        backendBody.razorpay_payment_id = "pay_simulated_" + Date.now();
        const payRes = await axios.post('/pay-bill', backendBody);
        alert(payRes.data.message + " An email receipt has been sent!");
        fetchBillingData();
        return;
      }

      // Proceed with live Razorpay Popup
      const options = {
        key: keyId,
        amount: order.amount,
        currency: "INR",
        name: "BloodLink",
        description: "Hospital Bill Payment",
        order_id: order.id,
        handler: async (response) => {
          try {
            backendBody.razorpay_payment_id = response.razorpay_payment_id;
            const payRes = await axios.post('/pay-bill', backendBody);
            alert(payRes.data.message + " An email receipt has been sent!");
            fetchBillingData();
          } catch (payErr) {
            console.error(payErr);
            alert("Payment verification failed on server.");
          }
        },
        theme: { color: "#e53e3e" }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment checkout error", err);
      alert("Checkout failed. Check logs.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayBill = (bankId, amount) => {
    if (!window.confirm("Proceed to Razorpay to pay ₹" + amount + "?")) return;
    processPayment(amount, { bankId });
  };

  const handlePayAll = () => {
    if (grossTotal <= 0) {
      alert("There are no pending amounts to pay.");
      return;
    }
    if (!window.confirm("Proceed to Razorpay to pay ALL pending bills totaling ₹" + grossTotal + "?")) return;
    processPayment(grossTotal, { payAll: true });
  };

  return (
    <div className="container mx-auto p-6 animate-fadeIn">
      {loading && <Loader message="Processing Billing Data..." />}

      <div id="billing" className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Billing Dashboard</h2>

        {/* HOSPITAL USER VIEW */}
        {user && user.type === 'hospital' && (
          <div id="hospitalBillingSection">
            <div className="flex flex-wrap justify-between items-center bg-red-50 p-6 rounded-xl border border-red-200 mb-6 gap-4">
              <div>
                <h3 className="text-lg font-bold text-red-700">Gross Total Pending</h3>
                <p className="text-3xl font-bold text-red-600">₹{grossTotal}</p>
              </div>
              <button
                onClick={handlePayAll}
                className="bg-red-600 text-white px-8 py-3 rounded-lg shadow hover:bg-red-700 font-bold transition duration-200 transform hover:scale-105"
              >
                Pay All
              </button>
            </div>

            {/* Filter Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-xs mb-1 font-semibold">Filter by Blood Bank</label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
                >
                  <option value="">All Blood Banks</option>
                  {filterList.map(bank => (
                    <option key={bank._id} value={bank._id}>{bank.name}</option>
                  ))}
                </select>
              </div>
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
            </div>

            <button
              onClick={fetchBillingData}
              className="bg-red-600 text-white px-5 py-2 rounded hover:bg-red-700 font-semibold mb-6 transition"
            >
              Apply Filters
            </button>

            {/* Grouped Bills List */}
            <div id="hospitalBillingHistory" className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mt-4">
              {billingData.length === 0 ? (
                <p className="text-gray-500 italic text-center py-6">No pending bills found.</p>
              ) : (
                billingData.map(item => {
                  const isPaid = item.orders && item.orders.every(o => o.paymentStatus === 'Paid');

                  return (
                    <div
                      key={item.bankId}
                      className="bg-white border rounded-lg shadow-sm border-l-4 border-l-red-500 hover:shadow transition relative"
                    >
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-t-lg border-b border-gray-100">
                        <h4 className="font-bold text-lg text-gray-800 flex items-center gap-1">
                          <i className="bi bi-bank text-red-600"></i> {item.bankName}
                        </h4>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">Total Amount</span>
                          <span className="text-xl font-bold text-red-600">₹{item.totalPending}</span>
                        </div>
                      </div>

                      <div className="p-4 flex justify-between items-center bg-white">
                        <button
                          onClick={() => toggleBreakthrough(item.bankId)}
                          className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1 font-semibold"
                        >
                          <i className="bi bi-calendar-check text-base"></i> View Day-wise Breakthrough
                        </button>

                        {isPaid ? (
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                            <i className="bi bi-check-circle"></i> Paid
                          </span>
                        ) : (
                          <button
                            onClick={() => handlePayBill(item.bankId, item.totalPending)}
                            className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 transition flex items-center gap-2 font-bold text-sm"
                          >
                            <i className="bi bi-credit-card"></i> Pay Bill
                          </button>
                        )}
                      </div>

                      {openBreakthroughs[item.bankId] && (
                        <div className="bg-gray-50 px-4 pb-4 rounded-b-lg border-t pt-4 border-gray-100 animate-fadeIn">
                          <h5 className="text-sm font-semibold mb-2 text-gray-600 uppercase tracking-wide">Day-wise Details</h5>
                          <ul className="space-y-1 text-sm bg-white p-3 rounded border">
                            {Object.entries(item.daywise || {}).map(([day, val]) => (
                              <li key={day} className="flex justify-between border-b py-1 text-gray-700">
                                <span>{day}</span>
                                <span className="font-semibold text-gray-900">₹{val}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* BLOOD BANK USER VIEW */}
        {user && user.type === 'bloodbank' && (
          <div id="bloodBankBillingSection">
            <div className="flex justify-between items-center bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
              <div>
                <h3 className="text-lg font-bold text-blue-700">Gross Expected Payment</h3>
                <p className="text-3xl font-bold text-blue-600">₹{grossTotal}</p>
              </div>
            </div>

            {/* Filter Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 text-xs mb-1 font-semibold">Filter by Hospital</label>
                <select
                  value={selectedEntity}
                  onChange={(e) => setSelectedEntity(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
                >
                  <option value="">All Hospitals</option>
                  {filterList.map(hosp => (
                    <option key={hosp._id} value={hosp.email}>{hosp.name}</option>
                  ))}
                </select>
              </div>
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
                <label className="block text-gray-700 text-xs mb-1 font-semibold">Payment Status</label>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500 text-sm bg-white"
                >
                  <option value="Unpaid">Unpaid</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleApplyFilters}
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 font-semibold mb-6 transition"
            >
              Apply Filters
            </button>

            {/* expected bills list */}
            <div id="bbBillingHistory" className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mt-4">
              {billingData.length === 0 ? (
                <p className="text-gray-500 italic text-center py-6">No bills found.</p>
              ) : (
                billingData.map(item => {
                  const isPaid = item.orders && item.orders.every(o => o.paymentStatus === 'Paid');
                  const safeEmail = item.hospitalEmail.replace(/[@.]/g, '-');

                  return (
                    <div
                      key={item.hospitalEmail}
                      className="bg-white border rounded-lg shadow-sm border-l-4 border-l-blue-500 hover:shadow transition relative"
                    >
                      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-t-lg border-b border-gray-100">
                        <h4 className="font-bold text-lg text-gray-800 flex items-center gap-1">
                          <i className="bi bi-hospital text-blue-600"></i> {item.hospitalName}
                        </h4>
                        <div className="text-right">
                          <span className="text-xs text-gray-500 block">Expected Billing</span>
                          <span className="text-xl font-bold text-blue-600">₹{item.totalPending}</span>
                        </div>
                      </div>

                      <div className="p-4 flex justify-between items-center bg-white rounded-b-lg">
                        <button
                          onClick={() => toggleBreakthrough(safeEmail)}
                          className="text-blue-600 hover:text-blue-800 underline text-sm flex items-center gap-1 font-semibold"
                        >
                          <i className="bi bi-calendar-check text-base"></i> View Day-wise Breakthrough
                        </button>

                        {isPaid ? (
                          <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                            <i className="bi bi-check-circle"></i> Paid
                          </span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-1">
                            <i className="bi bi-hourglass-split"></i> Unpaid
                          </span>
                        )}
                      </div>

                      {openBreakthroughs[safeEmail] && (
                        <div className="bg-gray-50 px-4 pb-4 rounded-b-lg border-t pt-4 border-gray-100 animate-fadeIn">
                          <h5 className="text-sm font-semibold mb-2 text-gray-600 uppercase tracking-wide">Day-wise Details</h5>
                          <ul className="space-y-1 text-sm bg-white p-3 rounded border">
                            {Object.entries(item.daywise || {}).map(([day, val]) => (
                              <li key={day} className="flex justify-between border-b py-1 text-gray-700">
                                <span>{day}</span>
                                <span className="font-semibold text-gray-900">₹{val}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Billing;
