#!/usr/bin/env node

/**
 * Database Setup Script for Persona.AI
 *
 * This script helps set up the required Supabase database schema.
 * Run this after setting up your Supabase project.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Persona.AI Database Setup');
console.log('============================\n');

const migrationPath = path.join(__dirname, 'supabase', 'migrations', '001_create_practice_sessions.sql');

if (!fs.existsSync(migrationPath)) {
  console.error('❌ Migration file not found:', migrationPath);
  console.log('\nPlease ensure the supabase/migrations/001_create_practice_sessions.sql file exists.');
  process.exit(1);
}

const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

console.log('📋 Database Schema Setup Instructions:');
console.log('=====================================\n');

console.log('1. Go to your Supabase project dashboard:');
console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT_ID\n');

console.log('2. Navigate to the SQL Editor\n');

console.log('3. Copy and paste the following SQL, then click "Run":\n');

console.log('```sql');
console.log(migrationSQL);
console.log('```\n');

console.log('✅ This will create:');
console.log('   - practice_sessions table');
console.log('   - Proper indexes for performance');
console.log('   - Row Level Security (RLS) policies');
console.log('   - User data isolation\n');

console.log('🎯 After running the SQL, your Persona.AI app will be able to save and load practice sessions!\n');

console.log('💡 Alternative: You can also run the SQL directly from the file:');
console.log(`   ${migrationPath}\n`);
