# Files Created During Debugging Session

## Files I Created (To Be Deleted)

### SQL Files
- `EMERGENCY_FIX.sql` - Has type mismatch errors
- `SAFE_FIX.sql` - Has view dependency issues  
- `SIMPLE_FIX.sql` - Minimal column additions
- `MINIMAL_WAITLIST_FIX.sql` - Bare minimum fix
- `CHECK_DATABASE.sql` - Database inspection queries
- `supabase/migrations/20250201_add_waitlist_count_view.sql` - View creation

### Shell Scripts
- `fix-production-now.sh` - Quick deployment fix
- `auto-update-improved.sh` - "Improved" deployment (has issues)
- `auto-deploy-complete.sh` - Complex deployment automation
- `setup-auto-deploy.sh` - Setup script for automation
- `deploy.sh` - Main deployment script (KEEP THIS ONE)

### JavaScript/TypeScript Files
- `test-waitlist.js` - Testing script
- `scripts/auto-migrate.js` - Automatic migration runner
- `app/api/debug/check-schema/route.ts` - Debug endpoint
- `app/api/auth/signup-simple-fixed/route.ts` - Attempted fix
- `app/api/auth/signup-minimal/route.ts` - Minimal signup

### Documentation Files
- `DEPLOYMENT_FIXES.md` - Deployment instructions
- `CHECK_PRODUCTION_ISSUES.md` - Production troubleshooting
- `URGENT_SERVER_FIX.md` - Emergency instructions
- `WAITLIST_FIX_INSTRUCTIONS.md` - Waitlist fix guide
- `APP_ANALYSIS.md` - This analysis (KEEP)
- `CLEANUP_AND_FIX_PLAN.md` - Cleanup plan (KEEP)
- `CURRENT_STATE_REALITY.md` - Current state (KEEP)
- `FILES_TO_CLEANUP.md` - This file (KEEP)

## Commands to Clean Up

```bash
# Remove SQL fixes with issues
git rm EMERGENCY_FIX.sql SAFE_FIX.sql SIMPLE_FIX.sql MINIMAL_WAITLIST_FIX.sql CHECK_DATABASE.sql

# Remove test and debug files
git rm test-waitlist.js
git rm -rf app/api/debug/
git rm -rf app/api/auth/signup-simple-fixed/
git rm -rf app/api/auth/signup-minimal/

# Remove extra deployment scripts (keep deploy.sh)
git rm fix-production-now.sh auto-update-improved.sh auto-deploy-complete.sh setup-auto-deploy.sh

# Remove auto-migration
git rm scripts/auto-migrate.js

# Remove debug documentation
git rm DEPLOYMENT_FIXES.md CHECK_PRODUCTION_ISSUES.md URGENT_SERVER_FIX.md WAITLIST_FIX_INSTRUCTIONS.md

# Commit the cleanup
git commit -m "Clean up debug files and failed attempts"
```

## Files to KEEP

### Essential Files
- `deploy.sh` - Main deployment script
- `.env.local` - Environment variables
- Original application files

### Documentation to Keep
- `APP_ANALYSIS.md` - Clear analysis of issues
- `CLEANUP_AND_FIX_PLAN.md` - Action plan
- `CURRENT_STATE_REALITY.md` - Reality check
- `FILES_TO_CLEANUP.md` - This cleanup list

## After Cleanup

The repository should return to its original state plus:
1. One working deployment script
2. Clear documentation of what needs to be fixed
3. A plan to move forward

No more debug files, no more temporary fixes, no more confusion.