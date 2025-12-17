/**
 * Delete a theme by name
 * Usage: node server/scripts/delete-theme-by-name.js "Theme Name"
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteThemeByName(themeName) {
  try {
    console.log(`🔍 Searching for theme: "${themeName}"...`);
    
    // First, try exact match
    let { data: themes, error: findError } = await supabase
      .from('themes')
      .select('id, name, is_active')
      .eq('name', themeName);

    // If not found, try case-insensitive search
    if (!themes || themes.length === 0) {
      console.log(`   Trying case-insensitive search...`);
      const { data: allThemes } = await supabase
        .from('themes')
        .select('id, name, is_active');
      
      if (allThemes) {
        themes = allThemes.filter(t => 
          t.name.toLowerCase().includes(themeName.toLowerCase())
        );
        findError = null;
      }
    }

    if (findError) {
      throw findError;
    }

    if (!themes || themes.length === 0) {
      console.log(`❌ Theme "${themeName}" not found.`);
      return;
    }

    if (themes.length > 1) {
      console.log(`⚠️  Multiple themes found with name "${themeName}":`);
      themes.forEach((theme, index) => {
        console.log(`   ${index + 1}. ID: ${theme.id}, Active: ${theme.is_active}`);
      });
      console.log('❌ Please delete them individually by ID or rename them first.');
      return;
    }

    const theme = themes[0];
    console.log(`✅ Found theme: ID=${theme.id}, Name="${theme.name}", Active=${theme.is_active}`);

    // Check if any users are using this theme
    const { data: usersUsingTheme, error: checkError } = await supabase
      .from('user_theme_selections')
      .select('user_id')
      .eq('theme_id', theme.id)
      .limit(1);

    if (checkError) {
      throw checkError;
    }

    if (usersUsingTheme && usersUsingTheme.length > 0) {
      console.log(`⚠️  Theme is in use by ${usersUsingTheme.length} user(s). Deactivating instead of deleting...`);
      // Soft delete - deactivate
      const { error: updateError } = await supabase
        .from('themes')
        .update({ is_active: false })
        .eq('id', theme.id);

      if (updateError) {
        throw updateError;
      }
      console.log(`✅ Theme "${themeName}" has been deactivated.`);
    } else {
      // Hard delete - no users are using it
      const { error: deleteError } = await supabase
        .from('themes')
        .delete()
        .eq('id', theme.id);

      if (deleteError) {
        throw deleteError;
      }
      console.log(`✅ Theme "${themeName}" has been deleted.`);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get theme name from command line arguments
const themeName = process.argv[2];

if (!themeName) {
  console.error('❌ Please provide a theme name as an argument.');
  console.log('Usage: node server/scripts/delete-theme-by-name.js "Theme Name"');
  process.exit(1);
}

deleteThemeByName(themeName);





