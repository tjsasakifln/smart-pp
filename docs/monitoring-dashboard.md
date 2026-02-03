# Monitoring Dashboard Guide

**Project:** Licita Preços
**Version:** 1.0
**Date:** 2026-02-03
**Author:** Gage (DevOps Agent)
**Status:** Active

## Overview

This guide explains how to access, interpret, and use Railway's monitoring dashboard.

## Accessing Railway Metrics

### Via Railway Dashboard

1. Go to https://railway.app
2. Login with your account
3. Select the Licita Preços project
4. Click on the app service
5. Navigate to the "Metrics" tab

### Via Railway CLI

```bash
railway login
railway metrics --metric cpu
railway metrics --metric memory
railway analytics --metric response-time
```

## Key Metrics to Monitor

### CPU Usage

**What it measures:** Percentage of CPU resources being used

**Normal Range:** 20-50%
**Warning:** 70%+
**Critical:** 85%+

Actions:
- If trending up: Optimize code or scale horizontally
- If spike: Check for resource-intensive operations
- If stuck high: Restart service or check for infinite loops

### Memory Usage

**What it measures:** Percentage of RAM being used

**Normal Range:** 40-60%
**Warning:** 80%+
**Critical:** 90%+

Actions:
- If rising steadily: Investigate for memory leaks
- If spike: Monitor for 30 minutes, should decrease
- If maxed out: Restart service or increase container memory

### Response Time

**What it measures:** Average time to respond to requests (milliseconds)

**Normal Range:** 50-200ms
**Warning:** 500ms+
**Critical:** 2000ms+

Actions:
- If trending up: Check database queries
- If spike: Check for traffic surge or slow queries
- If stuck high: Restart service or check dependencies

### Error Rate

**What it measures:** Percentage of requests returning errors

**Normal Range:** < 1%
**Warning:** 1-5%
**Critical:** > 5%

Actions:
- Check application logs: `railway logs --follow`
- Identify error type
- Check dependencies (database, external APIs)

## Dashboard Layout

1. **Header:** Service name, status, uptime
2. **Metrics Panel:** Real-time CPU, memory, response time
3. **Graphs:** Historical data (1h, 24h, 7d)
4. **Logs:** Recent application logs
5. **Alerts:** Active alerts and history

## Time Range Selection

- **Last Hour:** Real-time monitoring
- **Last 24 Hours:** Daily trends
- **Last 7 Days:** Weekly patterns
- **Last 30 Days:** Monthly analysis
- **Custom:** Select specific date range

## Common Workflows

### Responding to High CPU Alert

1. Go to Metrics tab
2. Check CPU graph for pattern
3. Check for ongoing operations
4. Go to Logs tab
5. Search for errors or slow operations
6. Restart service if needed

### Investigating Slow Response Time

1. Check response time graph
2. Cross-reference with CPU/Memory:
   - High CPU/Memory: Infrastructure issue
   - Normal: Database/API issue
3. Go to Logs tab
4. Look for timeout errors
5. Check database performance

### Analyzing Error Spike

1. Check error rate and request rate graphs
2. Go to Logs tab
3. Search for errors: `railway logs | grep "error"`
4. Identify error type
5. Check recent deployments
6. Prepare rollback if needed

### Daily Health Check Routine

Each morning:
1. Check service status: Green?
2. Review metrics for last 24 hours
3. Check for any alerts triggered
4. Review error rate: Still < 1%?
5. Check CPU/Memory trends
6. Document anomalies

## Health Check Endpoint Monitoring

### Manual Check

```bash
curl https://your-app.railway.app/api/health

# Healthy response
{
  "status": "ok",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok"
  }
}

# Degraded response
{
  "status": "degraded",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "error"
  }
}
```

Railway monitors this endpoint every 30 seconds.

## Service Status Indicators

**Green (Healthy):**
- Service is running
- Health checks passing
- All metrics normal
- No active alerts

**Yellow (Degraded):**
- Service running with issues
- Some metrics elevated
- Non-critical alerts active

**Red (Critical):**
- Service failing health checks
- Critical metrics exceeded
- Multiple alerts active
- Service restart in progress

**Gray (Unknown):**
- Service just deployed
- Metrics not yet available

## Exporting Metrics

### Via CLI

```bash
# CPU usage
railway analytics --metric cpu --duration 24h

# Memory usage
railway analytics --metric memory --duration 24h

# Response time
railway analytics --metric response-time --duration 24h

# Export to file
railway analytics --metric cpu > metrics.txt
```

## Performance Optimization Tips

Based on monitoring dashboard:

1. **High CPU:** Profile application, optimize algorithms
2. **High Memory:** Check for memory leaks, optimize caching
3. **Slow Response:** Add database indexes, optimize queries
4. **High Errors:** Fix application bugs, handle edge cases
5. **Traffic Spikes:** Implement caching, consider auto-scaling

## Resources

- Railway Docs: https://docs.railway.app/reference/metrics
- Monitoring Alerts: monitoring-alerts.md
- Architecture: architecture.md

**Last Updated:** 2026-02-03
