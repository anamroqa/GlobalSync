const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'globalsync-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database(path.join(__dirname, '../globalsync.db'), (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initDatabase();
  }
});

// Initialize database tables
function initDatabase() {
  db.serialize(() => {
    // Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'team_member',
      region TEXT,
      status TEXT DEFAULT 'active',
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )`);

    // Tasks table
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      assigned_to_id INTEGER NOT NULL,
      created_by_id INTEGER NOT NULL,
      priority TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'not_started',
      due_date DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      category TEXT,
      FOREIGN KEY (assigned_to_id) REFERENCES users(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )`);

    // Task comments table
    db.run(`CREATE TABLE IF NOT EXISTS task_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Announcements table
    db.run(`CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      created_by_id INTEGER NOT NULL,
      priority TEXT DEFAULT 'normal',
      target_role TEXT,
      target_region TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    )`);

    // Activity log table
    db.run(`CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`, () => {
      // Create default admin user
      createDefaultUsers();
    });
  });
}

// Create default users for testing
function createDefaultUsers() {
  const defaultPassword = bcrypt.hashSync('password123', 10);
  
  const users = [
    { username: 'abdallah', email: 'abdallah@company.com', full_name: 'Abdallah', role: 'manager', region: 'Global' },
    { username: 'cagdas', email: 'cagdas@company.com', full_name: 'Cagdas', role: 'core_team', region: 'Middle East' },
    { username: 'maryam', email: 'maryam@company.com', full_name: 'Maryam', role: 'core_team', region: 'UK' },
    { username: 'sena', email: 'sena@company.com', full_name: 'Sena', role: 'core_team', region: 'Europe' },
    { username: 'ayse', email: 'ayse@company.com', full_name: 'Ayse', role: 'team_member', region: 'Turkey' }
  ];

  users.forEach(user => {
    db.run(
      `INSERT OR IGNORE INTO users (username, email, password, full_name, role, region) VALUES (?, ?, ?, ?, ?, ?)`,
      [user.username, user.email, defaultPassword, user.full_name, user.role, user.region]
    );
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ===== AUTH ROUTES =====

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (bcrypt.compareSync(password, user.password)) {
      // Update last login
      db.run('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

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
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, full_name, role, region, status, avatar_url FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        region: user.region,
        status: user.status,
        avatarUrl: user.avatar_url
      });
    }
  );
});

// ===== USER ROUTES =====

// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, email, full_name, role, region, status, avatar_url FROM users ORDER BY full_name',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        fullName: u.full_name,
        role: u.role,
        region: u.region,
        status: u.status,
        avatarUrl: u.avatar_url
      })));
    }
  );
});

// ===== TASK ROUTES =====

// Get all tasks (with filtering)
app.get('/api/tasks', authenticateToken, (req, res) => {
  const { assignedTo, status, priority } = req.query;
  
  let query = `
    SELECT t.*, 
           u1.full_name as assigned_to_name, u1.username as assigned_to_username,
           u2.full_name as created_by_name, u2.username as created_by_username
    FROM tasks t
    JOIN users u1 ON t.assigned_to_id = u1.id
    JOIN users u2 ON t.created_by_id = u2.id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (assignedTo) {
    query += ' AND t.assigned_to_id = ?';
    params.push(assignedTo);
  }
  if (status) {
    query += ' AND t.status = ?';
    params.push(status);
  }
  if (priority) {
    query += ' AND t.priority = ?';
    params.push(priority);
  }
  
  query += ' ORDER BY t.created_at DESC';
  
  db.all(query, params, (err, tasks) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(tasks.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      assignedToId: t.assigned_to_id,
      assignedToName: t.assigned_to_name,
      assignedToUsername: t.assigned_to_username,
      createdById: t.created_by_id,
      createdByName: t.created_by_name,
      createdByUsername: t.created_by_username,
      priority: t.priority,
      status: t.status,
      dueDate: t.due_date,
      completedAt: t.completed_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      category: t.category
    })));
  });
});

// Create task
app.post('/api/tasks', authenticateToken, (req, res) => {
  const { title, description, assignedToId, priority, dueDate, category } = req.body;
  
  db.run(
    `INSERT INTO tasks (title, description, assigned_to_id, created_by_id, priority, due_date, category)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, assignedToId, req.user.id, priority || 'medium', dueDate, category],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Log activity
      db.run(
        `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, 'task_created', 'task', this.lastID, JSON.stringify({ title })]
      );
      
      res.json({ id: this.lastID, message: 'Task created successfully' });
    }
  );
});

// Update task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { title, description, assignedToId, priority, status, dueDate, category } = req.body;
  
  const updates = [];
  const params = [];
  
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (assignedToId !== undefined) { updates.push('assigned_to_id = ?'); params.push(assignedToId); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  if (status !== undefined) { 
    updates.push('status = ?'); 
    params.push(status);
    if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }
  }
  if (dueDate !== undefined) { updates.push('due_date = ?'); params.push(dueDate); }
  if (category !== undefined) { updates.push('category = ?'); params.push(category); }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(id);
  
  db.run(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      // Log activity
      db.run(
        `INSERT INTO activity_log (user_id, action, entity_type, entity_id, details)
         VALUES (?, ?, ?, ?, ?)`,
        [req.user.id, 'task_updated', 'task', id, JSON.stringify({ status })]
      );
      
      res.json({ message: 'Task updated successfully' });
    }
  );
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM tasks WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json({ message: 'Task deleted successfully' });
  });
});

