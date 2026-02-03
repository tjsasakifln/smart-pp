# Monitoring and Alert Rules

**Project:** Licita Preços
**Version:** 1.0
**Date:** 2026-02-03
**Author:** Gage (DevOps Agent)
**Status:** Active

## Overview

Alert rules are designed to proactively identify and notify the team of potential issues.

## Alert Thresholds

### CPU Usage

| Threshold | Action | Severity |
|-----------|--------|----------|
| > 70% | Warning | Medium |
| > 85% | Critical Alert | High |
| > 95% | Critical Alert + Scale | Critical |

### Memory Usage

| Threshold | Action | Severity |
|-----------|--------|----------|
| > 80% | Warning | Medium |
| > 90% | Critical Alert | High |
| > 95% | Restart Service | Critical |

### Response Time

| Threshold | Action | Severity |
|-----------|--------|----------|
| > 2 seconds | Warning | Low |
| > 5 seconds | Alert | Medium |
| > 10 seconds | Critical | High |

### Error Rate

| Threshold | Action | Severity |
|-----------|--------|----------|
| > 5/min | Warning | Low |
| > 10/min | Alert | Medium |
| > 20/min | Critical | High |

## Health Check Monitoring

### Endpoint

**URL:** `/api/health`
**Method:** GET
**Timeout:** 30 seconds

Response format:
```json
{
  "status": "ok",
  "timestamp": "2026-02-03T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": "ok"
  }
}
```

Railway monitors this endpoint every 30 seconds and restarts after 3 consecutive failures.

## Error Tracking

All errors logged with Pino structured logging.

### Log Levels

| Level | Value | Usage |
|-------|-------|-------|
| Error | 50 | Application errors |
| Warn | 40 | Warnings |
| Info | 30 | General info |
| Debug | 20 | Debugging |

## Escalation Procedures

### Level 1: Warning
- Single metric exceeds threshold
- Action: Alert sent to team

### Level 2: Medium Alert
- Metric remains elevated 5 minutes
- Action: Notify on-call engineer

### Level 3: Critical Alert
- Critical threshold exceeded
- Action: Immediate page on-call

## Configuration

### Environment Variables

```
LOG_LEVEL=info
NODE_ENV=production
HEALTH_CHECK_TIMEOUT=30
DATABASE_QUERY_TIMEOUT=5000
```

**Last Updated:** 2026-02-03
