import React, { useState, useEffect } from 'react';
import '../styles/Calendar.css';

interface Task {
  id: number;
  action_id: string;
  title: string;
  priority: string;
  status: string;
  due_date: string | null;
  assignedToName: string;
}

const Calendar: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/tasks', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.filter((t: Task) => t.due_date));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const taskDate = new Date(task.due_date).toISOString().split('T')[0];
      return taskDate === dateStr;
    });
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getWeekDays = (date: Date) => {
    const days: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    
    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#f56565';
      case 'medium': return '#ed8936';
      case 'low': return '#48bb78';
      default: return '#a0aec0';
    }
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="calendar-page">
      <div className="calendar-header">
        <div>
          <h1>Task Calendar</h1>
          <p className="calendar-subtitle">Plan and visualize your tasks</p>
        </div>
        <div className="calendar-controls">
          <div className="view-mode-selector">
            <button
              className={viewMode === 'day' ? 'active' : ''}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={viewMode === 'week' ? 'active' : ''}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
            <button
              className={viewMode === 'month' ? 'active' : ''}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
          </div>
        </div>
      </div>

      <div className="calendar-navigation">
        <button
          className="nav-btn"
          onClick={() => {
            if (viewMode === 'month') navigateMonth(-1);
            else if (viewMode === 'week') navigateWeek(-1);
            else navigateDay(-1);
          }}
        >
          ◀ Previous
        </button>
        <h2 className="calendar-title">
          {viewMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
          {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString()}`}
          {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </h2>
        <button
          className="nav-btn"
          onClick={() => {
            if (viewMode === 'month') navigateMonth(1);
            else if (viewMode === 'week') navigateWeek(1);
            else navigateDay(1);
          }}
        >
          Next ▶
        </button>
      </div>

      {/* Month View */}
      {viewMode === 'month' && (
        <div className="calendar-grid month-view">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
          </div>
          <div className="calendar-days">
            {getDaysInMonth(currentDate).map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="calendar-day empty"></div>;
              }

              const dayTasks = getTasksForDate(date);
              
              return (
                <div
                  key={index}
                  className={`calendar-day ${isToday(date) ? 'today' : ''} ${isSelected(date) ? 'selected' : ''}`}
                  onClick={() => setSelectedDate(date)}
                >
                  <div className="day-number">{date.getDate()}</div>
                  <div className="day-tasks">
                    {dayTasks.slice(0, 3).map(task => (
                      <div
                        key={task.id}
                        className="task-pill"
                        style={{ borderLeftColor: getPriorityColor(task.priority) }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="more-tasks">+{dayTasks.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === 'week' && (
        <div className="calendar-grid week-view">
          {getWeekDays(currentDate).map((date, index) => {
            const dayTasks = getTasksForDate(date);
            
            return (
              <div key={index} className={`week-day ${isToday(date) ? 'today' : ''}`}>
                <div className="week-day-header">
                  <div className="week-day-name">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="week-day-number">{date.getDate()}</div>
                </div>
                <div className="week-day-tasks">
                  {dayTasks.map(task => (
                    <div
                      key={task.id}
                      className="task-card-small"
                      style={{ borderLeftColor: getPriorityColor(task.priority) }}
                    >
                      <div className="task-card-title">{task.title}</div>
                      <div className="task-card-meta">
                        <span className={`status-badge status-${task.status}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                  {dayTasks.length === 0 && (
                    <div className="no-tasks-day">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && (
        <div className="day-view">
          <div className="day-view-tasks">
            {getTasksForDate(currentDate).map(task => (
              <div
                key={task.id}
                className="task-card-full"
                style={{ borderLeftColor: getPriorityColor(task.priority) }}
              >
                <div className="task-card-header">
                  <h3>{task.title}</h3>
                  <span className={`priority-badge priority-${task.priority}`}>
                    {task.priority}
                  </span>
                </div>
                <div className="task-card-body">
                  <div className="task-meta-item">
                    <span className="meta-label">ID:</span>
                    <span>{task.action_id}</span>
                  </div>
                  <div className="task-meta-item">
                    <span className="meta-label">Owner:</span>
                    <span>{task.assignedToName}</span>
                  </div>
                  <div className="task-meta-item">
                    <span className="meta-label">Status:</span>
                    <span className={`status-badge status-${task.status}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {getTasksForDate(currentDate).length === 0 && (
              <div className="no-tasks-message">
                <p>No tasks scheduled for this day</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Date Details */}
      {selectedDate && viewMode === 'month' && (
        <div className="selected-date-panel">
          <div className="panel-header">
            <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            <button className="btn-close-panel" onClick={() => setSelectedDate(null)}>✕</button>
          </div>
          <div className="panel-tasks">
            {getTasksForDate(selectedDate).map(task => (
              <div
                key={task.id}
                className="panel-task"
                style={{ borderLeftColor: getPriorityColor(task.priority) }}
              >
                <div className="panel-task-title">{task.title}</div>
                <div className="panel-task-meta">
                  <span className={`status-badge status-${task.status}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <span className="panel-task-owner">{task.assignedToName}</span>
                </div>
              </div>
            ))}
            {getTasksForDate(selectedDate).length === 0 && (
              <div className="no-tasks-message">No tasks for this date</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;

