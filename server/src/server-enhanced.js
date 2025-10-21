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

// Simple JSON file-based database
const DB_PATH = path.join(__dirname, '../database.json');

// Initialize database structure with enhanced fields
let db = {
  users: [],
  tasks: [],
  announcements: [],
  comments: [],
  activity: [],
  dependencies: []
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

  db.tasks = [];
  db.announcements = [];
  db.comments = [];
  db.dependencies = [];
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

// Create user (admin only)
app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { username, email, fullName, password, role, region } = req.body;
    
    // Check if user exists
    if (db.users.find(u => u.username === username || u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      id: getNextId('users'),
      username,
      email,
      password: hashedPassword,
      full_name: fullName,
      role: role || 'team_member',
      region: region || '',
      status: 'active',
      created_at: new Date().toISOString()
    };

    db.users.push(newUser);
    saveDatabase();

    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.full_name,
      role: newUser.role,
      region: newUser.region,
      status: newUser.status
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const userId = parseInt(req.params.id);
    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, fullName, role, region, status, password } = req.body;
    
    if (email) db.users[userIndex].email = email;
    if (fullName) db.users[userIndex].full_name = fullName;
    if (role) db.users[userIndex].role = role;
    if (region !== undefined) db.users[userIndex].region = region;
    if (status) db.users[userIndex].status = status;
    
    if (password) {
      db.users[userIndex].password = await bcrypt.hash(password, 10);
    }

    saveDatabase();

    res.json({
      id: db.users[userIndex].id,
      username: db.users[userIndex].username,
      email: db.users[userIndex].email,
      fullName: db.users[userIndex].full_name,
      role: db.users[userIndex].role,
      region: db.users[userIndex].region,
      status: db.users[userIndex].status
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const userId = parseInt(req.params.id);
    
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const userIndex = db.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.users.splice(userIndex, 1);
    saveDatabase();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tasks with enhanced fields
app.get('/api/tasks', authenticateToken, (req, res) => {
  const { status, priority, owner, search } = req.query;
  
  let tasks = db.tasks.map(task => {
    const assignedTo = db.users.find(u => u.id === task.assigned_to_id);
    const createdBy = db.users.find(u => u.id === task.created_by_id);
    const lastUpdatedBy = task.last_updated_by_id ? db.users.find(u => u.id === task.last_updated_by_id) : null;
    
    // Get task dependencies
    const taskDependencies = db.dependencies
      .filter(d => d.task_id === task.id)
      .map(d => {
        const depUser = db.users.find(u => u.id === d.depends_on_user_id);
        const depTask = db.tasks.find(t => t.id === d.depends_on_task_id);
        return {
          id: d.id,
          dependsOnUserId: d.depends_on_user_id,
          dependsOnUserName: depUser ? depUser.full_name : null,
          dependsOnTaskId: d.depends_on_task_id,
          dependsOnTaskTitle: depTask ? depTask.title : null,
          description: d.description,
          status: d.status
        };
      });
    
    return {
      ...task,
      assignedToName: assignedTo ? assignedTo.full_name : 'Unknown',
      createdByName: createdBy ? createdBy.full_name : 'Unknown',
      lastUpdatedByName: lastUpdatedBy ? lastUpdatedBy.full_name : null,
      dependencies: taskDependencies
    };
  });

  // Apply filters
  if (status && status !== 'all') {
    tasks = tasks.filter(t => t.status === status);
  }
  if (priority && priority !== 'all') {
    tasks = tasks.filter(t => t.priority === priority);
  }
  if (owner) {
    const ownerId = parseInt(owner);
    tasks = tasks.filter(t => t.assigned_to_id === ownerId);
  }
  if (search) {
    const searchLower = search.toLowerCase();
    tasks = tasks.filter(t => 
      t.title.toLowerCase().includes(searchLower) ||
      (t.description && t.description.toLowerCase().includes(searchLower)) ||
      (t.category && t.category.toLowerCase().includes(searchLower))
    );
  }
  
  res.json(tasks);
});

// Create task with all enhanced fields
app.post('/api/tasks', authenticateToken, (req, res) => {
  try {
    const {
      title,
      description,
      assignedToId,
      priority,
      dueDate,
      timeSlot,
      category,
      resourcesNeeded,
      budgetRequired,
      expectedOutcome,
      escalation
    } = req.body;
    
    const newTask = {
      id: getNextId('tasks'),
      action_id: `ACT-${String(getNextId('tasks')).padStart(4, '0')}`,
      title,
      description: description || '',
      assigned_to_id: assignedToId,
      created_by_id: req.user.id,
      priority: priority || 'medium',
      status: 'not_started',
      progress: 0,
      due_date: dueDate || null,
      assigned_date: new Date().toISOString(),
      time_slot: timeSlot || null,
      category: category || '',
      resources_needed: resourcesNeeded || '',
      budget_required: budgetRequired || '',
      expected_outcome: expectedOutcome || '',
      escalation: escalation || '',
      completion_date: null,
      lessons_learned: '',
      next_steps: '',
      last_updated_by_id: req.user.id,
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
    console.error('Error creating task:', error);
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
      last_updated_by_id: req.user.id,
      updated_at: new Date().toISOString()
    };

    if (updates.status === 'completed' && !db.tasks[taskIndex].completion_date) {
      db.tasks[taskIndex].completion_date = new Date().toISOString();
      db.tasks[taskIndex].progress = 100;
    }

    saveDatabase();

    // Add activity log
    db.activity.push({
      id: getNextId('activity'),
      user_id: req.user.id,
      action: 'updated_task',
      entity_type: 'task',
      entity_id: taskId,
      details: `Updated task`,
      created_at: new Date().toISOString()
    });
    saveDatabase();

    res.json(db.tasks[taskIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get task comments
app.get('/api/tasks/:id/comments', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  
  const comments = db.comments
    .filter(c => c.task_id === taskId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(comment => {
      const user = db.users.find(u => u.id === comment.user_id);
      return {
        ...comment,
        userName: user ? user.full_name : 'Unknown'
      };
    });
  
  res.json(comments);
});

// Add task comment
app.post('/api/tasks/:id/comments', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { comment } = req.body;
    
    const newComment = {
      id: getNextId('comments'),
      task_id: taskId,
      user_id: req.user.id,
      comment,
      created_at: new Date().toISOString()
    };

    db.comments.push(newComment);
    saveDatabase();

    const user = db.users.find(u => u.id === req.user.id);
    res.status(201).json({
      ...newComment,
      userName: user ? user.full_name : 'Unknown'
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get task dependencies
app.get('/api/tasks/:id/dependencies', authenticateToken, (req, res) => {
  const taskId = parseInt(req.params.id);
  
  const dependencies = db.dependencies
    .filter(d => d.task_id === taskId)
    .map(dep => {
      const user = dep.depends_on_user_id ? db.users.find(u => u.id === dep.depends_on_user_id) : null;
      const task = dep.depends_on_task_id ? db.tasks.find(t => t.id === dep.depends_on_task_id) : null;
      
      return {
        ...dep,
        dependsOnUserName: user ? user.full_name : null,
        dependsOnTaskTitle: task ? task.title : null
      };
    });
  
  res.json(dependencies);
});

// Add task dependency
app.post('/api/tasks/:id/dependencies', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { dependsOnUserId, dependsOnTaskId, description } = req.body;
    
    const newDependency = {
      id: getNextId('dependencies'),
      task_id: taskId,
      depends_on_user_id: dependsOnUserId || null,
      depends_on_task_id: dependsOnTaskId || null,
      description: description || '',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    db.dependencies.push(newDependency);
    saveDatabase();

    res.status(201).json(newDependency);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update dependency status
app.put('/api/dependencies/:id', authenticateToken, (req, res) => {
  try {
    const depId = parseInt(req.params.id);
    const depIndex = db.dependencies.findIndex(d => d.id === depId);
    
    if (depIndex === -1) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    const { status } = req.body;
    db.dependencies[depIndex].status = status;
    db.dependencies[depIndex].updated_at = new Date().toISOString();
    
    saveDatabase();

    res.json(db.dependencies[depIndex]);
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

    const now = new Date();
    const overdueTasks = db.tasks.filter(t => 
      t.due_date && 
      new Date(t.due_date) < now && 
      t.status !== 'completed'
    ).length;

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

// Get user's personal tasks (including dependencies)
app.get('/api/users/:id/tasks', authenticateToken, (req, res) => {
  const userId = parseInt(req.params.id);
  
  // Tasks assigned to user
  const assignedTasks = db.tasks.filter(t => t.assigned_to_id === userId);
  
  // Tasks where user is a dependency
  const dependencyTaskIds = db.dependencies
    .filter(d => d.depends_on_user_id === userId)
    .map(d => d.task_id);
  
  const dependencyTasks = db.tasks.filter(t => dependencyTaskIds.includes(t.id));
  
  const allTasks = [...new Set([...assignedTasks, ...dependencyTasks])];
  
  const tasksWithDetails = allTasks.map(task => {
    const assignedTo = db.users.find(u => u.id === task.assigned_to_id);
    const createdBy = db.users.find(u => u.id === task.created_by_id);
    
    return {
      ...task,
      assignedToName: assignedTo ? assignedTo.full_name : 'Unknown',
      createdByName: createdBy ? createdBy.full_name : 'Unknown'
    };
  });
  
  res.json(tasksWithDetails);
});

// Start server
loadDatabase();

app.listen(PORT, () => {
  console.log(`\nGlobalSync Enhanced Server running on http://localhost:${PORT}`);
  console.log('\nDefault login credentials:');
  console.log('  Manager: abdallah / password123');
  console.log('  Team: cagdas, maryam, sena, ayse / password123\n');
});

