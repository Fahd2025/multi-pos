# Multi-POS System - Operations Runbook

**Version:** 1.0
**Last Updated:** 2025-12-30
**Purpose:** Day-to-day operations, monitoring, and troubleshooting

---

## Quick Reference

### System URLs
- **Production**: https://pos.yourcompany.com
- **API**: https://api.pos.yourcompany.com
- **Health Check**: https://api.pos.yourcompany.com/health
- **Swagger**: https://api.pos.yourcompany.com/swagger

### Key Directories
- **Backend**: `/var/www/pos-backend/`
- **Frontend**: `/var/www/pos-frontend/`
- **Logs**: `/var/log/pos/`
- **Backups**: `/var/backups/pos/`
- **Database**: Configured in connection string

### Service Commands
```bash
# Backend
sudo systemctl status pos-backend
sudo systemctl start pos-backend
sudo systemctl stop pos-backend
sudo systemctl restart pos-backend

# Web Server (Nginx)
sudo systemctl status nginx
sudo systemctl restart nginx

# View logs
sudo journalctl -u pos-backend -f
tail -f /var/log/pos/app.log
```

---

## Daily Operations

### Morning Checklist (Before Business Hours)

- [ ] Check system status dashboard
- [ ] Review overnight error logs
- [ ] Verify backup completed successfully
- [ ] Check disk space (should be >20% free)
- [ ] Verify database connectivity
- [ ] Test health check endpoint
- [ ] Review pending sync queue (should be empty)

### During Business Hours

- [ ] Monitor active users count
- [ ] Watch for error spikes
- [ ] Check API response times
- [ ] Monitor database performance
- [ ] Review support tickets

### End of Day Checklist

- [ ] Verify all users logged out
- [ ] Check cash drawer closures
- [ ] Generate daily sales report
- [ ] Verify backup job scheduled for tonight
- [ ] Review today's errors and warnings
- [ ] Plan fixes for non-critical issues

---

## Monitoring

### Key Metrics to Monitor

| Metric | Normal Range | Alert Threshold |
|--------|--------------|-----------------|
| API Response Time | <500ms | >1000ms |
| Error Rate | <0.1% | >1% |
| CPU Usage | <70% | >90% |
| Memory Usage | <80% | >95% |
| Disk Usage | <80% | >90% |
| Database Connections | <50 | >100 |
| Active Users | 1-100 | >150 |

### Health Check

**Endpoint:** `GET /health`

**Expected Response:**
```json
{
  "status": "Healthy",
  "database": "Connected",
  "timestamp": "2025-12-30T10:00:00Z"
}
```

**Unhealthy Response:**
```json
{
  "status": "Unhealthy",
  "database": "Connection Failed",
  "error": "Database timeout",
  "timestamp": "2025-12-30T10:00:00Z"
}
```

### Log Locations

```bash
# Application Logs
/var/log/pos/app.log
/var/log/pos/errors.log

# Web Server Logs
/var/log/nginx/access.log
/var/log/nginx/error.log

# System Logs
sudo journalctl -u pos-backend

# Database Logs (example for PostgreSQL)
/var/log/postgresql/postgresql.log
```

---

## Common Issues and Solutions

### Issue: Application Won't Start

**Symptoms:**
- Service fails to start
- Health check returns 503

**Diagnosis:**
```bash
sudo systemctl status pos-backend
sudo journalctl -u pos-backend --since "10 minutes ago"
```

**Common Causes & Solutions:**

1. **Port Already in Use**
   ```bash
   sudo lsof -i :5000
   sudo kill <PID>
   sudo systemctl start pos-backend
   ```

2. **Database Connection Failed**
   - Check connection string in appsettings.json
   - Verify database server is running
   - Test connection manually:
     ```bash
     dotnet ef database update --dry-run
     ```

3. **Missing Configuration**
   - Verify appsettings.Production.json exists
   - Check environment variables are set
   - Verify file permissions

### Issue: Slow Performance

**Symptoms:**
- API responses >1000ms
- Pages load slowly
- Users complain about lag

**Diagnosis:**
```bash
# Check CPU and memory
top
htop

# Check database queries
# (Connect to database and run)
SELECT * FROM pg_stat_activity WHERE state = 'active';

# Check disk I/O
iostat -x 2
```

**Solutions:**

1. **High CPU Usage**
   - Identify resource-heavy processes
   - Restart application
   - Scale horizontally (add more instances)

2. **Database Slow Queries**
   - Identify slow queries in logs
   - Add missing indexes
   - Optimize queries
   - Run database maintenance (VACUUM, REINDEX)

3. **Low Memory**
   - Increase server memory
   - Tune application memory settings
   - Clear cache

### Issue: Database Connection Errors

**Error:** "Cannot connect to database"

**Diagnosis:**
```bash
# Test database connectivity
telnet <db-host> <db-port>

# Check database service
sudo systemctl status postgresql
# OR
sudo systemctl status mysql
# OR
sudo systemctl status mssql-server
```

**Solutions:**

1. **Database Service Down**
   ```bash
   sudo systemctl start postgresql
   ```

