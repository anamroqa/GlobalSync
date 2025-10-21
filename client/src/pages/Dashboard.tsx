import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import '../styles/Dashboard.css';

interface User {
  id: number;
  fullName: string;
  role: string;
  region: string;
}

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

interface DashboardStats {
  tasksByStatus: { [key: string]: number };
  overdueTasks: number;
  tasksByPriority: { [key: string]: number };
  teamMembers: Array<{
    id: number;
    fullName: string;
    username: string;
    role: string;
    region: string;
    status: string;
    taskCount: number;
    completedCount: number;
    overdueCount: number;
  }>;
}

function Dashboard({ user, onLogout }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navigation user={user} onLogout={onLogout} />
        <div className="dashboard-container">
          <div className="loading">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  const totalTasks = Object.values(stats?.tasksByStatus || {}).reduce((a, b) => a + b, 0);
  const completedTasks = stats?.tasksByStatus?.completed || 0;
  const inProgressTasks = stats?.tasksByStatus?.in_progress || 0;
  // const notStartedTasks = stats?.tasksByStatus?.not_started || 0;

  return (
    <div>
      <Navigation user={user} onLogout={onLogout} />
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome back, {user.fullName}!</h1>
          <p>Here's your team overview for today</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <div className="stat-value">{totalTasks}</div>
              <div className="stat-label">Total Tasks</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-value">{completedTasks}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏳</div>
            <div className="stat-content">
              <div className="stat-value">{inProgressTasks}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>

          <div className="stat-card alert">
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <div className="stat-value">{stats?.overdueTasks || 0}</div>
              <div className="stat-label">Overdue</div>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="team-overview">
            <h2>Team Overview</h2>
            <div className="team-grid">
              {stats?.teamMembers.map((member) => (
                <div key={member.id} className="team-member-card">
                  <div className="member-header">
                    <div className="member-avatar">
                      {member.fullName.charAt(0)}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.fullName}</div>
                      <div className="member-role">{member.role.replace('_', ' ')} • {member.region}</div>
                    </div>
                    <div className={`status-indicator ${member.status}`}></div>
                  </div>
                  <div className="member-stats">
                    <div className="member-stat">
                      <span className="stat-number">{member.taskCount}</span>
                      <span className="stat-text">Active Tasks</span>
                    </div>
                    <div className="member-stat">
                      <span className="stat-number">{member.completedCount}</span>
                      <span className="stat-text">Completed</span>
                    </div>
                    {member.overdueCount > 0 && (
                      <div className="member-stat overdue">
                        <span className="stat-number">{member.overdueCount}</span>
                        <span className="stat-text">Overdue</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

