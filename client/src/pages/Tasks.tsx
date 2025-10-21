import { useState, useEffect } from 'react';
import Navigation from '../components/Navigation';
import '../styles/Tasks.css';

interface User {
  id: number;
  fullName: string;
  role: string;
  region: string;
}

interface Task {
  id: number;
  title: string;
  description: string;
  assignedToId: number;
  assignedToName: string;
  createdByName: string;
  priority: string;
  status: string;
  dueDate: string;
  category: string;
  createdAt: string;
}

interface TeamMember {
  id: number;
  fullName: string;
  username: string;
  role: string;
}

interface TasksProps {
  user: User;
  onLogout: () => void;
}

function Tasks({ user, onLogout }: TasksProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedToId: user.id,
    priority: 'medium',
    dueDate: '',
    category: ''
  });

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

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
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newTask)
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewTask({
          title: '',
          description: '',
          assignedToId: user.id,
          priority: 'medium',
          dueDate: '',
          category: ''
        });
        fetchTasks();
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && filteredTasks.find(t => t.dueDate === dueDate)?.status !== 'completed';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'in_progress': return 'status-in-progress';
      case 'not_started': return 'status-not-started';
      case 'blocked': return 'status-blocked';
      default: return '';
    }
  };

  return (
    <div>
      <Navigation user={user} onLogout={onLogout} />
      <div className="tasks-container">
        <div className="tasks-header">
          <div>
            <h1>Tasks</h1>
            <p>Manage and track team tasks</p>
          </div>
          {(user.role === 'manager' || user.role === 'core_team') && (
            <button onClick={() => setShowCreateModal(true)} className="create-task-button">
              + New Task
            </button>
          )}
        </div>

        <div className="tasks-filters">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>

          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="filter-select">
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading tasks...</div>
        ) : (
          <div className="tasks-list">
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <p>No tasks found</p>
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div key={task.id} className={`task-card ${isOverdue(task.dueDate) ? 'overdue' : ''}`}>
                  <div className="task-header">
                    <div className="task-title-section">
                      <h3>{task.title}</h3>
                      <div className="task-meta">
                        <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        {task.category && <span className="category-badge">{task.category}</span>}
                      </div>
                    </div>
                    <select
                      value={task.status}
                      onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
                      className={`status-select ${getStatusClass(task.status)}`}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>

                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}

                  <div className="task-footer">
                    <div className="task-info">
                      <span>👤 {task.assignedToName}</span>
                      <span>📅 {formatDate(task.dueDate)}</span>
                      {isOverdue(task.dueDate) && <span className="overdue-badge">⚠️ Overdue</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create New Task</h2>
                <button onClick={() => setShowCreateModal(false)} className="close-button">×</button>
              </div>
              <form onSubmit={handleCreateTask} className="modal-form">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Assign To *</label>
                    <select
                      value={newTask.assignedToId}
                      onChange={(e) => setNewTask({ ...newTask, assignedToId: parseInt(e.target.value) })}
                      required
                    >
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.fullName} ({member.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <input
                      type="text"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                      placeholder="e.g., Business Development"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="cancel-button">
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Create Task
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

export default Tasks;

