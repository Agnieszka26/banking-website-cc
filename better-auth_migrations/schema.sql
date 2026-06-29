-- Better Auth schema for Postgres (Supabase).
--
-- Covers the core tables (user, session, account, verification) plus the
-- `username` plugin fields on the user table.
--
-- Apply this in the Supabase SQL editor, or regenerate/apply automatically with
-- the Better Auth CLI once DATABASE_URL points at your database with a valid
-- password:
--   npx @better-auth/cli generate   # writes the schema diff
--   npx @better-auth/cli migrate    # applies it directly

create table if not exists "user" (
	"id" text not null primary key,
	"name" text not null,
	"email" text not null unique,
	"emailVerified" boolean not null default false,
	"image" text,
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now(),
	"username" text unique,
	"displayUsername" text
);

create table if not exists "session" (
	"id" text not null primary key,
	"expiresAt" timestamp not null,
	"token" text not null unique,
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now(),
	"ipAddress" text,
	"userAgent" text,
	"userId" text not null references "user" ("id") on delete cascade
);

create table if not exists "account" (
	"id" text not null primary key,
	"accountId" text not null,
	"providerId" text not null,
	"userId" text not null references "user" ("id") on delete cascade,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp not null default now(),
	"updatedAt" timestamp not null default now()
);

create table if not exists "verification" (
	"id" text not null primary key,
	"identifier" text not null,
	"value" text not null,
	"expiresAt" timestamp not null,
	"createdAt" timestamp default now(),
	"updatedAt" timestamp default now()
);
