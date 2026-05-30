-- StopCheck Database Schema
-- Per spec sections 5 and 10.2

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations (race promoters)
CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  stripe_customer_id TEXT,
  plan          TEXT DEFAULT 'free',  -- free | starter | event_pass | season_pro | series
  plan_expires_at TIMESTAMPTZ,
  sponsored            BOOLEAN DEFAULT false,
  sponsor_verified_at  TIMESTAMPTZ,
  sponsor_charity_name TEXT,
  sponsor_ein          TEXT,
  trial_events_used INTEGER DEFAULT 0,
  trial_active      BOOLEAN DEFAULT true,
  trial_started_at  TIMESTAMPTZ DEFAULT now(),
  tutorial_completed BOOLEAN DEFAULT false,
  tutorial_step     INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Events
CREATE TABLE events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  event_date        DATE NOT NULL,
  location          TEXT,
  course_file_url   TEXT,
  -- Spec v2.0 §1.3/§1.4 detection thresholds (internal values; public copy is
  -- intentionally buffered above these — Three-Second Rule at 3 mph / 3s)
  stop_duration_sec FLOAT DEFAULT 0.75,
  geofence_radius_m FLOAT DEFAULT 25.0,
  speed_threshold   FLOAT DEFAULT 0.5,
  status            TEXT DEFAULT 'setup',  -- setup | active | complete
  event_window_start TIMESTAMPTZ,
  event_window_end   TIMESTAMPTZ,
  unlocked          BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Stop signs (per event)
CREATE TABLE stop_signs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  sequence        INT NOT NULL,
  lat             DOUBLE PRECISION NOT NULL,
  lon             DOUBLE PRECISION NOT NULL,
  location        TEXT,
  mile_marker     FLOAT,
  source          TEXT DEFAULT 'osm',
  crossing_guard  BOOLEAN DEFAULT false,
  guard_confirmed_by TEXT,
  guard_confirmed_at TIMESTAMPTZ
);

-- Riders (registered per event)
CREATE TABLE riders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
  bib_number   TEXT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  auth_token   TEXT UNIQUE DEFAULT gen_random_uuid(),
  connected_at TIMESTAMPTZ,
  platform     TEXT,  -- strava | garmin | wahoo | upload
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- OAuth tokens (encrypted at rest via AES-256-GCM)
CREATE TABLE oauth_tokens (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id         UUID REFERENCES riders(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  expires_at       TIMESTAMPTZ,
  platform_user_id TEXT,
  updated_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(rider_id, platform)
);

-- Compliance results (per rider per stop sign)
CREATE TABLE compliance_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id        UUID REFERENCES riders(id) ON DELETE CASCADE,
  event_id        UUID REFERENCES events(id) ON DELETE CASCADE,
  stop_sign_id    UUID REFERENCES stop_signs(id) ON DELETE CASCADE,
  status          TEXT,  -- pass | fail | missed | not_applicable | guard_waived
  min_speed_mph   FLOAT,
  stop_duration_s FLOAT,
  speed_source    TEXT,  -- sensor | gps_derived
  raw_records     JSONB,
  processed_at    TIMESTAMPTZ DEFAULT now()
);

-- Overall rider compliance summary
CREATE TABLE rider_summaries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id         UUID REFERENCES riders(id) ON DELETE CASCADE UNIQUE,
  event_id         UUID REFERENCES events(id) ON DELETE CASCADE,
  compliance_pct   FLOAT,
  stops_passed     INT,
  stops_failed     INT,
  stops_missed     INT,
  dq_recommended   BOOLEAN DEFAULT false,
  dq_confirmed     BOOLEAN DEFAULT false,
  dq_confirmed_by  UUID REFERENCES organizations(id) ON DELETE SET NULL,
  dq_confirmed_at  TIMESTAMPTZ,
  fit_file_url     TEXT,
  activity_id      TEXT,
  processed_at     TIMESTAMPTZ DEFAULT now()
);

-- Sponsorship applications
CREATE TABLE sponsorship_applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_name         TEXT NOT NULL,
  contact_email    TEXT NOT NULL,
  event_name       TEXT NOT NULL,
  charity_name     TEXT NOT NULL,
  ein              TEXT,                    -- 501(c)(3) EIN number
  charity_docs_url TEXT,
  website          TEXT,
  expected_riders  INT,
  status           TEXT DEFAULT 'pending',  -- pending | approved | denied
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMPTZ,
  denial_reason    TEXT,
  org_id           UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_sponsorship_status ON sponsorship_applications(status);
CREATE INDEX idx_events_org ON events(org_id);
CREATE INDEX idx_stop_signs_event ON stop_signs(event_id);
CREATE INDEX idx_riders_event ON riders(event_id);
CREATE INDEX idx_riders_auth_token ON riders(auth_token);
CREATE INDEX idx_oauth_tokens_rider ON oauth_tokens(rider_id);
CREATE INDEX idx_compliance_results_rider ON compliance_results(rider_id);
CREATE INDEX idx_compliance_results_event ON compliance_results(event_id);
CREATE INDEX idx_rider_summaries_event ON rider_summaries(event_id);
