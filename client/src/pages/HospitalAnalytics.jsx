import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';

const HospitalAnalytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [hospital, setHospital] = useState(null);

  const chartRef1 = useRef(null);
  const chartRef2 = useRef(null);
  const chartRef3 = useRef(null);
  const chartRef4 = useRef(null);

  const chartInst1 = useRef(null);
  const chartInst2 = useRef(null);
  const chartInst3 = useRef(null);
  const chartInst4 = useRef(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/hospital-analytics/${id}`, {
        headers: { 'Accept': 'application/json' }
      });
      setHospital(res.data.hospital);
      renderCharts(res.data.stats || {});
    } catch (err) {
      console.error("Error loading analytics data", err);
      // Fallback: render with placeholder data if API fails or returns empty
      renderCharts({});
    } finally {
      setLoading(false);
    }
  };

  const renderCharts = (stats) => {
    // Destroy previous chart instances if they exist
    if (chartInst1.current) chartInst1.current.destroy();
    if (chartInst2.current) chartInst2.current.destroy();
    if (chartInst3.current) chartInst3.current.destroy();
    if (chartInst4.current) chartInst4.current.destroy();

    // Data values matching original EJS static lists or api response
    const labels = stats.labels || ['A+', 'A-', 'B+', 'O-', 'AB+', 'O+'];
    const ordersData = stats.orders || [5, 3, 7, 2, 4, 6];
    const months = stats.months || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthlyOrders = stats.monthlyOrders || [12, 9, 15, 7, 18, 10];
    const unitsData = stats.units || [60, 30, 80, 40, 50, 90];
    const billingData = stats.billing || [5000, 3000, 7200, 4000, 8000, 6000];

    const colorPalette = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: 'white' } },
        title: { display: false },
      },
      scales: {
        x: { ticks: { color: 'white' } },
        y: { ticks: { color: 'white' } }
      }
    };

    if (window.Chart) {
      // Chart 1
      chartInst1.current = new window.Chart(chartRef1.current, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Orders',
            data: ordersData,
            backgroundColor: colorPalette,
            borderRadius: 6
          }]
        },
        options: baseOptions
      });

      // Chart 2
      chartInst2.current = new window.Chart(chartRef2.current, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Orders',
            data: monthlyOrders,
            borderColor: '#3b82f6',
            backgroundColor: '#3b82f6',
            fill: false,
            tension: 0.3
          }]
        },
        options: baseOptions
      });

      // Chart 3
      chartInst3.current = new window.Chart(chartRef3.current, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Units',
            data: unitsData,
            backgroundColor: colorPalette
          }]
        },
        options: baseOptions
      });

      // Chart 4
      chartInst4.current = new window.Chart(chartRef4.current, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Billing ₹',
            data: billingData,
            borderColor: '#f97316',
            backgroundColor: '#f97316',
            fill: false,
            tension: 0.3
          }]
        },
        options: baseOptions
      });
    }
  };

  useEffect(() => {
    fetchAnalytics();
    return () => {
      if (chartInst1.current) chartInst1.current.destroy();
      if (chartInst2.current) chartInst2.current.destroy();
      if (chartInst3.current) chartInst3.current.destroy();
      if (chartInst4.current) chartInst4.current.destroy();
    };
  }, [id]);

  return (
    <div className="bg-gray-900 text-white min-h-screen p-8 animate-fadeIn">
      {loading && <Loader message="Analyzing Hospital Orders..." />}

      <h1 className="text-3xl font-bold text-center mb-10">Hospital Analytics</h1>

      {hospital && (
        <p className="text-center text-gray-400 mb-6 font-semibold">
          Showing order profiles for <span className="text-red-500">{hospital.name}</span>
        </p>
      )}

      {/* 2x2 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1600px] mx-auto">

        {/* Chart 1 */}
        <div className="bg-black p-6 rounded-2xl shadow-lg h-[28rem]">
          <h2 className="text-xl font-semibold text-center mb-4">Orders by Blood Group</h2>
          <div className="h-[20rem]">
            <canvas ref={chartRef1} className="w-full h-full"></canvas>
          </div>
        </div>

        {/* Chart 2 */}
        <div className="bg-black p-6 rounded-2xl shadow-lg h-[28rem]">
          <h2 className="text-xl font-semibold text-center mb-4">Monthly Orders</h2>
          <div className="h-[20rem]">
            <canvas ref={chartRef2} className="w-full h-full"></canvas>
          </div>
        </div>

        {/* Chart 3 */}
        <div className="bg-black p-6 rounded-2xl shadow-lg h-[28rem]">
          <h2 className="text-xl font-semibold text-center mb-4">Units by Group</h2>
          <div className="h-[20rem]">
            <canvas ref={chartRef3} className="w-full h-full"></canvas>
          </div>
        </div>

        {/* Chart 4 */}
        <div className="bg-black p-6 rounded-2xl shadow-lg h-[28rem]">
          <h2 className="text-xl font-semibold text-center mb-4">Monthly Billing (₹)</h2>
          <div className="h-[20rem]">
            <canvas ref={chartRef4} className="w-full h-full"></canvas>
          </div>
        </div>

      </div>

      {/* Go Back Button */}
      <div className="text-center mt-12">
        <button 
          onClick={() => navigate('/')} 
          className="bg-red-600 hover:bg-red-700 px-8 py-3 rounded-lg text-white font-bold transition shadow"
        >
          ← Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default HospitalAnalytics;
