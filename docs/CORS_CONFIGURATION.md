# CORS Configuration Guide

## Overview

This guide explains how CORS (Cross-Origin Resource Sharing) is configured for the Grocery List App backend and how to troubleshoot CORS issues.

## Current Configuration

The backend uses FastAPI's `CORSMiddleware` with the following setup:

1. **Exact Origin Matches**: Specific domains listed in `backend/config.py` or the `ALLOWED_ORIGINS` environment variable
2. **Vercel Preview URLs**: Automatic support for any `*.vercel.app` domain via regex pattern matching

## Default Allowed Origins (Code)

The default origins configured in `backend/config.py`:

- `http://localhost:3000` - Local development
- `http://localhost:3001` - Alternative local port
- `https://grocery-list-app-seven.vercel.app` - Production Vercel deployment
- `https://grocery-list-app.vercel.app` - Alternative production domain

## Environment Variable Override

If the `ALLOWED_ORIGINS` environment variable is set in Railway, it **overrides** the default list. This is a comma-separated list of origins.

### Example Railway Configuration

```
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://grocery-list-app-seven.vercel.app,https://grocery-list-app.vercel.app
```

## Vercel Preview URL Support

All Vercel preview URLs (matching `https://*.vercel.app`) are automatically allowed via regex pattern matching, regardless of the `ALLOWED_ORIGINS` setting. This means:

- ✅ `https://grocery-list-app-git-feature-branch.vercel.app` - Allowed
- ✅ `https://grocery-list-app-seven.vercel.app` - Allowed
- ✅ `https://any-preview-name.vercel.app` - Allowed

## Troubleshooting CORS Issues

### Issue: "Access-Control-Allow-Origin header is missing"

**Symptoms:**

- Browser console shows CORS error
- Network tab shows request failed with CORS policy error
- Error message: "No 'Access-Control-Allow-Origin' header is present"

**Solution:**

1. **Check Railway Environment Variables**
   - Go to Railway dashboard → Your backend service → Variables tab
   - Look for `ALLOWED_ORIGINS` variable
2. **If `ALLOWED_ORIGINS` is set:**
   - Ensure your frontend domain is included in the comma-separated list
   - Example: `http://localhost:3000,https://grocery-list-app-seven.vercel.app`
   - Save and redeploy the service
3. **If `ALLOWED_ORIGINS` is NOT set:**
   - The code defaults will be used (which include the common Vercel domains)
   - If your domain is not in the defaults, either:
     - Add it to `backend/config.py` `allowed_origins` list and redeploy, OR
     - Set `ALLOWED_ORIGINS` in Railway with your domain included

4. **For Vercel Preview URLs:**
   - These should work automatically via regex pattern
   - If they don't, check Railway logs to see if the regex is being applied
   - Verify the URL matches `https://*.vercel.app` pattern

### Issue: CORS works locally but not in production

**Possible Causes:**

1. **Environment Variable Override**
   - Railway has `ALLOWED_ORIGINS` set with different domains than your local `.env`
   - Solution: Update Railway `ALLOWED_ORIGINS` to include production domain

2. **Code Not Deployed**
   - Latest code changes haven't been deployed to Railway
   - Solution: Ensure latest code is pushed and Railway has redeployed

3. **Domain Mismatch**
   - Frontend domain doesn't exactly match what's in allowed origins
   - Solution: Check for trailing slashes, `www.` prefix, or protocol differences

### Verifying CORS Configuration

**Check Railway Logs:**

After deployment, check Railway logs for CORS configuration messages:

```
CORS configured origins: ['http://localhost:3000', 'https://grocery-list-app-seven.vercel.app']
CORS also allows any *.vercel.app preview URLs via regex pattern
```

**Test CORS Headers:**

Use curl to test CORS headers:

```bash
curl -H "Origin: https://grocery-list-app-seven.vercel.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: authorization" \
     -X OPTIONS \
     https://grocery-list-app-production-3744.up.railway.app/api/grocery-lists \
     -v
```

Look for these headers in the response:

- `Access-Control-Allow-Origin: https://grocery-list-app-seven.vercel.app`
- `Access-Control-Allow-Credentials: true`
- `Access-Control-Allow-Methods: *`
- `Access-Control-Allow-Headers: *`

## Railway Configuration Steps

### Option 1: Use Code Defaults (Recommended)

1. **Remove `ALLOWED_ORIGINS` from Railway** (if it exists)
2. Ensure `backend/config.py` has your production domain in `allowed_origins`
3. Redeploy the backend service
4. Vercel preview URLs will work automatically via regex

### Option 2: Use Environment Variable

1. Go to Railway dashboard → Backend service → Variables tab
2. Add or edit `ALLOWED_ORIGINS`:
   ```
   http://localhost:3000,http://localhost:3001,https://grocery-list-app-seven.vercel.app,https://grocery-list-app.vercel.app
   ```
3. Save changes (Railway will automatically redeploy)
4. Verify in logs that CORS origins are configured correctly

## Best Practices

1. **Include Common Domains in Code Defaults**
   - Add production domains to `backend/config.py` so they work even if env var is missing

2. **Use Environment Variables for Environment-Specific Domains**
   - Use `ALLOWED_ORIGINS` for domains that differ between staging/production

3. **Leverage Regex for Preview URLs**
   - Don't manually add every Vercel preview URL
   - Use the `*.vercel.app` regex pattern (already configured)

4. **Test After Deployment**
   - Always test CORS after deploying backend changes
   - Check browser console and network tab for CORS errors

## Current Production Setup

- **Backend URL**: `https://grocery-list-app-production-3744.up.railway.app`
- **Frontend URL**: `https://grocery-list-app-seven.vercel.app`
- **CORS Configuration**: Supports exact matches + `*.vercel.app` pattern

---

_Last updated: December 14, 2025_
