import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock3, Headphones, Info, LogOut, Pencil, Wallet } from 'lucide-react';
import { clearSession } from '../utils/auth';

const API_BASE = 'http://localhost:8080';

const UserProfile = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [editOpen, setEditOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    profilePicture: '',
  });

  const [walletForm, setWalletForm] = useState({
    amount: '',
    paymentMethod: 'UPI',
  });
  const [walletLoading, setWalletLoading] = useState(false);

  const authHeaders = useMemo(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token]
  );

  const fetchProfile = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_BASE}/api/users/profile`, {
        headers: authHeaders,
      });
      setProfile(response.data);
    } catch (fetchError) {
      setError(
        fetchError.response?.data?.message ||
          fetchError.response?.data?.error ||
          'Unable to load profile.'
      );
    } finally {
      setLoading(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchProfile();
  }, [fetchProfile, navigate, token]);

  const handleOpenEdit = () => {
    setNotice('');
    setError('');
    setProfileForm({
      name: profile?.name || '',
      phone: profile?.phone || '',
      profilePicture: profile?.profilePicture || '',
    });
    setEditOpen(true);
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setError('');
    setNotice('');

    try {
      const response = await axios.put(
        `${API_BASE}/api/users/profile`,
        {
          name: profileForm.name,
          phone: profileForm.phone,
          profilePicture: profileForm.profilePicture,
        },
        { headers: authHeaders }
      );

      setProfile(response.data);
      setEditOpen(false);
      setNotice('Profile updated successfully.');
    } catch (saveError) {
      setError(
        saveError.response?.data?.message ||
          saveError.response?.data?.error ||
          'Unable to update profile.'
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleAddMoney = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');

    const amount = Number(walletForm.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.');
      return;
    }

    setWalletLoading(true);
    try {
      const response = await axios.post(
        `${API_BASE}/api/users/wallet/add`,
        {
          amount,
          paymentMethod: walletForm.paymentMethod,
        },
        { headers: authHeaders }
      );

      setProfile((prev) => ({
        ...(prev || {}),
        walletBalance: response.data?.walletBalance ?? prev?.walletBalance ?? 0,
      }));
      setWalletForm((prev) => ({ ...prev, amount: '' }));
      setNotice(
        `Added INR ${(response.data?.addedAmount ?? amount).toFixed(2)} via ${response.data?.paymentMethod || walletForm.paymentMethod}.`
      );
    } catch (walletError) {
      setError(
        walletError.response?.data?.message ||
          walletError.response?.data?.error ||
          'Unable to add money.'
      );
    } finally {
      setWalletLoading(false);
    }
  };

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const initials = (profile?.name || 'R').trim().charAt(0).toUpperCase();
  const walletBalance = Number(profile?.walletBalance ?? 0).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-sm font-medium text-gray-700 shadow-sm">
          Loading profile...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 via-white to-gray-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 md:p-6 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gray-500">RideFlow</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">Profile & Wallet</h1>
          </div>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>
        )}
        {notice && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm space-y-5">
            <div className="flex items-start justify-between">
              <h2 className="text-lg font-bold text-gray-900">Profile Details</h2>
              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </button>
            </div>

            <div className="flex items-center gap-4">
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-20 h-20 rounded-2xl object-cover border border-gray-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-black text-white text-2xl font-bold flex items-center justify-center">
                  {initials}
                </div>
              )}
              <div>
                <p className="text-xl font-semibold text-gray-900">{profile?.name || 'RideFlow User'}</p>
                <p className="text-sm text-gray-600">{profile?.email || '-'}</p>
                <p className="text-sm text-gray-600 mt-1">{profile?.phone || 'No phone added'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-gray-500">Role</p>
                <p className="font-semibold text-gray-900 mt-1">
                  {profile?.roles?.length ? profile.roles.join(', ') : 'RIDER'}
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                <p className="text-gray-500">User ID</p>
                <p className="font-semibold text-gray-900 mt-1">{profile?.id ?? '-'}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              RideFlow Wallet
            </h2>
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Current Balance</p>
              <p className="text-3xl font-extrabold text-emerald-800 mt-2">INR {walletBalance}</p>
            </div>

            <form className="space-y-3" onSubmit={handleAddMoney}>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em]">Amount</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={walletForm.amount}
                  onChange={(event) =>
                    setWalletForm((prev) => ({
                      ...prev,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="Enter amount"
                  className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                  disabled={walletLoading}
                />
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-[0.2em] mb-2">Payment Method</p>
                <div className="grid grid-cols-2 gap-2">
                  {['UPI', 'CARD'].map((method) => (
                    <label
                      key={method}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold text-center cursor-pointer ${
                        walletForm.paymentMethod === method
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 text-gray-700 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="walletPaymentMethod"
                        value={method}
                        checked={walletForm.paymentMethod === method}
                        onChange={(event) =>
                          setWalletForm((prev) => ({
                            ...prev,
                            paymentMethod: event.target.value,
                          }))
                        }
                        className="hidden"
                      />
                      {method}
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={walletLoading}
                className="w-full rounded-lg bg-black text-white py-2.5 text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600"
              >
                {walletLoading ? 'Adding...' : 'Add Money'}
              </button>
            </form>
          </section>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Settings & About</h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setNotice('Ride History page will be linked in the next iteration.')}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50"
            >
              <Clock3 className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-semibold text-gray-900">Ride History</p>
                <p className="text-xs text-gray-500">Coming soon</p>
              </div>
            </button>

            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-600" />
                <p className="font-semibold text-gray-900">About RideFlow</p>
              </div>
              <p className="text-xs text-gray-600 mt-2">Version 1.0.0. Ride booking, wallet, AI support and live tracking features.</p>
            </div>

            <button
              onClick={() => navigate('/assistant')}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3 text-left hover:bg-blue-100"
            >
              <Headphones className="w-5 h-5 text-blue-700" />
              <div>
                <p className="font-semibold text-blue-900">Help & Support</p>
                <p className="text-xs text-blue-700">Open AI Assistant</p>
              </div>
            </button>

            <button
              onClick={handleLogout}
              className="w-full rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 flex items-center gap-3 text-left hover:bg-rose-100"
            >
              <LogOut className="w-5 h-5 text-rose-700" />
              <div>
                <p className="font-semibold text-rose-900">Logout</p>
                <p className="text-xs text-rose-700">Sign out from this account</p>
              </div>
            </button>
          </div>
        </section>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveProfile}
            className="w-full max-w-md rounded-2xl bg-white border border-gray-200 p-5 shadow-2xl space-y-4"
          >
            <h3 className="text-lg font-bold text-gray-900">Edit Profile</h3>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-[0.2em]">Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={profileSaving}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-[0.2em]">Phone</label>
              <input
                type="text"
                value={profileForm.phone}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    phone: event.target.value,
                  }))
                }
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={profileSaving}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 uppercase tracking-[0.2em]">Profile Picture URL</label>
              <input
                type="url"
                value={profileForm.profilePicture}
                onChange={(event) =>
                  setProfileForm((prev) => ({
                    ...prev,
                    profilePicture: event.target.value,
                  }))
                }
                className="w-full mt-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                disabled={profileSaving}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                disabled={profileSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-600"
                disabled={profileSaving}
              >
                {profileSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
