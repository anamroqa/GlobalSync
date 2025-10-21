import React, { useState } from 'react';
import '../styles/TaskModal.css';

interface User {
  id: number;
  fullName: string;
}

interface Props {
  onClose: () => void;
  onSave: () => void;
  users: User[];
}

const TaskModal: React.FC<Props> = ({ onClose, onSave, users }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedToId: users.length > 0 ? users[0].id : 0,
    priority: 'medium',
    dueDate: '',
    timeSlot: '',
    category: '',
    resourcesNeeded: '',
    budgetRequired: '',
    expectedOutcome: '',
    escalation: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.assignedToId) {
      newErrors.assignedToId = 'Please select an owner';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSave();
      } else {
        alert('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content task-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Task</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              {/* Title */}
              <div className="form-group form-group-full">
                <label>Task Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter task title"
                  className={errors.title ? 'input-error' : ''}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              {/* Category */}
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Marketing, Sales, Development"
                />
              </div>

              {/* Priority */}
              <div className="form-group">
                <label>Priority *</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              {/* Owner */}
              <div className="form-group">
                <label>Assign To *</label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: parseInt(e.target.value) })}
                  className={errors.assignedToId ? 'input-error' : ''}
                >
                  <option value={0}>Select owner...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.fullName}</option>
                  ))}
                </select>
                {errors.assignedToId && <span className="error-text">{errors.assignedToId}</span>}
              </div>

              {/* Due Date */}
              <div className="form-group">
                <label>Due Date *</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className={errors.dueDate ? 'input-error' : ''}
                />
                {errors.dueDate && <span className="error-text">{errors.dueDate}</span>}
              </div>

              {/* Time Slot */}
              <div className="form-group">
                <label>Time Slot</label>
                <input
                  type="text"
                  value={formData.timeSlot}
                  onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                  placeholder="e.g., 9:00 AM - 11:00 AM"
                />
              </div>

              {/* Escalation */}
              <div className="form-group">
                <label>Escalation</label>
                <input
                  type="text"
                  value={formData.escalation}
                  onChange={(e) => setFormData({ ...formData, escalation: e.target.value })}
                  placeholder="Who to escalate to if needed"
                />
              </div>

              {/* Budget */}
              <div className="form-group">
                <label>Budget Required</label>
                <input
                  type="text"
                  value={formData.budgetRequired}
                  onChange={(e) => setFormData({ ...formData, budgetRequired: e.target.value })}
                  placeholder="e.g., $5,000"
                />
              </div>

              {/* Description */}
              <div className="form-group form-group-full">
                <label>Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the task"
                />
              </div>

              {/* Resources Needed */}
              <div className="form-group form-group-full">
                <label>Resources Needed</label>
                <textarea
                  rows={3}
                  value={formData.resourcesNeeded}
                  onChange={(e) => setFormData({ ...formData, resourcesNeeded: e.target.value })}
                  placeholder="List resources, tools, or support needed"
                />
              </div>

              {/* Expected Outcome */}
              <div className="form-group form-group-full">
                <label>Expected Outcome</label>
                <textarea
                  rows={3}
                  value={formData.expectedOutcome}
                  onChange={(e) => setFormData({ ...formData, expectedOutcome: e.target.value })}
                  placeholder="What should be achieved when this task is completed?"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-create">
              ➕ Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;

