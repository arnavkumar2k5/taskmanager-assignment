-- =============================================================================
-- Migration: Initial Schema
-- Creates users and tasks tables with proper constraints and indexes.
-- Run once on a fresh database.
-- =============================================================================

-- Enable UUID generation (required for gen_random_uuid())
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255)  NOT NULL,
  email       VARCHAR(255)  NOT NULL UNIQUE,
  password    VARCHAR(255)  NOT NULL,
  role        VARCHAR(20)   NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Index for fast email lookup (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =============================================================================
-- TASKS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title       VARCHAR(255)  NOT NULL,
  description TEXT          NOT NULL DEFAULT '',
  status      VARCHAR(50)   NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
  user_id     UUID          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Index for fast user task lookup
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status  ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);

-- Full-text search index on title + description
CREATE INDEX IF NOT EXISTS idx_tasks_title_desc
  ON tasks USING GIN (to_tsvector('english', title || ' ' || description));

-- =============================================================================
-- SEED: Default admin user
-- Password: Admin@1234 (bcrypt hash — change this in production!)
-- =============================================================================
INSERT INTO users (name, email, password, role)
VALUES (
  'Admin User',
  'admin@taskflow.dev',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeQfOexKNHIkpVtFC',
  'ADMIN'
)
ON CONFLICT (email) DO NOTHING;
