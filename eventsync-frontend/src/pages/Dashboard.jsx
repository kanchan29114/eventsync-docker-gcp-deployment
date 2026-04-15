import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, IndianRupee, MapPin, Calendar as CalendarIcon, Bell, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', date: '', location: '', budget: '' });
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await api.get('/invitations');
      setInvitations(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchInvitations();
  }, []);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', { ...newEvent, budget: parseFloat(newEvent.budget) || 0 });
      setShowModal(false);
      setNewEvent({ title: '', description: '', date: '', location: '', budget: '' });
      fetchEvents();
      showToast('Event created successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccept = async (inviteId) => {
    try {
      await api.post(`/invitations/${inviteId}/accept`);
      showToast('Invitation accepted!');
      fetchInvitations();
      fetchEvents(); // refresh dashboard events
    } catch (err) {
      console.error(err);
      showToast('Failed to accept invitation.');
    }
  };

  const handleReject = async (inviteId) => {
    try {
      await api.post(`/invitations/${inviteId}/reject`);
      showToast('Invitation rejected.');
      fetchInvitations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar pendingCount={invitations.length} />
      <div className="main-content">

        {/* Toast */}
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

        {/* Pending Invitations Section */}
        {invitations.length > 0 && (
          <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary-color)' }}>
            <div className="flex items-center gap-2" style={{ marginBottom: '1rem' }}>
              <Bell size={20} color="var(--primary-color)" />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                Pending Invitations
                <span style={{
                  marginLeft: '0.5rem', background: 'var(--primary-color)', color: 'white',
                  borderRadius: '9999px', fontSize: '0.75rem', padding: '0.125rem 0.5rem'
                }}>{invitations.length}</span>
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {invitations.map(invite => (
                <div key={invite.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1rem', background: 'var(--bg-color)',
                  borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-color)'
                }}>
                  <div>
                    <p style={{ fontWeight: 500 }}>Event: <strong>{invite.eventId}</strong></p>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Role: {invite.role} · Status: {invite.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(invite.id)}
                      className="btn btn-primary"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    >
                      <CheckCircle size={16} /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(invite.id)}
                      className="btn btn-outline"
                      style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Events Header */}
        <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 700 }}>Events</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Manage and coordinate your events seamlessly.</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn btn-primary">
            <Plus size={20} /> Create Event
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '2rem' }}>
          <button 
            onClick={() => setActiveTab('upcoming')} 
            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'upcoming' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'upcoming' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Upcoming Events
          </button>
          <button 
            onClick={() => setActiveTab('completed')} 
            style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'completed' ? '2px solid var(--primary-color)' : '2px solid transparent', color: activeTab === 'completed' ? 'var(--primary-color)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}
          >
            Completed Events
          </button>
        </div>

        {events.filter(e => activeTab === 'upcoming' ? (e.status !== 'COMPLETED') : (e.status === 'COMPLETED')).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <div style={{ width: '64px', height: '64px', backgroundColor: 'var(--border-color)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <CalendarIcon size={32} />
            </div>
            <p>No events found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {events.filter(e => activeTab === 'upcoming' ? (e.status !== 'COMPLETED') : (e.status === 'COMPLETED')).map((event) => (
              <Link to={`/event/${event.id}`} key={event.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{event.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', flex: 1 }}>{event.description}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div className="flex items-center gap-2"><CalendarIcon size={16} /> {new Date(event.date).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2"><MapPin size={16} /> {event.location || 'No location'}</div>
                  <div className="flex items-center justify-between" style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-2"><Users size={16} /> Host: {event.hostName}</div>
                    <div className="flex items-center gap-2" style={{ color: 'var(--secondary-color)', fontWeight: 600 }}>
                      <IndianRupee size={16} /> {event.budget}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Create Event Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
          }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Create New Event</h3>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
              </div>
              <form onSubmit={handleCreateEvent} className="flex flex-col gap-4">
                <div><label className="label">Title</label><input type="text" className="input-field" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} required /></div>
                <div><label className="label">Description</label><textarea className="input-field" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} rows={3} /></div>
                <div><label className="label">Date & Time</label><input type="datetime-local" className="input-field" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} required /></div>
                <div><label className="label">Location</label><input type="text" className="input-field" value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} /></div>
                <div><label className="label">Budget (₹)</label><input type="number" className="input-field" value={newEvent.budget} onChange={e => setNewEvent({...newEvent, budget: e.target.value})} min="0" step="0.01" /></div>
                <div className="flex justify-between" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
