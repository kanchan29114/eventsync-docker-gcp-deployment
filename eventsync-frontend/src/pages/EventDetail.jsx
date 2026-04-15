import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle, Circle, Clock, Trash2, MessageSquare, Calendar } from 'lucide-react';
import api from '../services/api';
import Sidebar from '../components/Sidebar';
import { AuthContext } from '../context/AuthContext';

const statusColor = {
  ACCEPTED: 'var(--secondary-color)',
  PENDING: 'var(--warning-color)',
  REJECTED: 'var(--danger-color)',
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [toast, setToast] = useState('');
  const { user } = useContext(AuthContext);
  const commentsEndRef = useRef(null);
  const chatContainerRef = useRef(null);


  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  // Get current user id from JWT token stored in localStorage
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub; // sub is the email; we check hostEmail below
    } catch { return null; }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadData = async () => {
    try {
      const [evRes, taskRes, memberRes, activityRes, commentRes] = await Promise.all([
        api.get(`/events/${id}`),
        api.get(`/tasks/event/${id}`),
        api.get(`/collaboration/event/${id}/members`),
        api.get(`/events/${id}/activity`),
        api.get(`/events/${id}/comments`)
      ]);
      setEvent(evRes.data);
      setTasks(taskRes.data);
      setMembers(memberRes.data);
      setActivities(activityRes.data);
      setComments(commentRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const currentEmail = getCurrentUserId();
  const isHost = event && currentEmail === event.hostEmail;
  const isAccepted = members.some(m => m.userEmail === currentEmail && m.status === 'ACCEPTED');
  const canManageTasks = (isHost || isAccepted) && event?.status !== 'COMPLETED';
  
  const currentMemberData = members.find(m => m.userEmail === currentEmail);
  const userCanAssign = isHost || (currentMemberData && currentMemberData.canAssignTasks);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/collaboration/event/${id}/invite`, { email: inviteEmail, role: inviteRole });
      setShowInviteModal(false);
      setInviteEmail('');
      showToast('Invitation sent!');
      loadData();
    } catch (err) {
      showToast('Failed to invite user.');
      console.error('Failed to invite:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      await api.post(`/tasks/event/${id}`, { 
          title: newTaskTitle, 
          status: 'PENDING', 
          assigneeIds: newTaskAssignees.length > 0 ? newTaskAssignees.map(id => parseInt(id)) : [],
          dueDate: newTaskDueDate || null
      });
      setNewTaskTitle('');
      setNewTaskAssignees([]);
      setNewTaskDueDate('');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || err.response?.data || 'Error creating task.');
      console.error('Failed to create task', err);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/events/${id}/comments`, { message: newComment });
      setNewComment('');
      loadData();
    } catch (err) {
      showToast('Wait, you must be a validated member to establish discussion records!');
    }
  };

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

  const updateTaskStatus = async (taskId, nextStatus) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: nextStatus });
      loadData();
    } catch (err) {
      showToast('Could not update task status.');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the event?')) return;
    try {
      await api.delete(`/events/${id}/members/${userId}`);
      showToast('Member removed.');
      loadData();
    } catch (err) {
      showToast('Failed to remove member.');
    }
  };

  const updateMemberPermissions = async (userId, canAssignTasks) => {
    try {
      await api.put(`/events/${id}/members/${userId}/permissions`, { canAssignTasks });
      showToast('Permissions updated.');
      loadData();
    } catch (err) {
      showToast('Failed to update permissions.');
      console.error(err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) return;
    try {
      await api.delete(`/events/${id}`);
      navigate('/');
    } catch (err) {
      showToast('Failed to delete event.');
    }
  };

  const handleCompleteEvent = async () => {
    if (!window.confirm('Are you sure you want to mark this event as completed? Tasks and invitations will be locked.')) return;
    try {
      await api.put(`/events/${id}/complete`);
      loadData();
      showToast('Event marked as completed.');
    } catch (err) {
      showToast('Failed to complete event: ' + (err.response?.data?.message || err.response?.data || err.message));
      console.error(err);
    }
  };

  if (!event) return <div className="app-layout"><Sidebar /><div className="main-content">Loading...</div></div>;

  return (
    <div className="app-layout">
      <Sidebar />
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

        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: '0.5rem' }}>
             <div className="flex items-center gap-3">
               <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{event.title}</h2>
               {event.status === 'COMPLETED' && (
                 <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 600 }}>COMPLETED</span>
               )}
             </div>
             {isHost && (
               <div className="flex items-center gap-2">
                 {event.status !== 'COMPLETED' && (
                   <button onClick={handleCompleteEvent} className="btn btn-primary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', backgroundColor: '#166534', borderColor: '#166534' }}>
                     Mark Completed
                   </button>
                 )}
                 <button onClick={handleDeleteEvent} className="btn btn-outline" style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem', borderColor: 'var(--danger-color)', color: 'var(--danger-color)' }}>
                   Delete Event
                 </button>
               </div>
             )}
          </div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.125rem' }}>{event.description}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div><span className="label">Date</span><strong>{new Date(event.date).toLocaleDateString()}</strong></div>
            <div><span className="label">Location</span><strong>{event.location}</strong></div>
            <div><span className="label">Budget</span><strong>₹{event.budget}</strong></div>
            <div><span className="label">Host</span><strong>{event.hostName}</strong></div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          {/* Tasks Section */}
          <div className="card">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-color)', paddingLeft: '0.75rem', color: '#5B4FFF' }}>Tasks</h3>

            {canManageTasks ? (
              <form onSubmit={handleCreateTask} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text" className="input-field" placeholder="Add a new task..." style={{ flex: '1 1 200px' }}
                  value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                />
                {userCanAssign && (
                  <div className="input-field" style={{ height: 'auto', maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', width: '100%', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                     <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assignees</label>
                     {event && (
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                         <input 
                           type="checkbox" 
                           checked={newTaskAssignees.includes(event.hostId?.toString())}
                           onChange={(e) => {
                             if (e.target.checked) setNewTaskAssignees([...newTaskAssignees, event.hostId.toString()]);
                             else setNewTaskAssignees(newTaskAssignees.filter(id => id !== event.hostId.toString()));
                           }}
                         />
                         {event.hostName} (Host)
                       </label>
                     )}
                     {members.filter(m => m.status === 'ACCEPTED').map(m => (
                       <label key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                         <input 
                           type="checkbox" 
                           checked={newTaskAssignees.includes(m.userId?.toString())}
                           onChange={(e) => {
                             if (e.target.checked) setNewTaskAssignees([...newTaskAssignees, m.userId.toString()]);
                             else setNewTaskAssignees(newTaskAssignees.filter(id => id !== m.userId.toString()));
                           }}
                         />
                         {m.userName}
                       </label>
                     ))}
                  </div>
                )}
                <input 
                  type="date" className="input-field" style={{ width: '130px' }}
                  value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} 
                />
                <button type="submit" className="btn btn-primary">Add</button>
              </form>
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.5rem', fontStyle: 'italic' }}>
                Accept the invitation to add or modify tasks.
              </p>
            )}

            <div className="flex flex-col gap-2">
              {tasks.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No tasks yet.</p> : null}
              {tasks.map(task => (
                <div key={task.id} className="list-item" style={{ display: 'flex', alignItems: 'center', justifyItems: 'stretch', padding: '1rem', borderRadius: 'var(--border-radius-md)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '0.25rem' }}>
                    <span style={{ textDecoration: task.status === 'COMPLETED' ? 'line-through' : 'none', color: task.status === 'COMPLETED' ? 'var(--text-secondary)' : 'var(--text-primary)', fontWeight: 500 }}>
                      {task.title}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                       {task.assignees && task.assignees.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assigned to: {task.assignees.map(a => a.name).join(', ')}</span>}
                       {task.status !== 'COMPLETED' && getDeadlineBadge(task.dueDate)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select 
                       style={{ 
                          padding: '0.25rem 0.5rem', borderRadius: '4px', border: 'none',
                          backgroundColor: task.status === 'COMPLETED' ? '#DCFCE7' : task.status === 'IN_PROGRESS' ? '#DBEAFE' : '#FEF9C3',
                          color: task.status === 'COMPLETED' ? '#166534' : task.status === 'IN_PROGRESS' ? '#1E40AF' : '#854D0E',
                          fontWeight: '600', fontSize: '0.75rem', cursor: 'pointer', outline: 'none'
                       }}
                       value={task.status} 
                       onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                       disabled={!(isHost || (task.assignees && task.assignees.some(a => a.id === currentMemberData?.userId)))}
                    >
                       <option value="PENDING" style={{ color: 'black', background: 'white' }}>Pending</option>
                       <option value="IN_PROGRESS" style={{ color: 'black', background: 'white' }}>In Progress</option>
                       <option value="COMPLETED" style={{ color: 'black', background: 'white' }}>Completed</option>
                    </select>
                    {canManageTasks && (isHost || userCanAssign) && (
                      <button 
                         onClick={() => setEditingTask({ ...task, assigneeIds: task.assignees ? task.assignees.map(a => a.id.toString()) : [] })}
                         className="btn btn-outline" 
                         style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                      >
                         Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Members Section */}
          <div className="card" style={{ alignSelf: 'start' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, borderLeft: '4px solid var(--primary-color)', paddingLeft: '0.75rem', color: '#5B4FFF' }}>Team</h3>
              {isHost && (
                <button onClick={() => setShowInviteModal(true)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem' }}>
                  <UserPlus size={16} /> Invite
                </button>
              )}
            </div>

            <div className="flex flex-col gap-4">
              {/* Host row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>
                  {event.hostName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{event.hostName}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', fontWeight: 600 }}>Host</p>
                </div>
              </div>

              {/* Member rows */}
              {members.map(member => (
                <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                      {member.userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <p style={{ fontWeight: 500, fontSize: '0.875rem' }}>{member.userName}</p>
                        {member.canAssignTasks && <span style={{ fontSize: '0.625rem', padding: '0.125rem 0.25rem', borderRadius: '4px', backgroundColor: 'var(--primary-color)', color: 'white' }}>Task Manager</span>}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: statusColor[member.status] || 'var(--text-secondary)', fontWeight: 600 }}>
                        {member.status}
                      </p>
                      {isHost && member.status === 'ACCEPTED' && (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', marginTop: '0.25rem', cursor: 'pointer' }}>
                          <input type="checkbox" checked={member.canAssignTasks} onChange={(e) => updateMemberPermissions(member.userId, e.target.checked)} />
                          Can Assign Tasks
                        </label>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.375rem', borderRadius: '4px', backgroundColor: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
                      {member.role}
                    </span>
                    {isHost && (
                      <button
                        onClick={() => handleRemoveMember(member.userId)}
                        title="Remove member"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)', padding: '0.25rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Timeline Section */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '4px solid var(--primary-color)', paddingLeft: '0.75rem', color: '#5B4FFF' }}>
            <Clock size={20} color="var(--primary-color)" /> Activity Timeline
          </h3>
          <div className="flex flex-col gap-2" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No recent activity.</p>
            ) : (
              activities.map(act => (
                <div key={act.id} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid var(--border-color)', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', minWidth: '130px' }}>
                    {new Date(act.timestamp).toLocaleString()}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary-color)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{act.action}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    by {act.performedBy}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        
        {/* Discussion Section */}
        <div className="card" style={{ marginTop: '2rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '4px solid var(--primary-color)', paddingLeft: '0.75rem', color: '#5B4FFF' }}>
            <MessageSquare size={20} color="var(--primary-color)" /> Discussion
          </h3>
          
          <div ref={chatContainerRef} className="flex flex-col gap-2" style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem', marginBottom: '1.5rem', scrollBehavior: 'smooth' }}>
            {comments.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '1rem' }}>No comments yet. Start the conversation!</p>
            ) : (
              [...comments].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map(c => {
                const isMe = user && c.userId === user.id;
                return (
                  <div key={c.id} style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    marginBottom: '0.4rem',
                    width: '100%'
                  }}>
                    {!isMe && (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginLeft: '0.5rem', marginBottom: '0.2rem' }}>
                        {c.userName}
                      </span>
                    )}
                    <div style={{ 
                      maxWidth: '75%',
                      padding: '0.6rem 0.9rem',
                      borderRadius: isMe ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                      backgroundColor: isMe ? '#E9E5FF' : '#F3F4F6',
                      color: isMe ? '#4338CA' : '#374151',
                      border: isMe ? '1px solid #C7D2FE' : '1px solid var(--border-color)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      wordBreak: 'break-word'
                    }}>
                      <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap', margin: 0 }}>{c.message}</p>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.25rem', padding: '0 0.5rem' }}>
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} style={{ height: '1px' }} />
          </div>
          
          {canManageTasks ? (
              <form onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input
                  type="text" className="input-field" placeholder="Write a comment..." style={{ flex: 1 }}
                  value={newComment} onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">Send</button>
              </form>
          ) : (
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                Validate your membership to participate in the discussion.
             </p>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Invite Member</h3>
                <button onClick={() => setShowInviteModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
              </div>
              <form onSubmit={handleInvite} className="flex flex-col gap-4">
                <div>
                  <label className="label">User Email</label>
                  <input type="email" className="input-field" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} required />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input-field" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="flex justify-between" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Send Invite</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {editingTask && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Edit Task</h3>
                <button onClick={() => setEditingTask(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: 'var(--text-secondary)' }}>&times;</button>
              </div>
              <form onSubmit={async (e) => {
                 e.preventDefault();
                 try {
                   await api.put(`/tasks/${editingTask.id}`, {
                     status: editingTask.status,
                     assigneeIds: editingTask.assigneeIds ? editingTask.assigneeIds.map(id => parseInt(id)) : [],
                     dueDate: editingTask.dueDate || null
                   });
                   setEditingTask(null);
                   loadData();
                   showToast('Task updated.');
                 } catch (err) {
                    showToast('Wait! You do not have permission or there was an error.');
                 }
              }} className="flex flex-col gap-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input-field" value={editingTask.status} onChange={e => setEditingTask({...editingTask, status: e.target.value})}>
                     <option value="PENDING">Pending</option>
                     <option value="IN_PROGRESS">In Progress</option>
                     <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                {userCanAssign && (
                  <div className="input-field" style={{ height: 'auto', maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Assignees</label>
                     {event && (
                       <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                         <input 
                           type="checkbox" 
                           checked={editingTask.assigneeIds?.includes(event.hostId?.toString())}
                           onChange={(e) => {
                             const newAssignees = e.target.checked 
                               ? [...(editingTask.assigneeIds || []), event.hostId.toString()]
                               : (editingTask.assigneeIds || []).filter(id => id !== event.hostId.toString());
                             setEditingTask({...editingTask, assigneeIds: newAssignees});
                           }}
                         />
                         {event.hostName} (Host)
                       </label>
                     )}
                     {members.filter(m => m.status === 'ACCEPTED').map(m => (
                       <label key={m.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                         <input 
                           type="checkbox" 
                           checked={editingTask.assigneeIds?.includes(m.userId?.toString())}
                           onChange={(e) => {
                             const newAssignees = e.target.checked 
                               ? [...(editingTask.assigneeIds || []), m.userId.toString()]
                               : (editingTask.assigneeIds || []).filter(id => id !== m.userId.toString());
                             setEditingTask({...editingTask, assigneeIds: newAssignees});
                           }}
                         />
                         {m.userName}
                       </label>
                     ))}
                  </div>
                )}
                <div>
                  <label className="label">Due Date</label>
                  <input type="date" className="input-field" value={editingTask.dueDate || ''} onChange={e => setEditingTask({...editingTask, dueDate: e.target.value})} />
                </div>
                <div className="flex justify-between" style={{ marginTop: '1rem' }}>
                  <button type="button" className="btn btn-outline" onClick={() => setEditingTask(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetail;
