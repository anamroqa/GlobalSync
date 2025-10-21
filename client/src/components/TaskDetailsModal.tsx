import React, { useState, useEffect } from 'react';
import '../styles/TaskDetailsModal.css';

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
  dependencies: any[];
}

interface User {
  id: number;
  fullName: string;
  role: string;
}

interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  userName: string;
  comment: string;
  created_at: string;
}

interface Props {
  task: Task;
  users: User[];
  currentUser: User | null;
  onClose: () => void;
  onUpdate: () => void;
}

const TaskDetailsModal: React.FC<Props> = ({ task, users, currentUser, onClose, onUpdate }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(task);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [dependencies, setDependencies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'dependencies'>('details');

  useEffect(() => {
    fetchComments();
    fetchDependencies();
  }, [task.id]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${task.id}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${task.id}/dependencies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDependencies(data);
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: newComment })
      });

      if (response.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setEditMode(false);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleQuickStatusUpdate = async (newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const updates: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updates.progress = 100;
        updates.completion_date = new Date().toISOString();
      }

      const response = await fetch(`http://localhost:3001/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  const latestComment = comments.length > 0 ? comments[0] : null;
  const olderComments = comments.slice(1);
  const canEdit = currentUser && (
    currentUser.role === 'manager' ||
    currentUser.role === 'core_team' ||
    currentUser.id === task.assigned_to_id
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-section">
            <h2>{task.action_id}</h2>
            <span className={`status-badge status-${task.status}`}>
              {task.status.replace('_', ' ')}
            </span>
            {isOverdue(task.due_date, task.status) && (
              <span className="overdue-badge">⚠️ Overdue</span>
            )}
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Quick Actions */}
        {canEdit && !editMode && (
          <div className="quick-actions-bar">
            <button className="btn-quick-action" onClick={() => setEditMode(true)}>
              ✏️ Edit Task
            </button>
            {task.status !== 'in_progress' && (
              <button
                className="btn-quick-action btn-start"
                onClick={() => handleQuickStatusUpdate('in_progress')}
              >
                ▶️ Start Task
              </button>
            )}
            {task.status !== 'completed' && (
              <button
                className="btn-quick-action btn-complete"
                onClick={() => handleQuickStatusUpdate('completed')}
              >
                ✅ Mark Complete
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Details
          </button>
          <button
            className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            💬 Comments ({comments.length})
          </button>
          <button
            className={`tab-button ${activeTab === 'dependencies' ? 'active' : ''}`}
            onClick={() => setActiveTab('dependencies')}
          >
            🔗 Dependencies ({dependencies.length})
          </button>
        </div>

        <div className="modal-body">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="details-tab">
              <div className="form-grid">
                {/* Title */}
                <div className="form-group form-group-full">
                  <label>Task Title</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.title}</div>
                  )}
                </div>

                {/* Category */}
                <div className="form-group">
                  <label>Category</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.category || '-'}</div>
                  )}
                </div>

                {/* Priority */}
                <div className="form-group">
                  <label>Priority</label>
                  {editMode ? (
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  ) : (
                    <span className={`priority-badge priority-${task.priority}`}>
                      {task.priority}
                    </span>
                  )}
                </div>

                {/* Owner */}
                <div className="form-group">
                  <label>Owner</label>
                  {editMode ? (
                    <select
                      value={formData.assigned_to_id}
                      onChange={(e) => setFormData({ ...formData, assigned_to_id: parseInt(e.target.value) })}
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.fullName}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="form-value">{task.assignedToName}</div>
                  )}
                </div>

                {/* Status */}
                <div className="form-group">
                  <label>Status</label>
                  {editMode ? (
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="not_started">Not Started</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  ) : (
                    <span className={`status-badge status-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="form-group">
                  <label>Progress %</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.progress}
                      onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                    />
                  ) : (
                    <div className="progress-display">
                      <div className="progress-bar-modal">
                        <div
                          className="progress-fill-modal"
                          style={{ width: `${task.progress}%` }}
                        ></div>
                      </div>
                      <span>{task.progress}%</span>
                    </div>
                  )}
                </div>

                {/* Assigned Date */}
                <div className="form-group">
                  <label>Assigned Date</label>
                  <div className="form-value">{formatDate(task.assigned_date)}</div>
                </div>

                {/* Due Date */}
                <div className="form-group">
                  <label>Due Date</label>
                  {editMode ? (
                    <input
                      type="date"
                      value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">
                      {formatDate(task.due_date)}
                      {isOverdue(task.due_date, task.status) && (
                        <span className="overdue-text"> (Overdue)</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Time Slot */}
                <div className="form-group">
                  <label>Time Slot</label>
                  {editMode ? (
                    <input
                      type="text"
                      placeholder="e.g., 9:00 AM - 11:00 AM"
                      value={formData.time_slot || ''}
                      onChange={(e) => setFormData({ ...formData, time_slot: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.time_slot || '-'}</div>
                  )}
                </div>

                {/* Completion Date */}
                {task.completion_date && (
                  <div className="form-group">
                    <label>Completion Date</label>
                    <div className="form-value">{formatDate(task.completion_date)}</div>
                  </div>
                )}

                {/* Description */}
                <div className="form-group form-group-full">
                  <label>Description</label>
                  {editMode ? (
                    <textarea
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.description || '-'}</div>
                  )}
                </div>

                {/* Resources Needed */}
                <div className="form-group form-group-full">
                  <label>Resources Needed</label>
                  {editMode ? (
                    <textarea
                      rows={3}
                      value={formData.resources_needed}
                      onChange={(e) => setFormData({ ...formData, resources_needed: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.resources_needed || '-'}</div>
                  )}
                </div>

                {/* Budget Required */}
                <div className="form-group">
                  <label>Budget Required</label>
                  {editMode ? (
                    <input
                      type="text"
                      placeholder="e.g., $5,000"
                      value={formData.budget_required}
                      onChange={(e) => setFormData({ ...formData, budget_required: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.budget_required || '-'}</div>
                  )}
                </div>

                {/* Escalation */}
                <div className="form-group">
                  <label>Escalation</label>
                  {editMode ? (
                    <input
                      type="text"
                      value={formData.escalation}
                      onChange={(e) => setFormData({ ...formData, escalation: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.escalation || '-'}</div>
                  )}
                </div>

                {/* Expected Outcome */}
                <div className="form-group form-group-full">
                  <label>Expected Outcome</label>
                  {editMode ? (
                    <textarea
                      rows={3}
                      value={formData.expected_outcome}
                      onChange={(e) => setFormData({ ...formData, expected_outcome: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.expected_outcome || '-'}</div>
                  )}
                </div>

                {/* Lessons Learned */}
                <div className="form-group form-group-full">
                  <label>Lessons Learned</label>
                  {editMode ? (
                    <textarea
                      rows={3}
                      value={formData.lessons_learned}
                      onChange={(e) => setFormData({ ...formData, lessons_learned: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.lessons_learned || '-'}</div>
                  )}
                </div>

                {/* Next Steps */}
                <div className="form-group form-group-full">
                  <label>Next Steps</label>
                  {editMode ? (
                    <textarea
                      rows={3}
                      value={formData.next_steps}
                      onChange={(e) => setFormData({ ...formData, next_steps: e.target.value })}
                    />
                  ) : (
                    <div className="form-value">{task.next_steps || '-'}</div>
                  )}
                </div>

                {/* Metadata */}
                <div className="form-group">
                  <label>Created By</label>
                  <div className="form-value">{task.createdByName}</div>
                </div>

                {task.lastUpdatedByName && (
                  <div className="form-group">
                    <label>Last Updated By</label>
                    <div className="form-value">
                      {task.lastUpdatedByName}
                      <br />
                      <small>{formatDateTime(task.updated_at)}</small>
                    </div>
                  </div>
                )}
              </div>

              {editMode && (
                <div className="form-actions">
                  <button className="btn-save" onClick={handleSave}>
                    💾 Save Changes
                  </button>
                  <button className="btn-cancel" onClick={() => {
                    setEditMode(false);
                    setFormData(task);
                  }}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && (
            <div className="comments-tab">
              {/* Add New Comment */}
              <div className="add-comment-section">
                <h3>Add Comment</h3>
                <textarea
                  className="comment-input"
                  rows={3}
                  placeholder="Write your comment here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  className="btn-add-comment"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  💬 Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="comments-list">
                <h3>Comments History ({comments.length})</h3>
                
                {comments.length === 0 ? (
                  <div className="no-comments">No comments yet. Be the first to comment!</div>
                ) : (
                  <>
                    {/* Latest Comment */}
                    {latestComment && (
                      <div className="comment-item comment-latest">
                        <div className="comment-header">
                          <span className="comment-author">{latestComment.userName}</span>
                          <span className="comment-time">{formatDateTime(latestComment.created_at)}</span>
                        </div>
                        <div className="comment-body">{latestComment.comment}</div>
                      </div>
                    )}

                    {/* Previous Comments (Collapsible) */}
                    {olderComments.length > 0 && (
                      <>
                        <button
                          className="btn-toggle-comments"
                          onClick={() => setShowAllComments(!showAllComments)}
                        >
                          {showAllComments ? '▲' : '▼'} 
                          {showAllComments 
                            ? 'Hide previous comments' 
                            : `Show ${olderComments.length} previous comment${olderComments.length > 1 ? 's' : ''}`
                          }
                        </button>

                        {showAllComments && (
                          <div className="previous-comments">
                            {olderComments.map(comment => (
                              <div key={comment.id} className="comment-item">
                                <div className="comment-header">
                                  <span className="comment-author">{comment.userName}</span>
                                  <span className="comment-time">{formatDateTime(comment.created_at)}</span>
                                </div>
                                <div className="comment-body">{comment.comment}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Dependencies Tab */}
          {activeTab === 'dependencies' && (
            <div className="dependencies-tab">
              <h3>Task Dependencies</h3>
              {dependencies.length === 0 ? (
                <div className="no-dependencies">No dependencies set for this task.</div>
              ) : (
                <div className="dependencies-list">
                  {dependencies.map(dep => (
                    <div key={dep.id} className="dependency-item">
                      <div className="dependency-info">
                        {dep.dependsOnUserName && (
                          <div>👤 Depends on: <strong>{dep.dependsOnUserName}</strong></div>
                        )}
                        {dep.dependsOnTaskTitle && (
                          <div>📋 Related task: <strong>{dep.dependsOnTaskTitle}</strong></div>
                        )}
                        {dep.description && (
                          <div className="dependency-description">{dep.description}</div>
                        )}
                      </div>
                      <span className={`dependency-status status-${dep.status}`}>
                        {dep.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;

