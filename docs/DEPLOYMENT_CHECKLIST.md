# Deployment Checklist

## Pre-Deployment Checklist

Before deploying database changes to Railway, ensure the following:

### 1. Migration Files

- [ ] All new migration files are committed to git
- [ ] Migration files are in `backend/alembic/versions/`
- [ ] Migration revision IDs are correct (no conflicts)
- [ ] Migration `down_revision` points to the correct previous migration
- [ ] Test migrations locally first: `alembic upgrade head`

### 2. Code Changes

- [ ] All code changes that depend on schema changes are committed
- [ ] Models are updated to match new schema
- [ ] No breaking changes without migration path

### 3. Local Testing

- [ ] Run migrations locally: `alembic upgrade head`
- [ ] Verify schema changes: `alembic current`
- [ ] Test application with new schema locally
- [ ] Run tests: `pytest` (if applicable)

### 4. Railway Configuration

- [ ] `DATABASE_URL` is set in Railway Variables tab
- [ ] `DATABASE_URL` uses format: `${{Postgres.DATABASE_URL}}`
- [ ] PostgreSQL service is running in Railway dashboard
- [ ] `railway.json` has correct `startCommand: "./start.sh"`

## Deployment Process

### Automatic Migration Process

Migrations run automatically on every deployment via `backend/start.sh`:

1. **Railway detects code push** to connected branch (usually `main`)
2. **Builds Docker image** from `backend/Dockerfile`
3. **Runs start.sh** which:
   - Checks `DATABASE_URL` is set
   - Runs `alembic upgrade head`
   - Starts FastAPI server

### Verification Steps

After deployment, verify migrations ran:

#### 1. Check Railway Logs

Look for these messages in Railway deployment logs:

```
==========================================
Starting application...
==========================================
✓ DATABASE_URL is configured

==========================================
Running database migrations...
==========================================
Checking current migration version...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade ... -> ..., <migration_name>
✓ Migrations completed successfully

Current migration version:
<revision_id> (head)
```

#### 2. Verify Migration Version

```bash
# Check current migration version
railway run alembic current

# Should show the latest migration revision ID
```

#### 3. Run Schema Verification

```bash
# Run automated schema verification
railway run python backend/verify_schema.py
```

Expected output:

```
✅ All required tables and columns are present!
✅ Database schema is fully up to date!
```

#### 4. Test Application Endpoints

```bash
# Health check
curl https://YOUR_RAILWAY_URL/health

# Test authenticated endpoints (if applicable)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     https://YOUR_RAILWAY_URL/api/grocery-lists
```

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

   Look for migration errors or warnings

2. **Verify DATABASE_URL**
   - Go to Railway dashboard → Variables tab
   - Ensure `DATABASE_URL` is set correctly
   - Should be: `${{Postgres.DATABASE_URL}}`

3. **Check start.sh is Executable**
   - Verify Dockerfile has: `RUN chmod +x start.sh`
   - Check Railway build logs for permission errors

4. **Manually Run Migrations**
   ```bash
   railway run alembic upgrade head
   ```

### Migration Errors

**Common Issues:**

1. **Migration Conflict**
   - Error: "Multiple heads detected"
   - Solution: Merge migration branches or fix revision chain

2. **Database Connection Error**
   - Error: "Could not connect to database"
   - Solution: Verify `DATABASE_URL` and PostgreSQL service status

3. **Migration Already Applied**
   - Error: "Target database is not up to date"
   - Solution: Check current version with `alembic current`

4. **Missing Migration File**
   - Error: "Can't locate revision identified by..."
   - Solution: Ensure all migration files are committed and deployed

### Rollback Procedure

If a migration causes issues:

```bash
# Check migration history
railway run alembic history

# Downgrade to previous version
railway run alembic downgrade -1

# Or downgrade to specific revision
railway run alembic downgrade <revision_id>
```

**⚠️ Warning:** Only rollback if absolutely necessary. Test rollback locally first.

## Current Migration List

All migrations that should be applied in production (in order):

1. **90f091a98d1c** - `initial_schema.py`
   - Creates initial database schema

2. **b1f2c3d4e5f6** - `add_meal_type_to_grocery_items.py`
   - Adds `meal_type` column to `grocery_items` table

3. **4801cb88f9d6** - `fix_meal_type_capitalization.py`
   - Fixes meal type capitalization

4. **c7d8e9f0a1b2** - `change_low_stock_threshold_to_float.py`
   - Changes `low_stock_threshold` to float in `pantry_items`

5. **d1e2f3a4b5c6** - `add_household_user_preferences.py`
   - Creates `household_user_preferences` table

6. **e6680da276e3** - `add_is_archived_to_grocery_lists.py`
   - Adds `is_archived` column to `grocery_lists` table

7. **e4a05e381069** - `add_zip_code_to_household_user_preferences.py`
   - Adds `zip_code` column to `household_user_preferences` table

8. **f7a8b9c0d1e2** - `remove_weekly_weather_from_preferences.py`
   - Removes `weekly_weather` column from `household_user_preferences` table

9. **626841e03296** - `add_meal_category_to_meals.py`
   - Adds `meal_category` column to `meals` table

10. **1406e9442b77** - `make_meal_name_nullable.py` (CURRENT HEAD)
    - Makes `meals.name` column nullable

## Best Practices

1. **Always Test Locally First**
   - Run migrations against local PostgreSQL
   - Verify schema changes before deploying

2. **Commit Migration Files**
   - Never skip committing migration files
   - Keep migration files in sync with code changes

3. **Monitor Deployment Logs**
   - Always check Railway logs after deployment
   - Look for migration success/failure messages

4. **Verify After Deployment**
   - Run `alembic current` to verify version
   - Test application endpoints
   - Run schema verification script

5. **Document Schema Changes**
   - Update this checklist when adding new migrations
   - Note any breaking changes or special considerations

6. **Use Descriptive Migration Names**
   - Migration filenames should clearly describe the change
   - Include relevant table/column names

## Quick Reference Commands

```bash
# Check current migration version
railway run alembic current

# View migration history
railway run alembic history

# Manually run migrations (if needed)
railway run alembic upgrade head

# Verify database schema
railway run python backend/verify_schema.py

# View Railway logs
railway logs

# Connect to database
railway connect postgres
```

---

_Last updated: December 14, 2025_