2. **Connection String Incorrect**
   - Verify host, port, username, password
   - Test connection manually

3. **Network Issues**
   - Check firewall rules
   - Verify security groups allow database port
   - Ping database server

4. **Too Many Connections**
   - Kill idle connections
   - Increase max_connections setting
   - Fix connection leaks in application

### Issue: Receipt Printer Not Working

**Symptoms:**
- Receipts don't print
- "Printer not configured" error

**Diagnosis:**
1. Check printer configuration in system
2. Test printer connectivity (network ping or USB connection)
3. Try test print from settings
4. Check application logs for printer errors

**Solutions:**

**Network Printer:**
```bash
# Ping printer
ping 192.168.1.100

# Telnet to printer port
telnet 192.168.1.100 9100

# Check firewall
sudo iptables -L | grep 9100
```

**USB Printer:**
- Check USB connection
- Verify printer drivers installed
- Check printer shows in device list
- Try different USB port

**Printer Offline:**
- Power cycle printer
- Check paper loaded
- Clear any print jams
- Reset printer to factory defaults

### Issue: High Error Rate

**Symptoms:**
- Error rate >1%
- Multiple 500 errors in logs
- Users reporting failures

**Diagnosis:**
```bash
# Check recent errors
tail -n 100 /var/log/pos/errors.log

# Count errors
grep "ERROR" /var/log/pos/app.log | wc -l

# Find most common error
grep "ERROR" /var/log/pos/app.log | sort | uniq -c | sort -nr | head -10
```

**Solutions:**
1. Identify error pattern
2. Check if specific to one endpoint/feature
3. Review recent code changes
4. Rollback if necessary
5. Apply hotfix

### Issue: Sync Queue Growing

**Symptoms:**
- Pending sync items increasing
- Offline transactions not syncing
- "Sync failed" errors

**Diagnosis:**
```bash
# Check sync queue
SELECT COUNT(*) FROM SyncQueue WHERE Status = 'Pending';
```

**Solutions:**
1. **Network Connectivity**
   - Verify internet connection
   - Check API endpoint is reachable
   - Test with curl: `curl https://api.pos.yourcompany.com/health`

2. **API Errors**
   - Check API logs for sync endpoint errors
   - Verify authentication tokens valid
   - Check rate limiting not blocking sync

3. **Data Issues**
   - Check for malformed sync data
   - Review failed sync items
   - Manually fix corrupt records

4. **Force Resync**
   ```bash
   # Restart application (triggers sync)
   sudo systemctl restart pos-backend

   # Or trigger sync via API
   curl -X POST https://api.pos.yourcompany.com/api/v1/sync/process \
     -H "Authorization: Bearer $TOKEN"
   ```

---

## Backup and Recovery

### Automated Backups

**Schedule:** Daily at 2:00 AM

**Verification:**
```bash
# Check last backup
ls -lh /var/backups/pos/ | head -5

# Verify backup size (should be consistent)
du -h /var/backups/pos/backup-$(date +%Y-%m-%d).sql.gz
```

**Backup Retention:** 30 days

### Manual Backup

```bash
# Database backup
pg_dump -U postgres pos_db | gzip > /var/backups/pos/manual-backup-$(date +%Y-%m-%d-%H%M).sql.gz

# Application backup
tar -czf /var/backups/pos/app-backup-$(date +%Y-%m-%d-%H%M).tar.gz /var/www/pos-backend/ /var/www/pos-frontend/
```

### Restore from Backup

**⚠️ WARNING: This overwrites current data**

```bash
# 1. Stop application
sudo systemctl stop pos-backend

# 2. Restore database
gunzip < /var/backups/pos/backup-2025-12-30.sql.gz | psql -U postgres pos_db

# 3. Verify restore
psql -U postgres pos_db -c "SELECT COUNT(*) FROM Sales;"

# 4. Start application
sudo systemctl start pos-backend

# 5. Verify application
curl https://api.pos.yourcompany.com/health
```

---

## Security Operations

### Security Monitoring

**Daily Checks:**
- [ ] Review failed login attempts
- [ ] Check for unusual API access patterns
- [ ] Review privilege escalation attempts
- [ ] Verify SSL certificate validity

**Suspicious Activity Indicators:**
- Multiple failed logins from same IP
- API requests at unusual hours
- Unusual data export volumes
- Rapid-fire API requests (potential DOS)

### Incident Response

**If Security Breach Suspected:**

1. **Immediate Actions:**
   - Document the incident
   - Isolate affected systems
   - Preserve evidence (logs, database snapshots)

2. **Contain:**
   - Disable compromised accounts
   - Block suspicious IP addresses
   - Rotate credentials

3. **Investigate:**
   - Review audit logs
   - Identify attack vector
   - Assess damage

4. **Recover:**
   - Restore from clean backup (if needed)
   - Apply security patches
   - Update firewall rules

5. **Follow-Up:**
   - Notify affected users
   - Update security procedures
   - Conduct post-mortem

### Password Reset (Emergency)

