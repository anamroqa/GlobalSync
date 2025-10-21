# GlobalSync - Team Management Hub

A simple, effective team management tool for dynamic global teams with task assignment, progress tracking, and team coordination.

## Features

### ✅ Core Functionality
- **User Authentication** - Secure login with role-based access
- **Task Management** - Create, assign, update, and track tasks
- **Team Dashboard** - Real-time overview of team performance
- **Team Directory** - View all team members and their status
- **Announcements** - Broadcast important messages to the team
- **Activity Tracking** - Monitor all team activities

### 👥 Role-Based Access
- **Manager** - Full access to create tasks, announcements, and view all team data
- **Core Team** - Can create tasks and announcements for their region
- **Team Members** - Can view and update their assigned tasks

### 📊 Dashboard Features
- Total tasks overview
- Completed tasks count
- In-progress tasks tracking
- Overdue tasks alerts
- Team member performance metrics
- Individual task counts and completion rates

## Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database (file-based, no server needed)
- **JWT** authentication
- **bcrypt** for password hashing

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Vite** for development and building
- **CSS** for styling (no framework dependencies)

## Installation & Setup

### Prerequisites
- Node.js 18+ installed
- npm or pnpm package manager

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd globalsync
npm install

# Install frontend dependencies
cd client
npm install
```

### Step 2: Start the Backend Server

```bash
# From the globalsync root directory
npm run server
```

The backend will start on `http://localhost:3001`

### Step 3: Start the Frontend

```bash
# From the globalsync/client directory
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 4: Access the Application

Open your browser and navigate to `http://localhost:5173`

## Default User Accounts

The application comes with pre-configured demo accounts:

### Manager Account
- **Username:** `abdallah`
- **Password:** `password123`
- **Role:** Manager (full access)
- **Region:** Global

### Team Accounts
- **Username:** `cagdas` | **Password:** `password123` | **Role:** Core Team | **Region:** Middle East
- **Username:** `maryam` | **Password:** `password123` | **Role:** Core Team | **Region:** UK
- **Username:** `sena` | **Password:** `password123` | **Role:** Core Team | **Region:** Europe
- **Username:** `ayse` | **Password:** `password123` | **Role:** Team Member | **Region:** Turkey

## Usage Guide

### For Managers

1. **Dashboard View**
   - See all team members and their task statistics
   - Monitor overdue tasks
   - Track team performance

2. **Create Tasks**
   - Click "+ New Task" on the Tasks page
   - Fill in title, description, assign to team member
   - Set priority (High/Medium/Low) and due date
   - Add category for organization

3. **Post Announcements**
   - Go to Team page
   - Click "📢 New Announcement"
   - Set priority (Urgent/High/Normal)
   - Message will be visible to all team members

### For Team Members

1. **View Your Tasks**
   - Dashboard shows your active tasks
   - Tasks page lists all your assignments
   - Filter by status or priority

2. **Update Task Status**
   - Click on status dropdown in any task
   - Select: Not Started → In Progress → Completed
   - Add comments to provide updates

3. **Check Announcements**
   - Team page shows all recent announcements
   - Urgent announcements highlighted in red

## Project Structure

```
globalsync/
├── server/
│   ├── src/
│   │   └── server.js          # Express server with all APIs
│   └── globalsync.db           # SQLite database (auto-created)
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx       # Login page
│   │   │   ├── Dashboard.tsx   # Manager dashboard
│   │   │   ├── Tasks.tsx       # Task management
│   │   │   └── Team.tsx        # Team directory & announcements
│   │   ├── components/
│   │   │   └── Navigation.tsx  # Top navigation bar
│   │   ├── styles/             # CSS files for each component
│   │   ├── App.tsx             # Main app with routing
│   │   └── main.tsx            # Entry point
│   └── vite.config.ts          # Vite configuration
├── package.json                # Backend dependencies
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users` - Get all team members

### Tasks
- `GET /api/tasks` - Get all tasks (with filtering)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/:id/comments` - Get task comments
- `POST /api/tasks/:id/comments` - Add comment to task

### Announcements
- `GET /api/announcements` - Get recent announcements
- `POST /api/announcements` - Create announcement

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/activity` - Get recent activity log

## Database Schema

### Users Table
- id, username, email, password, full_name
- role (manager, core_team, regional_team, team_member)
- region, status, avatar_url
- created_at, last_login_at

### Tasks Table
- id, title, description
- assigned_to_id, created_by_id
- priority (high, medium, low)
- status (not_started, in_progress, completed, blocked)
- due_date, completed_at, category
- created_at, updated_at

### Task Comments Table
- id, task_id, user_id, comment
- created_at

### Announcements Table
- id, title, message, created_by_id
- priority (urgent, high, normal)
- target_role, target_region
- created_at, expires_at

### Activity Log Table
- id, user_id, action, entity_type, entity_id
- details, created_at

## Customization

### Adding New Users

Edit `server/src/server.js` and add to the `createDefaultUsers()` function:

```javascript
{ 
  username: 'newuser', 
  email: 'newuser@company.com', 
  full_name: 'New User', 
  role: 'team_member', 
  region: 'Region Name' 
}
```

### Changing Colors/Styling

All styles are in `client/src/styles/` directory:
- `Login.css` - Login page styling
- `Navigation.css` - Top navigation bar
- `Dashboard.css` - Dashboard page
- `Tasks.css` - Tasks page
- `Team.css` - Team page

### Adding New Task Categories

Categories are free-form text fields. Common categories:
- Business Development
- Regulatory Compliance
- Marketing
- Sales
- Operations
- Strategic Planning

## Production Deployment

### Build Frontend

```bash
cd client
npm run build
```

This creates a `dist/` folder with optimized static files.

### Serve with Static Server

```bash
npm install -g serve
serve -s dist -p 5173
```

### Environment Variables

For production, consider setting:
- `JWT_SECRET` - Secure JWT secret key
- `PORT` - Backend server port (default: 3001)
- `NODE_ENV=production` - Production mode

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Ensure all dependencies are installed: `npm install`
- Check database file permissions

### Frontend won't connect to backend
- Verify backend is running on port 3001
- Check CORS settings in `server/src/server.js`
- Update API URLs in frontend if using different ports

### Database errors
- Delete `server/globalsync.db` to reset database
- Restart backend server to recreate tables

## Future Enhancements

Potential features to add:
- File attachments for tasks
- Email notifications
- Calendar integration
- Mobile responsive improvements
- Real-time updates with WebSockets
- Task dependencies and subtasks
- Time tracking
- Performance reports and analytics
- Export data to Excel/CSV
- Multi-language support

## License

This project is open source and available for personal and commercial use.

## Support

For issues or questions, contact your system administrator or development team.

---

**Built with ❤️ for global team coordination**

