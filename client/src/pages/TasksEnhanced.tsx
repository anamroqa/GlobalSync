import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import TaskModal from '../components/TaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import '../styles/TasksEnhanced.css';

interface Task {
  id: number;
  action_id: string;
  title: string;
  description: string;
  assigned_to_id: number;
  assignedToName: string;
  created_by_id: number;
  createdByName: string;
  priority: string;
  status: string;
  progress: number;
  due_date: string | null;
  assigned_date: string;
  time_slot: string | null;
  category: string;
  resources_needed: string;
  budget_required: string;
  expected_outcome: string;
  escalation: string;
  completion_date: string | null;
  lessons_learned: string;
  next_steps: string;
  last_updated_by_id: number | null;
  lastUpdatedByName: string | null;
  updated_at: string;
  created_at: string;
  dependencies: any[];
}

interface User {
  id: number;
  username: string;
  fullName: string;
  role: string;
}

const TasksEnhanced: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
    fetchTasks();
  }, []);

  useEffect(() => {
    // Apply filters from URL params
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const owner = searchParams.get('owner');
    const action = searchParams.get('action');

    if (status) setStatusFilter(status);
    if (priority) setPriorityFilter(priority);
    if (owner) setOwnerFilter(owner);
    if (action === 'new') setShowModal(true);
  }, [searchParams]);

  useEffect(() => {
    applyFilters();
  }, [tasks, statusFilter, priorityFilter, ownerFilter, searchQuery]);

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    if (ownerFilter !== 'all') {
      filtered = filtered.filter(t => t.assigned_to_id === parseInt(ownerFilter));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query) ||
        t.action_id.toLowerCase().includes(query)
      );
    }

    // Check for overdue filter
    if (searchParams.get('overdue') === 'true') {
      const now = new Date();
      filtered = filtered.filter(t =>
        t.due_date &&
        new Date(t.due_date) < now &&
        t.status !== 'completed'
      );
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = () => {
    setSelectedTask(null);
    setShowModal(true);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskSaved = () => {
    fetchTasks();
    setShowModal(false);
    setSelectedTask(null);
  };

  // const handleUpdateTask = async (taskId: number, updates: Partial<Task>) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'not_started': return 'status-not-started';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'blocked': return 'status-blocked';
      default: return '';
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return '';
    }
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const canCreateTask = currentUser && (currentUser.role === 'manager' || currentUser.role === 'core_team');

  return (
    <div className="tasks-enhanced">
      <div className="tasks-header">
        <div className="tasks-title-section">
          <h1>Task Management</h1>
          <p className="tasks-subtitle">{filteredTasks.length} tasks found</p>
        </div>
        <div className="tasks-actions">
          <button
            className="view-toggle"
            onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
          >
            {viewMode === 'table' ? '📇 Card View' : '📊 Table View'}
          </button>
          {canCreateTask && (
            <button className="btn-create-task" onClick={handleCreateTask}>
              ➕ New Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Search:</label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="filter-search"
          />
        </div>

        <div className="filter-group">
          <label>Status:</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority:</label>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Owner:</label>
          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
            <option value="all">All Members</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.fullName}</option>
            ))}
          </select>
        </div>

        {(statusFilter !== 'all' || priorityFilter !== 'all' || ownerFilter !== 'all' || searchQuery) && (
          <button
            className="btn-clear-filters"
            onClick={() => {
              setStatusFilter('all');
              setPriorityFilter('all');
              setOwnerFilter('all');
              setSearchQuery('');
              navigate('/tasks');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Tasks Display */}
      {viewMode === 'table' ? (
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Action ID</th>
                <th>Category</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Owner</th>
                <th>Assigned Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="no-tasks">
                    No tasks found. {canCreateTask && 'Create your first task!'}
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr
                    key={task.id}
                    className={`task-row ${isOverdue(task.due_date, task.status) ? 'task-overdue' : ''}`}
                    onClick={() => handleTaskClick(task)}
                  >
                    <td className="task-id">{task.action_id}</td>
                    <td className="task-category">{task.category || '-'}</td>
                    <td className="task-title">{task.title}</td>
                    <td>
                      <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="task-owner">{task.assignedToName}</td>
                    <td className="task-date">{formatDate(task.assigned_date)}</td>
                    <td className="task-date">
                      {isOverdue(task.due_date, task.status) && (
                        <span className="overdue-indicator">⚠️ </span>
                      )}
                      {formatDate(task.due_date)}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="progress-cell">
                        <div className="progress-bar-small">
                          <div
                            className="progress-fill-small"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text-small">{task.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn-view-task"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="tasks-cards-grid">
          {filteredTasks.length === 0 ? (
            <div className="no-tasks-card">
              No tasks found. {canCreateTask && 'Create your first task!'}
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`task-card ${isOverdue(task.due_date, task.status) ? 'task-card-overdue' : ''}`}
                onClick={() => handleTaskClick(task)}
              >
                <div className="task-card-header">
                  <span className="task-card-id">{task.action_id}</span>
                  <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                <h3 className="task-card-title">{task.title}</h3>
                {task.category && <p className="task-card-category">📁 {task.category}</p>}
                <p className="task-card-owner">👤 {task.assignedToName}</p>
                <div className="task-card-dates">
                  <span>📅 Due: {formatDate(task.due_date)}</span>
                  {isOverdue(task.due_date, task.status) && (
                    <span className="overdue-badge">⚠️ Overdue</span>
                  )}
                </div>
                <div className="task-card-footer">
                  <span className={`status-badge ${getStatusClass(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <div className="progress-indicator">
                    <div className="progress-bar-card">
                      <div
                        className="progress-fill-card"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                    <span>{task.progress}%</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <TaskModal
          onClose={() => setShowModal(false)}
          onSave={handleTaskSaved}
          users={users}
        />
      )}

      {selectedTask && (
        <TaskDetailsModal
          task={selectedTask}
          users={users}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskSaved}
        />
      )}
    </div>
  );
};

export default TasksEnhanced;