```bash
# Emergency admin password reset (direct database)
psql -U postgres pos_db

-- Update password (hashed)
UPDATE "Users"
SET "PasswordHash" = '<new-bcrypt-hash>'
WHERE "Username" = 'admin';
```

**Generate bcrypt hash:**
```bash
# Using online tool or .NET
dotnet run --project PasswordHasher -- "newpassword"
```

---

## Database Maintenance

### Weekly Maintenance

```sql
-- PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE pos_db;

-- Check database size
SELECT pg_size_pretty(pg_database_size('pos_db'));

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Monthly Maintenance

```sql
-- Archive old data (older than 2 years)
INSERT INTO Sales_Archive
SELECT * FROM Sales
WHERE SaleDate < NOW() - INTERVAL '2 years';

DELETE FROM Sales
WHERE SaleDate < NOW() - INTERVAL '2 years';

-- Clean up audit logs (older than 1 year)
DELETE FROM AuditLogs
WHERE CreatedAt < NOW() - INTERVAL '1 year';

-- Update statistics
ANALYZE;
```

---

## Performance Optimization

### Application Optimization

```bash
# Enable production optimizations
export ASPNETCORE_ENVIRONMENT=Production
export DOTNET_GCServer=1

# Increase connection pool
# Edit appsettings.json: "Max Pool Size=100"
```

### Database Optimization

```sql
-- Add missing indexes (examples)
CREATE INDEX IF NOT EXISTS idx_sales_date ON Sales(SaleDate);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON Sales(CustomerId);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON Products(Barcode);

-- Update query planner statistics
ANALYZE VERBOSE;
```

### Web Server Optimization

```nginx
# /etc/nginx/nginx.conf

# Enable gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript;

# Enable caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

# Connection limits
keepalive_timeout 65;
client_max_body_size 10M;
```

---

## Escalation Procedures

### Issue Severity Levels

| Level | Description | Response Time | Escalation |
|-------|-------------|---------------|------------|
| **P1 - Critical** | System down, data loss | Immediate | CTO, VP Engineering |
| **P2 - High** | Major feature broken | 1 hour | Engineering Manager |
| **P3 - Medium** | Minor feature issue | 4 hours | Team Lead |
| **P4 - Low** | Cosmetic issue | 24 hours | Next sprint |

### On-Call Rotation

| Day | Primary | Secondary | Manager |
|-----|---------|-----------|---------|
| Mon-Tue | Engineer A | Engineer B | Manager X |
| Wed-Thu | Engineer B | Engineer C | Manager X |
| Fri-Sun | Engineer C | Engineer A | Manager Y |

### Contact List

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Operations Manager | ___________ | ___________ | ___________ |
| Database Admin | ___________ | ___________ | ___________ |
| Security Officer | ___________ | ___________ | ___________ |
| Engineering Manager | ___________ | ___________ | ___________ |
| 24/7 Hotline | ___________ | ___________ | N/A |

---

## Useful Commands

### System Information
```bash
# Check system resources
free -h
df -h
uptime
top

# Check network
netstat -tulpn | grep LISTEN
ss -tuln | grep 5000

# Check processes
ps aux | grep dotnet
pgrep -f pos-backend
```

### Application Management
```bash
# View app configuration
cat /var/www/pos-backend/appsettings.json

# Check app version
dotnet /var/www/pos-backend/Backend.dll --version

# Run migrations
cd /var/www/pos-backend
dotnet ef database update

# Clear cache
redis-cli FLUSHALL  # If using Redis
```

### Log Analysis
```bash
# Count errors today
grep "ERROR" /var/log/pos/app.log | grep "$(date +%Y-%m-%d)" | wc -l

# Find specific error
grep -i "null reference" /var/log/pos/errors.log

# Show last 100 errors
tail -n 100 /var/log/pos/errors.log

# Follow logs in real-time
tail -f /var/log/pos/app.log
```

---

## Maintenance Windows

### Scheduled Maintenance

**Frequency:** Monthly (first Sunday, 2:00 AM - 6:00 AM)

**Activities:**
- Apply security patches
- Update dependencies
- Database maintenance
- Performance optimization
- Clear old logs
- Test backup restores

**Communication:**
- Notify users 1 week in advance
- Send reminder 24 hours before
- Display maintenance banner during window
- Send completion notification

---

## Change Management

### Making Configuration Changes

1. **Document Change**
   - What: Describe the change
   - Why: Reason for change
   - Impact: Expected user impact
   - Rollback: How to undo

2. **Test in Staging**
   - Apply change to staging
   - Verify functionality
   - Monitor for 24 hours

3. **Schedule Production Change**
   - During low-traffic period
   - Have rollback plan ready

4. **Apply and Monitor**
   - Make change
   - Monitor metrics closely
   - Document actual outcome

5. **Review**
   - Was change successful?
   - Any unexpected issues?
   - Lessons learned

---

**Document Version:** 1.0
**Last Updated:** 2025-12-30
**Next Review:** 2026-01-30

---

© 2025 Multi-POS System. All rights reserved.
