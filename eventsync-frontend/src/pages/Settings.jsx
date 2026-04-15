import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

const Settings = () => {
  const { logout } = useContext(AuthContext);
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [nameInput, setNameInput] = useState('');
  
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/me');
        setProfile(res.data);
        setNameInput(res.data.name);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    try {
      const res = await api.put('/users/update', { name: nameInput });
      setProfile(res.data);
      showToast('Profile updated successfully!');
      // Dispatch custom event to trigger Sidebar update conceptually since AuthContext usually mounts on hard reload.
      window.location.reload(); 
    } catch (err) {
      showToast('Failed to update profile.');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      showToast('New password must be at least 6 characters.');
      return;
    }
    try {
      await api.post('/users/change-password', { 
         currentPassword: passwordData.currentPassword, 
         newPassword: passwordData.newPassword 
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Password changed successfully!');
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data || 'Incorrect current password or error.');
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">

        {toast && (
          <div style={{
            position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 100,
            background: 'var(--primary-color)', color: 'white',
            padding: '0.75rem 1.25rem', borderRadius: 'var(--border-radius-md)',
            boxShadow: 'var(--shadow-lg)', fontWeight: 500
          }}>
            {toast}
          </div>
        )}

        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Settings</h2>
        
        <div style={{ display: 'grid', gap: '2rem', maxWidth: '600px' }}>
          
          {/* Profile Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              👤 Profile Information
            </h3>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4">
              <div>
                <label className="label">Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={nameInput} 
                  onChange={e => setNameInput(e.target.value)} 
                  required 
                />
              </div>
              <div>
                <label className="label">Email Address (Read Only)</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={profile.email} 
                  disabled 
                  style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem' }}>Save Changes</button>
            </form>
          </div>

          {/* Password Card */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔒 Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="label">Current Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passwordData.currentPassword} 
                  onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passwordData.newPassword} 
                  onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} 
                  required 
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={passwordData.confirmPassword} 
                  onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})} 
                  required 
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: 'fit-content', marginTop: '0.5rem' }}>Update Password</button>
            </form>
          </div>


        </div>
      </div>
    </div>
  );
};

export default Settings;
