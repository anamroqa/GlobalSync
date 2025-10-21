import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/DashboardEnhanced.css';

interface User {
  id: number;
  fullName: string;
  username: string;
  role: string;
  region: string;
  status: string;
}

interface TeamMember {
  id: number;
  fullName: string;
  username: string;
  role: string;
  region: string;
  status: string;
  taskCount: number;
  completedCount: number;
  overdueCount: number;
}

interface DashboardStats {
  tasksByStatus: {
    not_started: number;
    in_progress: number;
    completed: number;
    blocked: number;
  };
  tasksByPriority: {
    high: number;
    medium: number;
    low: number;
  };
  overdueTasks: number;
  teamMembers: TeamMember[];
}

const DashboardEnhanced: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentUser();
    fetchDashboardStats();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleStatClick = (filter: string, value: string) => {
    navigate(`/tasks?${filter}=${value}`);
  };

  const handleTeamMemberClick = (userId: number) => {
    navigate(`/tasks?owner=${userId}`);
  };

  if (!stats || !currentUser) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-enhanced">
      <div className="dashboard-header">
        <h1>Welcome back, {currentUser.fullName}!</h1>
        <p className="dashboard-subtitle">Here's your team overview</p>
      </div>

      {/* Task Status Overview */}
      <section className="stats-section">
        <h2>Task Status Overview</h2>
        <div className="stats-grid">
          <div 
            className="stat-card stat-not-started clickable"
            onClick={() => handleStatClick('status', 'not_started')}
          >
            <div className="stat-icon">📋</div>
            <div className="stat-content">
              <h3>{stats.tasksByStatus.not_started}</h3>
              <p>Not Started</p>
            </div>
          </div>

          <div 
            className="stat-card stat-in-progress clickable"
            onClick={() => handleStatClick('status', 'in_progress')}
          >
            <div className="stat-icon">⚡</div>
            <div className="stat-content">
              <h3>{stats.tasksByStatus.in_progress}</h3>
              <p>In Progress</p>
            </div>
          </div>

          <div 
            className="stat-card stat-completed clickable"
            onClick={() => handleStatClick('status', 'completed')}
          >
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{stats.tasksByStatus.completed}</h3>
              <p>Completed</p>
            </div>
          </div>

          <div 
            className="stat-card stat-blocked clickable"
            onClick={() => handleStatClick('status', 'blocked')}
          >
            <div className="stat-icon">🚫</div>
            <div className="stat-content">
              <h3>{stats.tasksByStatus.blocked}</h3>
              <p>Blocked</p>
            </div>
          </div>
        </div>
      </section>

      {/* Priority Overview */}
      <section className="stats-section">
        <h2>Priority Distribution</h2>
        <div className="stats-grid stats-grid-3">
          <div 
            className="stat-card stat-high-priority clickable"
            onClick={() => handleStatClick('priority', 'high')}
          >
            <div className="stat-icon">🔴</div>
            <div className="stat-content">
              <h3>{stats.tasksByPriority.high}</h3>
              <p>High Priority</p>
            </div>
          </div>

          <div 
            className="stat-card stat-medium-priority clickable"
            onClick={() => handleStatClick('priority', 'medium')}
          >
            <div className="stat-icon">🟡</div>
            <div className="stat-content">
              <h3>{stats.tasksByPriority.medium}</h3>
              <p>Medium Priority</p>
            </div>
          </div>

          <div 
            className="stat-card stat-low-priority clickable"
            onClick={() => handleStatClick('priority', 'low')}
          >
            <div className="stat-icon">🟢</div>
            <div className="stat-content">
              <h3>{stats.tasksByPriority.low}</h3>
              <p>Low Priority</p>
            </div>
          </div>
        </div>
      </section>

      {/* Overdue Alert */}
      {stats.overdueTasks > 0 && (
        <section className="alert-section">
          <div 
            className="alert-card alert-overdue clickable"
            onClick={() => handleStatClick('overdue', 'true')}
          >
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <h3>{stats.overdueTasks} Overdue Tasks</h3>
              <p>Click to view and take action</p>
            </div>
          </div>
        </section>
      )}

      {/* Team Overview */}
      <section className="team-section">
        <h2>Team Overview</h2>
        <div className="team-grid">
          {stats.teamMembers.map(member => (
            <div 
              key={member.id}
              className="team-card clickable"
              onClick={() => handleTeamMemberClick(member.id)}
            >
              <div className="team-card-header">
                <div className="team-avatar">
                  {member.fullName.charAt(0)}
                </div>
                <div className="team-info">
                  <h3>{member.fullName}</h3>
                  <p className="team-role">{member.role.replace('_', ' ')}</p>
                  <p className="team-region">{member.region}</p>
                </div>
              </div>
              
              <div className="team-stats">
                <div className="team-stat">
                  <span className="team-stat-value">{member.taskCount}</span>
                  <span className="team-stat-label">Total Tasks</span>
                </div>
                <div className="team-stat">
                  <span className="team-stat-value">{member.completedCount}</span>
                  <span className="team-stat-label">Completed</span>
                </div>
                {member.overdueCount > 0 && (
                  <div className="team-stat team-stat-overdue">
                    <span className="team-stat-value">{member.overdueCount}</span>
                    <span className="team-stat-label">Overdue</span>
                  </div>
                )}
              </div>

              <div className="team-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${member.taskCount > 0 ? (member.completedCount / member.taskCount) * 100 : 0}%` 
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {member.taskCount > 0 
                    ? `${Math.round((member.completedCount / member.taskCount) * 100)}%` 
                    : '0%'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      {(currentUser.role === 'manager' || currentUser.role === 'core_team') && (
        <section className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button 
              className="action-btn action-btn-primary"
              onClick={() => navigate('/tasks?action=new')}
            >
              ➕ Create New Task
            </button>
            <button 
              className="action-btn action-btn-secondary"
              onClick={() => navigate('/team?action=announce')}
            >
              📢 Post Announcement
            </button>
            {currentUser.role === 'manager' && (
              <button 
                className="action-btn action-btn-secondary"
                onClick={() => navigate('/admin')}
              >
                👥 Manage Users
              </button>
            )}
            <button 
              className="action-btn action-btn-secondary"
              onClick={() => navigate('/calendar')}
            >
              📅 View Calendar
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default DashboardEnhanced;

