import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8080';

const AiAssistant = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  const [prompt, setPrompt] = useState('');
  const [rideId, setRideId] = useState('');
  const [response, setResponse] = useState('');
  const [model, setModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async (e) => {
    e.preventDefault();
    setError('');
    setResponse('');
    setModel('');
    setIsLoading(true);

    try {
      const payload = {
        prompt,
        rideId: rideId ? Number(rideId) : null,
      };

      const aiResponse = await axios.post(`${API_BASE}/api/ai/assistant`, payload, {
        headers: authHeaders,
      });

      setResponse(aiResponse.data?.answer || 'No response generated');
      setModel(aiResponse.data?.model || 'unknown');
    } catch (askError) {
      setError(
        askError.response?.data?.message ||
        askError.response?.data?.error ||
        'Failed to get AI response'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-6 bg-black text-white flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">RideFlow AI Assistant</h1>
            <p className="text-sm text-gray-300 mt-1">Ask about rides, OTP, payments, and troubleshooting</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-white text-black font-semibold hover:bg-gray-100"
          >
            Back
          </button>
        </div>

        <div className="p-6">
          {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{error}</div>}

          <form onSubmit={handleAsk} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Question</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-32 border border-gray-300 rounded-lg p-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Example: My ride is completed but payment shows pending. What should I do?"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ride ID (optional)</label>
              <input
                type="number"
                value={rideId}
                onChange={(e) => setRideId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
                placeholder="Enter ride id for context"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400"
            >
              {isLoading ? 'Thinking...' : 'Ask AI Assistant'}
            </button>
          </form>

          {response && (
            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-2">Assistant response ({model})</p>
              <p className="text-gray-800 whitespace-pre-wrap">{response}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
