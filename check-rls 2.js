import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuawurdssgbkbavyyvbs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0NTUzMSwiZXhwIjoyMDc0NDIxNTMxfQ.p43LNk28V9bTfvWsbdW8ByZw_lb26-IKoDrHxkvp9fg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRLS() {
  console.log('🔍 Checking RLS status for all tables...\n');
  
  const tables = [
    'corporate_clients',
    'programs', 
    'locations',
    'users',
    'clients',
    'client_groups',
    'client_group_memberships',
    'drivers',
    'vehicles',
    'trips',
    'frequent_locations'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.rpc('check_rls_enabled', { table_name: table });
      if (error) {
        console.log(`❌ ${table}: Error checking RLS - ${error.message}`);
      } else {
        console.log(`✅ ${table}: RLS ${data ? 'ENABLED' : 'DISABLED'}`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

checkRLS();












