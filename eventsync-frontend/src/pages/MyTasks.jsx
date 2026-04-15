import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';

const MyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    try {
      const res = await api.get('/tasks/my');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyTasks(); }, []);

  const updateTaskStatus = async (taskId, nextStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      fetchMyTasks();
    } catch (err) {
      console.error('Could not update task status.', err);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED');
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED');

  const getDeadlineBadge = (dueDateStr) => {
      if (!dueDateStr) return null;
      const due = new Date(dueDateStr);
      due.setHours(0,0,0,0);
      const today = new Date();
      today.setHours(0,0,0,0);
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--danger-color)', color: 'white' }}>⛔ Overdue by {Math.abs(diffDays)} days</span>;
      if (diffDays === 0) return <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--warning-color)', color: 'black' }}>⚠️ Due Today</span>;
      if (diffDays === 1) return <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--warning-color)', color: 'black' }}>⚠️ Due Tomorrow</span>;
      return <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Due in {diffDays} days</span>;
  };

  if (loading) return <div className="app-layout"><Sidebar /><div className="main-content">Loading...</div></div>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>My Tasks</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Pending Tasks Panel */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Pending Actions</h3>
            <div className="flex flex-col gap-3">
              {pendingTasks.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>You're all caught up!</p> : null}
              {pendingTasks.map(task => (
                <div key={task.id} className="list-item" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <span style={{ fontWeight: 600 }}>{task.title}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Event: {task.eventName}</span>
                      {getDeadlineBadge(task.dueDate)}
                    </div>
                  </div>
                  <select 
                     style={{ 
                        padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none',
                        backgroundColor: task.status === 'COMPLETED' ? '#DCFCE7' : task.status === 'IN_PROGRESS' ? '#DBEAFE' : '#FEF9C3',
                        color: task.status === 'COMPLETED' ? '#166534' : task.status === 'IN_PROGRESS' ? '#1E40AF' : '#854D0E',
                        fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', outline: 'none'
                     }}
                     value={task.status} 
                     onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                     <option value="PENDING" style={{ color: 'black', background: 'white' }}>Pending</option>
                     <option value="IN_PROGRESS" style={{ color: 'black', background: 'white' }}>In Progress</option>
                     <option value="COMPLETED" style={{ color: 'black', background: 'white' }}>Completed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Tasks Panel */}
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Completed Tasks</h3>
            <div className="flex flex-col gap-3">
              {completedTasks.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No finished items yet.</p> : null}
              {completedTasks.map(task => (
                <div key={task.id} className="list-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: 'var(--border-radius-md)', opacity: 0.8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 500 }}>{task.title}</span>
                      <span style={{ fontSize: '0.75rem' }}>Event: {task.eventName}</span>
                    </span>
                  </div>
                  <select 
                     style={{ 
                        padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none',
                        backgroundColor: '#DCFCE7', color: '#166534',
                        fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', outline: 'none'
                     }}
                     value={task.status} 
                     onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                     <option value="PENDING" style={{ color: 'black', background: 'white' }}>Pending</option>
                     <option value="IN_PROGRESS" style={{ color: 'black', background: 'white' }}>In Progress</option>
                     <option value="COMPLETED" style={{ color: 'black', background: 'white' }}>Completed</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
