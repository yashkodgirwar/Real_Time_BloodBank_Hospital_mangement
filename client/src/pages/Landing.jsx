import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div id="landingPage" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 text-gray-800 flex flex-col font-sans animate-fadeIn">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 text-center bg-gradient-to-r from-red-700 to-red-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08),transparent)] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-red-800/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-red-500/30 text-xs font-semibold uppercase tracking-wider text-red-200">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-ping"></span>
            Real-Time Blood Supply Grid
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none drop-shadow">
            Bridging Blood Supply & Demand
          </h1>
          <p className="text-lg md:text-xl text-red-100 max-w-2xl mx-auto font-light leading-relaxed">
            BloodLink is a smart, connected digital platform ensuring that hospitals in emergency situations sync instantly with local blood bank inventories to save lives.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="bg-white text-red-700 hover:bg-red-50 font-bold px-8 py-3.5 rounded-xl shadow-lg transition duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base"
            >
              <i className="bi bi-box-arrow-in-right text-lg"></i>
              Access Portal
            </button>
            <button 
              onClick={() => navigate('/register')}
              className="bg-red-600 hover:bg-red-500 text-white font-semibold px-8 py-3.5 rounded-xl border border-red-400/40 shadow-lg transition duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-base"
            >
              <i className="bi bi-person-plus text-lg"></i>
              Create New Account
            </button>
          </div>
        </div>
      </section>

      {/* Role-Specific Capabilities */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900">What Can You Do on BloodLink?</h2>
          <p className="text-gray-500 mt-2 text-base">Select your user role below to explore tailored functionalities built for your facility.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Hospital Features */}
          <div className="bg-white p-8 rounded-3xl border border-red-100 shadow-xl hover:shadow-2xl transition duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-6 text-red-600 text-3xl group-hover:scale-110 transition duration-300">
                <i className="bi bi-hospital"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">For Hospitals & Clinics</h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Request life-saving units immediately with real-time stock updates. Track requests from allocation to checkout.
              </p>
              <ul className="space-y-3.5 text-gray-700 text-sm">
                <li className="flex items-start gap-3">
                  <i className="bi bi-check2-circle text-red-500 text-lg mt-0.5"></i>
                  <span><b>Real-Time Availability Check:</b> Search by blood type and quantity across all registered blood banks instantly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check2-circle text-red-500 text-lg mt-0.5"></i>
                  <span><b>Documentation Upload:</b> Safely upload required patient approval documents to speed up verification.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check2-circle text-red-500 text-lg mt-0.5"></i>
                  <span><b>Billing & Invoice Records:</b> Access fully transparent billing receipts and request logs on the go.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={() => navigate('/register')}
                className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold py-3 px-6 rounded-xl transition duration-200"
              >
                Register as Hospital
              </button>
            </div>
          </div>

          {/* Blood Bank Features */}
          <div className="bg-white p-8 rounded-3xl border border-blue-100 shadow-xl hover:shadow-2xl transition duration-300 flex flex-col justify-between group">
            <div>
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 text-3xl group-hover:scale-110 transition duration-300">
                <i className="bi bi-droplet-fill"></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">For Blood Banks</h3>
              <p className="text-gray-600 mb-6 leading-relaxed text-sm">
                Publish inventory stock levels, handle incoming requests, and launch donation drives using AI-assisted location planning.
              </p>
              <ul className="space-y-3.5 text-gray-700 text-sm">
                <li className="flex items-start gap-3">
                  <i className="bi bi-check2-circle text-blue-500 text-lg mt-0.5"></i>
                  <span><b>Stock Management:</b> View and adjust inventories for 8 primary blood types with dynamic list rendering.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check2-circle text-blue-500 text-lg mt-0.5"></i>
                  <span><b>AI Campaign Targeting:</b> Utilize smart, model-driven suggestions to find areas with the highest blood supply gaps.</span>
                </li>
                <li className="flex items-start gap-3">
                  <i className="bi bi-check2-circle text-blue-500 text-lg mt-0.5"></i>
                  <span><b>Certificate Distribution:</b> Schedule campaign drives and design official printable PDF donation certificates.</span>
                </li>
              </ul>
            </div>
            <div className="mt-8 pt-6 border-t border-gray-100">
              <button 
                onClick={() => navigate('/register')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold py-3 px-6 rounded-xl transition duration-200"
              >
                Register as Blood Bank
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* Platform Features Section */}
      <section className="bg-red-50/50 py-20 px-6 border-t border-b border-red-100">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center p-4">
            <div className="text-red-600 text-4xl mb-4"><i className="bi bi-lightning-charge-fill"></i></div>
            <h4 className="font-bold text-lg text-gray-800 mb-2">Instant Allocation</h4>
            <p className="text-gray-600 text-sm">No phone queues. BloodBank inventories update automatically as orders clear.</p>
          </div>
          <div className="text-center p-4">
            <div className="text-red-600 text-4xl mb-4"><i className="bi bi-shield-lock-fill"></i></div>
            <h4 className="font-bold text-lg text-gray-800 mb-2">Compliance First</h4>
            <p className="text-gray-600 text-sm">Secure document upload guarantees medical approvals are vetted before blood release.</p>
          </div>
          <div className="text-center p-4">
            <div className="text-red-600 text-4xl mb-4"><i className="bi bi-cpu-fill"></i></div>
            <h4 className="font-bold text-lg text-gray-800 mb-2">AI-Driven Campaigns</h4>
            <p className="text-gray-600 text-sm">Leverage custom analytics to spot and address localized blood shortages before they happen.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-10 px-6 bg-gray-900 text-gray-400 text-center border-t border-gray-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white text-xl font-bold">BloodLink</span>
            <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full font-bold">LIVE</span>
          </div>
          <p className="text-sm">© 2026 BloodLink. Connecting inventories, protecting lives.</p>
          <div className="flex gap-4 text-lg">
            <a href="#" className="hover:text-white transition"><i className="bi bi-github"></i></a>
            <a href="#" className="hover:text-white transition"><i className="bi bi-twitter-x"></i></a>
            <a href="#" className="hover:text-white transition"><i className="bi bi-envelope-fill"></i></a>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Landing;
