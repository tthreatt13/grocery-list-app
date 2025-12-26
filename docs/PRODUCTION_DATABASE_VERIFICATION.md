# Production Database Verification Guide

## Overview

This guide helps ensure that the Railway production database has all required tables and columns. The application uses Alembic migrations to manage database schema changes, and migrations run automatically on every deployment via `backend/start.sh`.

## Automatic Migration Process

### How Migrations Run in Production

1. **On Every Deployment**: The `backend/start.sh` script automatically runs `alembic upgrade head` before starting the FastAPI server
2. **Railway Configuration**: The `railway.json` file specifies `./start.sh` as the start command
3. **No Manual Steps Required**: As long as `DATABASE_URL` is set correctly in Railway, migrations will run automatically

### Verification That Migrations Are Running

Check Railway deployment logs for these messages:

```
Starting application...
Running database migrations...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade ... -> ..., <migration_name>
Starting FastAPI server...
```

## Required Environment Variables

Ensure these are set in Railway's Variables tab:

1. **DATABASE_URL** (Required)
   - Automatically set when PostgreSQL service is added to Railway project
   - Format: `postgresql://user:password@host:port/database`
   - Railway automatically provides this via `${{Postgres.DATABASE_URL}}`

2. **ENVIRONMENT** (Recommended)
   - Set to `production` for production deployments
   - Used by the application to determine environment-specific behavior

3. **CLERK_SECRET_KEY** (Required)
   - Your Clerk secret key for authentication
   - Format: `sk_test_...` or `sk_live_...`

## Database Schema Verification

### Method 1: Use Automated Verification Script (Recommended)

The easiest way to verify the database schema is to use the provided verification script:

```bash
# Run the verification script
railway run python backend/verify_schema.py
```

This script will:

- Check that all required tables exist
- Verify critical columns are present (including recently added ones)
- Check that column types are correct
- Verify the Alembic migration version matches the expected head revision
- Provide a summary of any issues found

**Expected Output (Success):**

```
======================================================================
Database Schema Verification
======================================================================
Database URL: host:port/database

Checking Alembic migration version...
✓ Migration version: d1e2f3a4b5c6 (expected: d1e2f3a4b5c6)

Checking required tables...
✓ Table 'users' exists
✓ Table 'households' exists
...

✅ All required tables and columns are present!
✅ Database schema is fully up to date!
```

### Method 2: Check Migration Status via Railway CLI

```bash
# Install Railway CLI (if not already installed)
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project (if not already linked)
railway link

# Check current migration version
railway run alembic current

# Check migration history
railway run alembic history
```

Expected output should show all migrations applied:

```
90f091a98d1c -> b1f2c3d4e5f6 (head), add meal_type to grocery_items
4801cb88f9d6 -> c7d8e9f0a1b2, change low_stock_threshold to float
c7d8e9f0a1b2 -> d1e2f3a4b5c6 (head), add household_user_preferences table
```

### Method 3: Connect to Database and Verify Tables

```bash
# Connect to Railway PostgreSQL database
railway connect postgres

# Once connected, run these SQL queries:
```

#### Verify All Tables Exist

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables:

- `alembic_version` (tracks migration version)
- `grocery_items`
- `grocery_lists`
- `household_members`
- `household_user_preferences`
- `households`
- `meals`
- `pantry_items`
- `users`

#### Verify Key Columns Exist

**grocery_lists table:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grocery_lists'
ORDER BY ordinal_position;
```

Expected columns:

- `id` (integer)
- `household_id` (integer)
- `name` (character varying)
- `created_at` (timestamp without time zone)
- `updated_at` (timestamp without time zone)
- `is_archived` (boolean) ⚠️ **Important: Added in migration e6680da276e3**

**grocery_items table:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'grocery_items'
ORDER BY ordinal_position;
```

Expected columns:

- `id` (integer)
- `list_id` (integer)
- `name` (character varying)
- `quantity` (character varying, nullable)
- `category` (character varying, nullable)
- `notes` (character varying, nullable)
- `checked` (boolean)
- `meal_type` (character varying, nullable) ⚠️ **Important: Added in migration b1f2c3d4e5f6**
- `created_at` (timestamp without time zone)

**pantry_items table:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pantry_items'
ORDER BY ordinal_position;
```

Expected columns:

- `id` (integer)
- `household_id` (integer)
- `name` (character varying)
- `quantity` (character varying, nullable)
- `category` (character varying, nullable)
- `expiration_date` (timestamp without time zone, nullable)
- `low_stock_threshold` (double precision, nullable) ⚠️ **Important: Changed to float in migration c7d8e9f0a1b2**
- `created_at` (timestamp without time zone)
- `updated_at` (timestamp without time zone)

**household_user_preferences table:**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'household_user_preferences'
ORDER BY ordinal_position;
```

Expected columns:

