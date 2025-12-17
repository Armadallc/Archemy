/**
 * List all themes
 * Usage: node server/scripts/list-themes.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listThemes() {
  try {
    const { data: themes, error } = await supabase
      .from('themes')
      .select('id, name, is_active, description')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (!themes || themes.length === 0) {
      console.log('No themes found.');
      return;
    }

    console.log(`\n📋 Found ${themes.length} theme(s):\n`);
    themes.forEach((theme, index) => {
      console.log(`${index + 1}. "${theme.name}"`);
      console.log(`   ID: ${theme.id}`);
      console.log(`   Active: ${theme.is_active}`);
      if (theme.description) {
        console.log(`   Description: ${theme.description}`);
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listThemes();






