# GlobalSync - Complete Deployment Guide

## 🚀 FREE Deployment on Railway.app

This guide will help you deploy GlobalSync online for **FREE** in under 10 minutes.

---

## Prerequisites

1. **GitHub Account** (free) - [Sign up here](https://github.com)
2. **Railway Account** (free) - [Sign up here](https://railway.app)
3. **Git installed** on your computer

---

## Step 1: Prepare Your Code

### 1.1 Create GitHub Repository

```bash
# Navigate to your globalsync folder
cd C:\globalsync

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial GlobalSync deployment"

# Create repository on GitHub.com (via website)
# Then connect and push:
git remote add origin https://github.com/YOUR_USERNAME/globalsync.git
git branch -M main
git push -u origin main
```

---

## Step 2: Deploy to Railway

### 2.1 Sign Up for Railway

1. Go to [railway.app](https://railway.app)
2. Click "Login" → "Login with GitHub"
3. Authorize Railway to access your GitHub

### 2.2 Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `globalsync` repository
4. Railway will detect it's a Node.js app

### 2.3 Add Database

1. In your project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway creates a free PostgreSQL database
4. Database URL is automatically added to environment variables

### 2.4 Configure Environment Variables

Click on your service → "Variables" tab → Add these:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-to-something-random
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://your-app-name.up.railway.app
```

**Generate JWT_SECRET:**
```bash
# On your computer, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.5 Deploy

1. Railway automatically deploys your code
2. Wait 2-3 minutes for build to complete
3. Click "Generate Domain" to get your public URL
4. Your app is now live! 🎉

---

## Step 3: Access Your Application

### 3.1 Get Your URL

Railway provides a free URL like:
```
https://globalsync-production.up.railway.app
```

### 3.2 First Login

**Default Admin Account:**
- Username: `abdallah`
- Password: `password123`

**⚠️ IMPORTANT: Change this password immediately after first login!**

---

## Step 4: Configure Email Notifications (Optional)

### 4.1 Sign Up for SendGrid (Free)

1. Go to [sendgrid.com](https://sendgrid.com)
2. Sign up for free account (100 emails/day)
3. Verify your email
4. Create an API key

### 4.2 Add Email Variables to Railway

In Railway → Variables, add:

```
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=GlobalSync
```

---

## Step 5: Custom Domain (Optional - $12/year)

### 5.1 Buy Domain

1. Go to [Namecheap](https://namecheap.com) or [GoDaddy](https://godaddy.com)
2. Buy domain: `globalsync.com` (~$12/year)

### 5.2 Connect to Railway

1. In Railway → Your service → "Settings"
2. Click "Generate Domain" → "Custom Domain"
3. Enter your domain: `globalsync.com`
4. Railway provides DNS records

### 5.3 Update DNS

In your domain registrar (Namecheap/GoDaddy):

1. Go to DNS settings
2. Add CNAME record:
   - Host: `@` or `www`
   - Value: `your-app.up.railway.app`
3. Wait 10-60 minutes for DNS propagation

---

## Step 6: Set Up Automatic Deployments

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Updated feature X"
git push

# Railway automatically deploys the new version!
```

---

## Cost Breakdown

### Free Tier (Perfect for Start)

- **Railway**: $0/month (500 hours free)
- **PostgreSQL**: $0/month (1GB included)
- **SendGrid**: $0/month (100 emails/day)
- **SSL Certificate**: $0 (included)
- **Total: $0/month** ✅

### When You Grow (100+ users)

- **Railway Pro**: $20/month (unlimited hours)
- **Database**: Included
- **SendGrid Pro**: $15/month (40,000 emails/month)
- **Custom Domain**: $1/month
- **Total: $36/month**

---

## Monitoring & Maintenance

### Check Application Health

1. Railway Dashboard → Your service
2. View logs in real-time
3. Monitor CPU/Memory usage
4. Check database size

### Backup Database

Railway automatically backs up your database daily.

**Manual backup:**
1. Railway → PostgreSQL service
2. Click "Data" tab
3. Export database

### Update Application

```bash
# Pull latest changes
git pull

# Or make your own changes
# ... edit files ...

# Deploy
git add .
git commit -m "Update"
git push

# Railway auto-deploys!
```

---

## Troubleshooting

### App Won't Start

**Check logs:**
1. Railway → Your service → "Deployments"
2. Click latest deployment
3. View build logs

**Common issues:**
- Missing environment variables
- Database connection failed
- Port configuration wrong

### Database Connection Error

1. Verify `DATABASE_URL` is set correctly
2. Check PostgreSQL service is running
3. Restart both services

### Can't Access Application

1. Check deployment status (should be "Active")
2. Verify domain is generated
3. Check if HTTPS is working
4. Clear browser cache

---

## Security Best Practices

### 1. Change Default Password

Immediately after first login:
1. Go to Admin → User Management
2. Edit your account
3. Change password to something strong

### 2. Secure JWT Secret

- Never commit `JWT_SECRET` to GitHub
- Use Railway environment variables
- Generate a strong random key

### 3. Enable HTTPS Only

Railway provides free SSL certificates automatically.

### 4. Regular Backups

- Railway backs up database daily
- Export important data weekly
- Keep local backups

### 5. Monitor Access

- Review user registrations regularly
- Check audit logs
- Disable inactive accounts

---

## Scaling Your Application

### When to Upgrade

Upgrade from free tier when:
- More than 500 hours/month usage (24/7 = 720 hours)
- Need more than 512MB RAM
- Database exceeds 1GB
- Need more than 100 emails/day

### How to Upgrade

1. Railway Dashboard → Billing
2. Add payment method
3. Upgrade to Pro ($20/month)
4. Enjoy unlimited resources!

---

## Mobile Access

### Progressive Web App (PWA)

GlobalSync works as a mobile app:

**On iPhone:**
1. Open Safari → Visit your GlobalSync URL
2. Tap Share button
3. "Add to Home Screen"
4. App icon appears on home screen!

**On Android:**
1. Open Chrome → Visit your GlobalSync URL
2. Tap menu (3 dots)
3. "Add to Home screen"
4. App icon appears!

**Benefits:**
- Works offline
- Push notifications
- Looks like native app
- No app store needed
- Cost: $0

---

## Support & Help

### Railway Support

- Documentation: [docs.railway.app](https://docs.railway.app)
- Discord: [discord.gg/railway](https://discord.gg/railway)
- Status: [status.railway.app](https://status.railway.app)

### GlobalSync Issues

- Check logs in Railway dashboard
- Review error messages
- Verify environment variables
- Restart services if needed

---

## Next Steps

1. ✅ Deploy to Railway (10 minutes)
2. ✅ Change default password
3. ✅ Add your team members
4. ✅ Create first tasks
5. ✅ Set up email notifications
6. ✅ Configure custom domain (optional)
7. ✅ Add to mobile home screen

**Congratulations! GlobalSync is now live and accessible worldwide!** 🎉

---

## Quick Reference

**Railway Dashboard:** https://railway.app/dashboard
**Your App URL:** https://your-app.up.railway.app
**Database:** PostgreSQL (included)
**Cost:** $0/month (free tier)

**Default Login:**
- Username: `abdallah`
- Password: `password123` (⚠️ CHANGE THIS!)

---

## Questions?

Refer to:
- `README.md` - Application overview
- `USER-GUIDE.md` - How to use GlobalSync
- `ADMIN-GUIDE.md` - Administration manual
- Railway documentation for deployment issues

**Happy managing! 🚀**

