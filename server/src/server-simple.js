const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'globalsync-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Simple JSON file-based database (works on all platforms without compilation)
const DB_PATH = path.join(__dirname, '../database.json');

// Initialize database structure
let db = {
  users: [],
  tasks: [],
  announcements: [],
  comments: [],
  activity: []
};

// Load database from file
function loadDatabase() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      db = JSON.parse(data);
      console.log('Database loaded from file');
    } else {
      console.log('Creating new database');
      initializeDefaultData();
      saveDatabase();
    }
  } catch (error) {
    console.error('Error loading database:', error);
    initializeDefaultData();
    saveDatabase();
  }
}

// Save database to file
function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize with default users and data
async function initializeDefaultData() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  db.users = [
    {
      id: 1,
      username: 'abdallah',
      email: 'abdallah@globalsync.com',
      password: hashedPassword,
      full_name: 'Abdallah',
      role: 'manager',
      region: 'Global',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      username: 'cagdas',
      email: 'cagdas@globalsync.com',
      password: hashedPassword,
      full_name: 'Cagdas',
      role: 'core_team',
      region: 'Middle East',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      username: 'maryam',
      email: 'maryam@globalsync.com',
      password: hashedPassword,
      full_name: 'Maryam',
      role: 'core_team',
      region: 'UK',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 4,
      username: 'sena',
      email: 'sena@globalsync.com',
      password: hashedPassword,
      full_name: 'Sena',
      role: 'core_team',
      region: 'Europe',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 5,
      username: 'ayse',
      email: 'ayse@globalsync.com',
      password: hashedPassword,
      full_name: 'Ayse',
      role: 'team_member',
      region: 'Turkey',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ];

  db.tasks = [
    {
      id: 1,
      title: 'Welcome to GlobalSync',
      description: 'This is a sample task. Click on Tasks to create more!',
      assigned_to_id: 2,
      created_by_id: 1,
      priority: 'medium',
      status: 'not_started',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: 'Onboarding',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  db.announcements = [
    {
      id: 1,
      title: 'Welcome to GlobalSync!',
      message: 'This is your team management hub. Start by creating tasks and coordinating with your team.',
      created_by_id: 1,
      priority: 'normal',
      created_at: new Date().toISOString()
    }
  ];
}

// Helper functions
function getNextId(collection) {
  if (db[collection].length === 0) return 1;
  return Math.max(...db[collection].map(item => item.id)) + 1;
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Routes

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = db.users.find(u => u.username === username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    user.last_login_at = new Date().toISOString();
    saveDatabase();

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        region: user.region,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    region: user.region,
    status: user.status
  });
});

// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
  const users = db.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    fullName: u.full_name,
    role: u.role,
    region: u.region,
    status: u.status
  }));
  res.json(users);
});

// Get all tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
  const tasks = db.tasks.map(task => {
    const assignedTo = db.users.find(u => u.id === task.assigned_to_id);
    const createdBy = db.users.find(u => u.id === task.created_by_id);
    
    return {
      ...task,
      assignedToName: assignedTo ? assignedTo.full_name : 'Unknown',
      createdByName: createdBy ? createdBy.full_name : 'Unknown'
    };
  });
  
  res.json(tasks);
});

// Create task
app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const { title, description, assignedToId, priority, dueDate, category } = req.body;
    
    const newTask = {
      id: getNextId('tasks'),
      title,
      description: description || '',
      assigned_to_id: assignedToId,
      created_by_id: req.user.id,
      priority: priority || 'medium',
      status: 'not_started',
      due_date: dueDate || null,
      category: category || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tasks.push(newTask);
    saveDatabase();

    // Add activity log
    db.activity.push({
      id: getNextId('activity'),
      user_id: req.user.id,
      action: 'created_task',
      entity_type: 'task',
      entity_id: newTask.id,
      details: `Created task: ${title}`,
      created_at: new Date().toISOString()
    });
    saveDatabase();

    res.status(201).json(newTask);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const taskIndex = db.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updates = req.body;
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    if (updates.status === 'completed') {
      db.tasks[taskIndex].completed_at = new Date().toISOString();
    }

    saveDatabase();

    // Add activity log
    db.activity.push({
      id: getNextId('activity'),
      user_id: req.user.id,
      action: 'updated_task',
      entity_type: 'task',
      entity_id: taskId,
      details: `Updated task status to: ${updates.status || 'modified'}`,
      created_at: new Date().toISOString()
    });
    saveDatabase();

    res.json(db.tasks[taskIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
  const announcements = db.announcements
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 20)
    .map(ann => {
      const createdBy = db.users.find(u => u.id === ann.created_by_id);
      return {
        ...ann,
        createdByName: createdBy ? createdBy.full_name : 'Unknown'
      };
    });
  
  res.json(announcements);
});

// Create announcement
app.post('/api/announcements', authenticateToken, (req, res) => {
  try {
    const { title, message, priority } = req.body;
    
    const newAnnouncement = {
      id: getNextId('announcements'),
      title,
      message,
      created_by_id: req.user.id,
      priority: priority || 'normal',
      created_at: new Date().toISOString()
    };

    db.announcements.push(newAnnouncement);
    saveDatabase();

    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    // Task statistics
    const tasksByStatus = {
      not_started: db.tasks.filter(t => t.status === 'not_started').length,
      in_progress: db.tasks.filter(t => t.status === 'in_progress').length,
      completed: db.tasks.filter(t => t.status === 'completed').length,
      blocked: db.tasks.filter(t => t.status === 'blocked').length
    };

    const tasksByPriority = {
      high: db.tasks.filter(t => t.priority === 'high').length,
      medium: db.tasks.filter(t => t.priority === 'medium').length,
      low: db.tasks.filter(t => t.priority === 'low').length
    };

    // Overdue tasks
    const now = new Date();
    const overdueTasks = db.tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < now && 
      t.status !== 'completed'
    ).length;

    // Team member statistics
    const teamMembers = db.users.map(user => {
      const userTasks = db.tasks.filter(t => t.assigned_to_id === user.id);
      const completedTasks = userTasks.filter(t => t.status === 'completed');
      const overdueTasks = userTasks.filter(t => 
        t.due_date && 
        new Date(t.due_date) < now && 
        t.status !== 'completed'
      );

      return {
        id: user.id,
        fullName: user.full_name,
        username: user.username,
        role: user.role,
        region: user.region,
        status: user.status,
        taskCount: userTasks.length,
        completedCount: completedTasks.length,
        overdueCount: overdueTasks.length
      };
    });

    res.json({
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      teamMembers
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activity log
app.get('/api/activity', authenticateToken, (req, res) => {
  const activities = db.activity
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50)
    .map(act => {
      const user = db.users.find(u => u.id === act.user_id);
      return {
        ...act,
        userName: user ? user.full_name : 'Unknown'
      };
    });
  
  res.json(activities);
});

// Start server
loadDatabase();

app.listen(PORT, () => {
  console.log(`\nGlobalSync server running on http://localhost:${PORT}`);
  console.log('\nDefault login credentials:');
  console.log('  Manager: abdallah / password123');
  console.log('  Team: cagdas, maryam, sena, ayse / password123\n');
});