- `id` (integer)
- `household_id` (integer)
- `user_id` (integer)
- `diet_types` (jsonb, nullable) ⚠️ **Important: Added in migration d1e2f3a4b5c6**
- `cooking_apparatus` (jsonb, nullable)
- `zip_code` (character varying, nullable) ⚠️ **Important: Added in migration e4a05e381069, weekly_weather removed in f7a8b9c0d1e2**
- `previous_meals` (jsonb, nullable)
- `created_at` (timestamp without time zone)
- `updated_at` (timestamp without time zone)

#### Verify Migration Version

```sql
SELECT version_num FROM alembic_version;
```

Expected: `f7a8b9c0d1e2` (the latest migration revision ID)

### Method 4: Test Application Endpoints

If the database schema is correct, these endpoints should work without errors:

```bash
# Health check (should work regardless)
curl https://YOUR_RAILWAY_URL/health

# Test grocery lists endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://YOUR_RAILWAY_URL/api/grocery-lists

# Test pantry endpoint (requires auth)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://YOUR_RAILWAY_URL/api/pantry
```

## Complete Migration List

All migrations that should be applied in production:

1. **90f091a98d1c** - `initial_schema.py`
   - Creates initial database schema with all base tables

2. **b1f2c3d4e5f6** - `add_meal_type_to_grocery_items.py`
   - Adds `meal_type` column to `grocery_items` table

3. **4801cb88f9d6** - `fix_meal_type_capitalization.py`
   - Fixes meal type capitalization issues

4. **c7d8e9f0a1b2** - `change_low_stock_threshold_to_float.py`
   - Changes `low_stock_threshold` from integer to float in `pantry_items` table

5. **d1e2f3a4b5c6** - `add_household_user_preferences.py`
   - Creates `household_user_preferences` table with JSON columns

6. **e6680da276e3** - `add_is_archived_to_grocery_lists.py`
   - Adds `is_archived` column to `grocery_lists` table

7. **e4a05e381069** - `add_zip_code_to_household_user_preferences.py`
   - Adds `zip_code` column to `household_user_preferences` table

8. **f7a8b9c0d1e2** - `remove_weekly_weather_from_preferences.py`
   - Removes `weekly_weather` column from `household_user_preferences` table

## Troubleshooting

### Migrations Not Running

**Symptoms:**

- Application starts but database errors occur
- Missing columns or tables in production
- Migration version not updated

**Solutions:**

1. **Check Railway Logs**

   ```bash
   railway logs
   ```

   Look for migration-related errors or messages

2. **Verify DATABASE_URL is Set**
   - Go to Railway dashboard > Variables tab
   - Ensure `DATABASE_URL` is present and points to PostgreSQL

3. **Manually Run Migrations**

   ```bash
   railway run alembic upgrade head
   ```

4. **Check start.sh is Executable**
   - The Dockerfile should make `start.sh` executable
   - Verify in Railway build logs that permissions are set correctly

### Missing Columns

If specific columns are missing:

1. **Check Migration History**

   ```bash
   railway run alembic history
   ```

2. **Verify Current Version**

   ```bash
   railway run alembic current
   ```

3. **Force Migration Run**

   ```bash
   railway run alembic upgrade head
   ```

4. **If Migrations Are Stuck**

   ```bash
   # Check what migrations are pending
   railway run alembic heads

   # Check current version
   railway run alembic current

   # Run upgrade
   railway run alembic upgrade head
   ```

### Database Connection Issues

**Symptoms:**

- Migrations fail with connection errors
- Application can't connect to database

**Solutions:**

1. **Verify PostgreSQL Service is Running**
   - Check Railway dashboard > PostgreSQL service status

2. **Check DATABASE_URL Format**
   - Should be: `postgresql://user:password@host:port/database`
   - Railway automatically provides this when PostgreSQL is added

3. **Test Connection**
   ```bash
   railway connect postgres
   ```

## Best Practices

1. **Always Check Migration Status After Deployment**
   - Review Railway logs to confirm migrations ran
   - Verify migration version matches expected head revision

2. **Test Schema Changes Locally First**
   - Run migrations against local PostgreSQL before deploying
   - Verify all columns exist in local database

3. **Monitor Railway Logs**
   - Watch for migration errors during deployment
   - Set up alerts for deployment failures

4. **Keep Migration Files in Sync**
   - Ensure all migration files are committed to git
   - Don't skip migrations in production

5. **Document Schema Changes**
   - Update this guide when adding new migrations
   - Note any breaking changes or special considerations

## Quick Verification Checklist

Before considering production database ready:

- [ ] `DATABASE_URL` environment variable is set in Railway
- [ ] PostgreSQL service is running in Railway dashboard
- [ ] Railway deployment logs show migrations running successfully
- [ ] Migration version matches latest revision (`f7a8b9c0d1e2`)
- [ ] All expected tables exist (9 tables including `alembic_version`)
- [ ] `grocery_items` table has `meal_type` column
- [ ] `pantry_items` table has `low_stock_threshold` as float/double precision
- [ ] `household_user_preferences` table exists with JSON columns
- [ ] Application endpoints respond without database errors
- [ ] Health check endpoint returns healthy status

---

_Last updated: December 14, 2025_
