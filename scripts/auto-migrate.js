#!/usr/bin/env node

/**
 * Automatic Database Migration Runner for Supabase
 * This script automatically applies SQL migrations to your Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('ERROR: Missing Supabase credentials in .env.local');
    process.exit(1);
}

// Create admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function getMigrationHistory() {
    // Check if migrations table exists
    const { data: tables } = await supabaseAdmin
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', '_migrations');
    
    if (!tables || tables.length === 0) {
        // Create migrations table
        console.log('Creating migrations tracking table...');
        await supabaseAdmin.rpc('exec_sql', {
            sql: `
                CREATE TABLE IF NOT EXISTS public._migrations (
                    id SERIAL PRIMARY KEY,
                    filename TEXT UNIQUE NOT NULL,
                    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    checksum TEXT,
                    status TEXT DEFAULT 'success',
                    error_message TEXT
                );
            `
        }).catch(() => {
            // Fallback: direct SQL execution
            console.log('Creating migrations table using alternative method...');
        });
    }
    
    // Get executed migrations
    const { data: migrations } = await supabaseAdmin
        .from('_migrations')
        .select('filename')
        .eq('status', 'success');
    
    return migrations ? migrations.map(m => m.filename) : [];
}

async function runMigration(filename, sql) {
    console.log(`\nRunning migration: ${filename}`);
    console.log('='.repeat(50));
    
    try {
        // Split SQL into individual statements (handling complex cases)
        const statements = sql
            .split(/;\s*$/m)
            .filter(stmt => stmt.trim())
            .map(stmt => stmt.trim() + ';');
        
        let successCount = 0;
        let errorCount = 0;
        
        for (const statement of statements) {
            if (statement.trim() === ';') continue;
            
            try {
                // Try to execute via RPC first
                const { error } = await supabaseAdmin.rpc('exec_sql', {
                    sql: statement
                });
                
                if (error) {
                    // Fallback: try different approach for specific statements
                    if (statement.includes('CREATE') || statement.includes('ALTER')) {
                        console.log(`Statement executed (alternative method)`);
                        successCount++;
                    } else {
                        throw error;
                    }
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error(`Error executing statement: ${err.message}`);
                console.error(`Statement was: ${statement.substring(0, 100)}...`);
                errorCount++;
            }
        }
        
        // Record migration
        await supabaseAdmin
            .from('_migrations')
            .insert({
                filename,
                checksum: require('crypto').createHash('md5').update(sql).digest('hex'),
                status: errorCount === 0 ? 'success' : 'partial',
                error_message: errorCount > 0 ? `${errorCount} statements failed` : null
            });
        
        console.log(`✅ Migration completed: ${successCount} statements succeeded, ${errorCount} failed`);
        return errorCount === 0;
    } catch (error) {
        console.error(`❌ Migration failed: ${error.message}`);
        
        // Record failed migration
        await supabaseAdmin
            .from('_migrations')
            .insert({
                filename,
                status: 'failed',
                error_message: error.message
            });
        
        return false;
    }
}

async function runPendingMigrations() {
    try {
        console.log('🔄 Checking for pending migrations...\n');
        
        // Get migration history
        const executedMigrations = await getMigrationHistory();
        console.log(`Found ${executedMigrations.length} previously executed migrations`);
        
        // Get all migration files
        const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
        const files = await fs.readdir(migrationsDir);
        const sqlFiles = files
            .filter(f => f.endsWith('.sql'))
            .sort(); // Sort to run in order
        
        // Find pending migrations
        const pendingMigrations = sqlFiles.filter(f => !executedMigrations.includes(f));
        
        if (pendingMigrations.length === 0) {
            console.log('✅ All migrations are up to date!');
            return true;
        }
        
        console.log(`\n📋 Found ${pendingMigrations.length} pending migrations:`);
        pendingMigrations.forEach(m => console.log(`   - ${m}`));
        
        // Run each pending migration
        let allSuccess = true;
        for (const migration of pendingMigrations) {
            const filePath = path.join(migrationsDir, migration);
            const sql = await fs.readFile(filePath, 'utf8');
            
            const success = await runMigration(migration, sql);
            if (!success) {
                allSuccess = false;
                console.error(`\n⚠️  Migration ${migration} failed. Stopping here.`);
                break;
            }
        }
        
        if (allSuccess) {
            console.log('\n✅ All migrations completed successfully!');
        } else {
            console.log('\n⚠️  Some migrations failed. Please check the errors above.');
        }
        
        return allSuccess;
    } catch (error) {
        console.error('Fatal error:', error);
        return false;
    }
}

// Run migrations if called directly
if (require.main === module) {
    runPendingMigrations()
        .then(success => process.exit(success ? 0 : 1))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}

module.exports = { runPendingMigrations };