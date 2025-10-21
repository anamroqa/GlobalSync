import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import '../styles/Team.css';

interface User {
  id: number;
  fullName: string;
  role: string;
  region: string;
}

interface TeamProps {
  user: User;
  onLogout: () => void;
}

interface TeamMember {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  region: string;
  status: string;
}

interface Announcement {
  id: number;
  title: string;
  message: string;
  createdByName: string;
  priority: string;
  createdAt: string;
}

function Team({ user, onLogout }: TeamProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    message: '',
    priority: 'normal'
  });

  useEffect(() => {
    fetchTeamMembers();
    fetchAnnouncements();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTeamMembers(data);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/announcements', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAnnouncements(data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/announcements', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (response.ok) {
        setShowAnnouncementModal(false);
        setNewAnnouncement({ title: '', message: '', priority: 'normal' });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error('Error creating announcement:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'manager': return '#667eea';
      case 'core_team': return '#764ba2';
      case 'regional_team': return '#48bb78';
      default: return '#718096';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '⚠️';
      default: return '📢';
    }
  };

  return (
    <div>
      <Navigation user={user} onLogout={onLogout} />
      <div className="team-container">
        <div className="team-header">
          <div>
            <h1>Team</h1>
            <p>View team members and announcements</p>
          </div>
          {(user.role === 'manager' || user.role === 'core_team') && (
            <button onClick={() => setShowAnnouncementModal(true)} className="create-announcement-button">
              📢 New Announcement
            </button>
          )}
        </div>

        <div className="team-content">
          <div className="announcements-section">
            <h2>📢 Announcements</h2>
            {announcements.length === 0 ? (
              <div className="empty-state">No announcements yet</div>
            ) : (
              <div className="announcements-list">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className={`announcement-card priority-${announcement.priority}`}>
                    <div className="announcement-header">
                      <div className="announcement-icon">{getPriorityIcon(announcement.priority)}</div>
                      <div className="announcement-info">
                        <h3>{announcement.title}</h3>
                        <div className="announcement-meta">
                          By {announcement.createdByName} • {formatDate(announcement.createdAt)}
                        </div>
                      </div>
                    </div>
                    <p className="announcement-message">{announcement.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="team-members-section">
            <h2>👥 Team Members ({teamMembers.length})</h2>
            {loading ? (
              <div className="loading">Loading team...</div>
            ) : (
              <div className="team-members-grid">
                {teamMembers.map((member) => (
                  <div key={member.id} className="team-member-card">
                    <div className="member-avatar" style={{ background: getRoleColor(member.role) }}>
                      {member.fullName.charAt(0)}
                    </div>
                    <div className="member-details">
                      <h3>{member.fullName}</h3>
                      <div className="member-role" style={{ color: getRoleColor(member.role) }}>
                        {member.role.replace('_', ' ')}
                      </div>
                      <div className="member-region">📍 {member.region}</div>
                      <div className="member-email">✉️ {member.email}</div>
                      <div className={`member-status status-${member.status}`}>
                        <span className="status-dot"></span>
                        {member.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showAnnouncementModal && (
          <div className="modal-overlay" onClick={() => setShowAnnouncementModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Announcement</h2>
                <button onClick={() => setShowAnnouncementModal(false)} className="close-button">×</button>
              </div>
              <form onSubmit={handleCreateAnnouncement} className="modal-form">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newAnnouncement.title}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                    required
                    placeholder="Enter announcement title"
                  />
                </div>

                <div className="form-group">
                  <label>Message *</label>
                  <textarea
                    value={newAnnouncement.message}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                    required
                    rows={4}
                    placeholder="Enter your message"
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newAnnouncement.priority}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, priority: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowAnnouncementModal(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Post Announcement
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Team;

