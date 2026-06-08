# Scalability Notes

## Current Architecture

```
Client (Browser)
    │
    ▼
Next.js App Router (Single Instance)
    ├── Route Handlers (REST API)
    │       ├── authenticate() middleware (JWT verification)
    │       ├── authorize() middleware (RBAC)
    │       └── Service layer (userService, taskService)
    │
    └── pg Connection Pool (max: 20 connections)
            │
            ▼
        PostgreSQL (Neon / Single DB)
```

**Current capacity estimate:** 100–500 concurrent users on a single Next.js instance with Neon's connection pooler.

---

## Future Improvements

### 1. Redis Caching

**Problem:** Every request hits the database, even for data that rarely changes (e.g., user profile, admin user list).

**Solution:**
- Cache JWT blacklists (logout invalidation) in Redis
- Cache user session data with TTL matching JWT expiry
- Cache paginated task lists per user with short TTL (30s–2min)
- Use Redis as a rate-limiter backend

```
Client → API → Redis (cache hit) → Response
                ↓ (miss)
              PostgreSQL → Redis → Response
```

**Libraries:** `ioredis`, `redis` npm package, or Upstash Redis (serverless-friendly).

---

### 2. Load Balancing

**Problem:** A single Next.js process is a single point of failure and can't scale horizontally.

**Solution:**
- Run multiple Next.js containers behind a load balancer (NGINX, AWS ALB, or Traefik)
- Use sticky sessions or stateless JWT (already implemented — no server-side session state)
- Deploy on Vercel (built-in edge), AWS ECS, or Kubernetes

```
                   ┌─────────────────┐
Client → Load Balancer → App Instance 1 ──┐
                   └─────────────────┘   │
                   ┌─────────────────┐   ├──→ PostgreSQL
Client → Load Balancer → App Instance 2 ──┤
                   └─────────────────┘   │
                   ┌─────────────────┐   │
                       App Instance N  ──┘
```

**Note:** Since authentication is JWT-based (stateless), this requires no changes to the auth layer.

---

### 3. Microservices

**Problem:** The monolith becomes a bottleneck when different parts of the system have different scaling needs (e.g., auth rarely changes, but tasks get heavy traffic).

**Solution — Split into services:**

| Service         | Responsibility                     | Scale trigger        |
|-----------------|------------------------------------|----------------------|
| Auth Service    | Register, login, token validation  | Low (rarely changes) |
| Task Service    | CRUD operations for tasks          | High (core feature)  |
| Admin Service   | Analytics, user management         | Low (internal only)  |
| Notification    | Email/push on task updates         | Medium               |

**Communication:** REST (synchronous) or message queue (async for notifications).

**Trade-offs:**
- Increased operational complexity
- Needs service discovery (Consul, K8s DNS)
- Distributed tracing becomes necessary (OpenTelemetry)

Recommended to delay until the monolith genuinely bottlenecks.

---

### 4. Message Queue

**Problem:** Synchronous operations (e.g., sending email on task assignment) slow down the API response.

**Solution:**
- Publish events (e.g., `task.created`, `task.assigned`) to a queue
- Workers consume events and perform side effects asynchronously
- API responds immediately, work happens in the background

```
API ──→ Message Queue (BullMQ / RabbitMQ / SQS)
              │
        Worker Process
              ├── Send email notification
              ├── Update analytics dashboard
              └── Trigger webhook
```

**Libraries:** `bullmq` (Redis-backed), AWS SQS, or RabbitMQ.

---

### 5. Centralized Logging & Observability

**Problem:** Logs scattered across instances, no visibility into errors, slow queries, or anomalies in production.

**Solution:**

**Logging:**
- Structured JSON logs (already partially in place with `console.log`)
- Ship to **Datadog**, **Logtail**, or **AWS CloudWatch**
- Add a logging middleware that captures: method, path, status, duration, userId

**Metrics:**
- Request rate, error rate, p95/p99 latency (RED metrics)
- Database connection pool utilization
- Export to **Prometheus + Grafana** or **Datadog APM**

**Tracing:**
- Distributed tracing with **OpenTelemetry**
- Trace a request from API → service → DB query across multiple instances

**Error tracking:**
- **Sentry** for runtime error capture with stack traces and user context

---

### 6. Database Scaling

**Problem:** A single PostgreSQL instance becomes a write bottleneck under heavy load.

**Solutions:**
- **Read replicas** — route GET queries to replicas, writes to primary
- **Connection pooling** — use PgBouncer in front of PostgreSQL (Neon includes this)
- **Partitioning** — partition the `tasks` table by `user_id` or `created_at` for large datasets
- **Archiving** — move completed/old tasks to a separate archive table or cold storage

---

### 7. API Rate Limiting

**Problem:** No protection against brute-force attacks on `/auth/login` or API abuse.

**Solution:**
- Implement rate limiting per IP and per user using Redis sliding window
- Use Next.js middleware for edge-level rate limiting
- Consider Cloudflare WAF for DDoS protection

```typescript
// Example: 10 login attempts per minute per IP
const key = `rate:login:${ip}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60);
if (count > 10) return tooManyRequests();
```

---

## Summary: When to Scale

| Traffic Level  | Recommended Action                                |
|----------------|---------------------------------------------------|
| 0–1K users     | Current architecture (single instance + Neon)     |
| 1K–10K users   | Add Redis cache + rate limiting                   |
| 10K–100K users | Load balancing (2–4 instances) + read replicas    |
| 100K+ users    | Microservices + message queue + centralized logs  |