// Get task comments
app.get('/api/tasks/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.all(
    `SELECT tc.*, u.full_name, u.username
     FROM task_comments tc
     JOIN users u ON tc.user_id = u.id
     WHERE tc.task_id = ?
     ORDER BY tc.created_at DESC`,
    [id],
    (err, comments) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(comments.map(c => ({
        id: c.id,
        taskId: c.task_id,
        userId: c.user_id,
        userName: c.full_name,
        username: c.username,
        comment: c.comment,
        createdAt: c.created_at
      })));
    }
  );
});

// Add task comment
app.post('/api/tasks/:id/comments', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  
  db.run(
    `INSERT INTO task_comments (task_id, user_id, comment) VALUES (?, ?, ?)`,
    [id, req.user.id, comment],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Comment added successfully' });
    }
  );
});

// ===== ANNOUNCEMENT ROUTES =====

// Get announcements
app.get('/api/announcements', authenticateToken, (req, res) => {
  db.all(
    `SELECT a.*, u.full_name as created_by_name
     FROM announcements a
     JOIN users u ON a.created_by_id = u.id
     WHERE (a.expires_at IS NULL OR a.expires_at > CURRENT_TIMESTAMP)
     ORDER BY a.created_at DESC
     LIMIT 20`,
    (err, announcements) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(announcements.map(a => ({
        id: a.id,
        title: a.title,
        message: a.message,
        createdById: a.created_by_id,
        createdByName: a.created_by_name,
        priority: a.priority,
        targetRole: a.target_role,
        targetRegion: a.target_region,
        createdAt: a.created_at,
        expiresAt: a.expires_at
      })));
    }
  );
});

// Create announcement
app.post('/api/announcements', authenticateToken, (req, res) => {
  const { title, message, priority, targetRole, targetRegion, expiresAt } = req.body;
  
  db.run(
    `INSERT INTO announcements (title, message, created_by_id, priority, target_role, target_region, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, message, req.user.id, priority || 'normal', targetRole, targetRegion, expiresAt],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'Announcement created successfully' });
    }
  );
});

// ===== DASHBOARD/STATS ROUTES =====

// Get dashboard stats
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  const stats = {};
  
  // Total tasks by status
  db.all(
    `SELECT status, COUNT(*) as count FROM tasks GROUP BY status`,
    (err, statusCounts) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      
      stats.tasksByStatus = statusCounts.reduce((acc, row) => {
        acc[row.status] = row.count;
        return acc;
      }, {});
      
      // Overdue tasks
      db.get(
        `SELECT COUNT(*) as count FROM tasks 
         WHERE status != 'completed' AND due_date < datetime('now')`,
        (err, overdue) => {
          if (err) return res.status(500).json({ error: 'Database error' });
          
          stats.overdueTasks = overdue.count;
          
          // Tasks by priority
          db.all(
            `SELECT priority, COUNT(*) as count FROM tasks 
             WHERE status != 'completed' GROUP BY priority`,
            (err, priorityCounts) => {
              if (err) return res.status(500).json({ error: 'Database error' });
              
              stats.tasksByPriority = priorityCounts.reduce((acc, row) => {
                acc[row.priority] = row.count;
                return acc;
              }, {});
              
              // Team member task counts
              db.all(
                `SELECT u.id, u.full_name, u.username, u.role, u.region, u.status,
                        COUNT(t.id) as task_count,
                        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed_count,
                        SUM(CASE WHEN t.due_date < datetime('now') AND t.status != 'completed' THEN 1 ELSE 0 END) as overdue_count
                 FROM users u
                 LEFT JOIN tasks t ON u.id = t.assigned_to_id
                 GROUP BY u.id
                 ORDER BY u.full_name`,
                (err, teamStats) => {
                  if (err) return res.status(500).json({ error: 'Database error' });
                  
                  stats.teamMembers = teamStats.map(t => ({
                    id: t.id,
                    fullName: t.full_name,
                    username: t.username,
                    role: t.role,
                    region: t.region,
                    status: t.status,
                    taskCount: t.task_count,
                    completedCount: t.completed_count,
                    overdueCount: t.overdue_count
                  }));
                  
                  res.json(stats);
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get recent activity
app.get('/api/activity', authenticateToken, (req, res) => {
  db.all(
    `SELECT al.*, u.full_name, u.username
     FROM activity_log al
     JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC
     LIMIT 20`,
    (err, activities) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(activities.map(a => ({
        id: a.id,
        userId: a.user_id,
        userName: a.full_name,
        username: a.username,
        action: a.action,
        entityType: a.entity_type,
        entityId: a.entity_id,
        details: a.details,
        createdAt: a.created_at
      })));
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`GlobalSync server running on http://localhost:${PORT}`);
  console.log('Default login credentials:');
  console.log('  Manager: abdallah / password123');
  console.log('  Team: cagdas, maryam, sena, ayse / password123');
});

