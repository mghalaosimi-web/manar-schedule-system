# 🎯 Production Setup Guide - Manar Schedule System

## Quick Start on Render.com

### Prerequisites
- GitHub account (repo already pushed)
- Render.com account
- 10 minutes

---

## Step 1: Create Render Account

1. Go to [render.com](https://render.com)
2. Click "Sign up" → "Continue with GitHub"
3. Authorize Render to access your repositories
4. Complete account setup

---

## Step 2: Create PostgreSQL Database

1. Dashboard → Click **"New"** → **"PostgreSQL"**
2. Fill in the form:
   - **Name**: `manar-schedule-db`
   - **Database**: `manar_schedule`
   - **User**: `postgres`
   - **Region**: Select closest to your location
   - **Plan**: **Starter** (Free tier, sufficient for testing)
   - **Postgres Version**: Latest

3. Click **"Create Database"**
4. ⏳ Wait 2-3 minutes for database creation
5. Copy the connection string from the "Connections" section
   - Format: `postgresql://user:password@host:5432/dbname`
   - Save this for later!

---

## Step 3: Deploy Backend Service

1. Dashboard → Click **"New"** → **"Web Service"**

2. **Connect Repository**
   - Search for: `mghalaosimi-web/manar-schedule-system`
   - Select it
   - Click "Connect"

3. **Configure Service**
   - **Name**: `manar-schedule-backend`
   - **Environment**: `Node`
   - **Region**: Same as database (important!)
   - **Branch**: `main`
   - **Build Command**: Leave empty (auto-detect render.yaml)
   - **Start Command**: Leave empty (auto-detect render.yaml)

4. **Add Environment Variables**
   
   | Key | Value | Source |
   |-----|-------|--------|
   | `NODE_ENV` | `production` | Type this |
   | `DATABASE_URL` | `postgresql://...` | From Step 2 |
   | `JWT_SECRET` | `your-super-secret-key-32chars-minimum` | Generate: `openssl rand -base64 32` |
   | `PORT` | `5000` | Type this |

5. Click **"Create Web Service"**

6. ⏳ Wait for deployment (5-10 minutes)
   - Watch the logs in real-time
   - Look for: `Server is running on port 5000`

---

## Step 4: Initialize Database

1. Go to your service page in Render
2. Click **"Shell"** tab
3. Run these commands in order:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed initial data
node prisma/seed.js
```

4. Verify output shows:
   ```
   [DATABASE] Seeding completed successfully.
   ```

---

## Step 5: Test Your Deployment

### Test Health Check
```bash
curl https://your-service-url.onrender.com/api/health
```

Response should be:
```json
{
  "status": "OK",
  "message": "Manar Schedule System Backend is running."
}
```

### Test Login
Use a REST client (Postman, Thunder Client, or curl):

```bash
curl -X POST https://your-service-url.onrender.com/api/health \
  -H "Content-Type: application/json"
```

### Frontend Access
Visit: `https://your-service-url.onrender.com`

You should see the React app loading!

---

## Environment Variables Reference

### Required
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `JWT_SECRET` | Secret key for JWT tokens (32+ chars) | Generate with `openssl rand -base64 32` |

### Optional
| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Set to `production` for deployment |
| `PORT` | `5000` | Port the server runs on |
| `VITE_API_URL` | (auto-detected) | Frontend API endpoint |

---

## Troubleshooting

### Build Fails
**Error**: `npm install fails` or `npm ERR!`

**Solution**:
```bash
# Clear cache and retry
rm -rf node_modules package-lock.json
npm install
```

### Database Connection Error
**Error**: `connect ECONNREFUSED` or `no pg_hba.conf entry`

**Solution**:
1. Verify DATABASE_URL is correct
2. Check PostgreSQL service is running
3. Ensure IP whitelist includes Render's IPs (usually automatic)
4. Reset database and retry

### Migrations Failed
**Error**: `migration failed` or `table already exists`

**Solution**:
1. Go to Render Shell
2. Run: `npx prisma migrate reset` (⚠️ deletes data!)
3. Run: `npx prisma migrate deploy`
4. Run: `node prisma/seed.js`

### Frontend Not Loading
**Error**: 404 or blank page

**Solution**:
1. Verify build completed: `npm run build:frontend`
2. Check static files are in `frontend/dist`
3. Verify fallback route works (line 1231 in server.js)
4. Check browser console for errors

### CORS Errors
**Error**: `Access to XMLHttpRequest blocked by CORS`

**Solution**:
1. Check frontend is calling correct API URL
2. Verify CORS middleware is enabled (line 24 in server.js)
3. Add frontend domain if needed:
   ```javascript
   cors({ origin: 'https://your-frontend.com' })
   ```

### Cron Jobs Not Running
**Error**: Notifications not sent at 8 PM

**Solution**:
1. Verify server timezone on Render
2. Check cron syntax (line 169 in server.js)
3. Monitor logs for `[CRON]` messages
4. Restart service if needed

---

## Post-Deployment Checklist

- [ ] Database created and seeded
- [ ] Service deployed and running
- [ ] Health check endpoint works
- [ ] Login functionality working
- [ ] Frontend loads correctly
- [ ] Can view schedules
- [ ] Can view notifications
- [ ] Admin functions accessible
- [ ] No console errors
- [ ] All env variables set

---

## Performance Tips

### For Free Tier
1. **Database**: Auto-spins down after 15 mins of inactivity
   - First request after sleep may be slow (5-30 sec)
   - This is normal for free tier

2. **Web Service**: Runs on shared resources
   - Should handle 100+ concurrent users fine
   - Monitor response times

3. **Scaling Up**
   - Upgrade to Starter plan for better performance
   - Consider separate database service

### Monitoring
1. Check Render dashboard regularly
2. Monitor logs for errors
3. Test health endpoint periodically
4. Set up alerts in Render (Pro feature)

---

## Next Steps

### Week 1 - Testing
- [ ] Test all user flows
- [ ] Test all admin functions
- [ ] Verify notifications work
- [ ] Test on mobile
- [ ] Load test (optional)

### Week 2 - Optimization
- [ ] Add database indexes if needed
- [ ] Enable caching if needed
- [ ] Monitor real user performance
- [ ] Gather feedback

### Week 3 - Production Ready
- [ ] Run security audit
- [ ] Set up automated backups
- [ ] Configure monitoring/alerts
- [ ] Document deployment process
- [ ] Share access with team

---

## Maintenance

### Regular Tasks
- **Daily**: Monitor error logs
- **Weekly**: Check performance metrics
- **Monthly**: Database backup verification
- **Quarterly**: Security updates & patches

### Emergency Procedures
1. **Database Down**: Restart database service
2. **Service Down**: Restart web service
3. **Corrupted Data**: Use Render backups
4. **DDoS/Attack**: Use Render's WAF rules

---

## Security Hardening (Optional but Recommended)

1. **Enable 2FA on Render**
   - Account Settings → Two-Factor Auth

2. **Rotate JWT Secret Periodically**
   - Generate new secret monthly
   - Update on Render environment variables

3. **Enable HTTPS Only**
   - Should be automatic on Render
   - Verify in browser (🔒 icon)

4. **Set Database Backups**
   - Render manages this, but verify settings
   - Test restore procedure monthly

5. **Monitor Access Logs**
   - Check for suspicious patterns
   - Set up alerts for 403/401 errors

---

## Getting Help

### Render Support
- Docs: https://render.com/docs
- Status: https://status.render.com
- Support: support@render.com

### Project Issues
- GitHub Issues: https://github.com/mghalaosimi-web/manar-schedule-system/issues
- Check README.md for troubleshooting

---

## Success Metrics

Once deployed, you should see:
- ✅ Zero downtime
- ✅ <500ms API response time
- ✅ <2s page load time
- ✅ All scheduled notifications working
- ✅ 100% uptime SLA

**Congratulations! Your system is live! 🎉**
