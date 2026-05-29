import React, { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserContext } from '../context/UserContext';
import Loader from '../components/Loader';

const Inventory = () => {
  const { bankId } = useParams();
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Input states
  const [Aplus, setAplus] = useState('');
  const [Aminus, setAminus] = useState('');
  const [Bplus, setBplus] = useState('');
  const [Bminus, setBminus] = useState('');
  const [ABplus, setABplus] = useState('');
  const [ABminus, setABminus] = useState('');
  const [Oplus, setOplus] = useState('');
  const [Ominus, setOminus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        bankId,
        Aplus, Aminus, Bplus, Bminus,
        ABplus, ABminus, Oplus, Ominus
      };

      // Call API
      const response = await axios.post('/update-inventory', payload);
      alert("Inventory updated successfully!");
      navigate('/');
    } catch (error) {
      console.error("Error updating inventory", error);
      alert("Failed to update inventory. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isBloodBank = user && user.type === 'bloodbank';

  return (
    <div className="bg-gray-100 min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      {loading && <Loader message="Updating Inventory units..." />}
      
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-red-600">Update Blood Inventory</h2>
        
        {isBloodBank ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="hidden" name="bankId" value={bankId} />

            <table className="min-w-full border-collapse border border-gray-300 text-sm">
              <thead className="bg-gray-200">
                <tr>
                  <th className="border border-gray-300 p-2 text-left text-gray-700">Blood Group</th>
                  <th className="border border-gray-300 p-2 text-left text-gray-700">Units to Add</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'A+', state: Aplus, setter: setAplus },
                  { label: 'A-', state: Aminus, setter: setAminus },
                  { label: 'B+', state: Bplus, setter: setBplus },
                  { label: 'B-', state: Bminus, setter: setBminus },
                  { label: 'AB+', state: ABplus, setter: setABplus },
                  { label: 'AB-', state: ABminus, setter: setABminus },
                  { label: 'O+', state: Oplus, setter: setOplus },
                  { label: 'O-', state: Ominus, setter: setOminus },
                ].map((item) => (
                  <tr key={item.label}>
                    <td className="border border-gray-300 p-3 font-semibold text-gray-700">{item.label}</td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number" 
                        value={item.state}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          item.setter(isNaN(val) || val < 0 ? '' : val);
                        }}
                        min="0" 
                        className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-red-500" 
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right">
              <button type="submit" className="mt-4 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-semibold transition">
                Submit Inventory
              </button>
            </div>
          </form>
        ) : (
          <div className="text-red-500 font-semibold">Only bloodbanks can update inventory</div>
        )}
      </div>

      <div className="mt-8 text-center w-full max-w-2xl">
        <button 
          onClick={() => navigate('/')} 
          className="inline-block bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition duration-200 font-semibold"
        >
          ← Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Inventory;
