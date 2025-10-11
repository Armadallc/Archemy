import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iuawurdssgbkbavyyvbs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1YXd1cmRzc2dia2Jhdnl5dmJzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg0NTUzMSwiZXhwIjoyMDc0NDIxNTMxfQ.p43LNk28V9bTfvWsbdW8ByZw_lb26-IKoDrHxkvp9fg';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUsers() {
  console.log('🔧 Creating users in Supabase Auth...');
  
  const users = [
    {
      email: 'admin@monarch.com',
      password: 'password123',
      user_metadata: {
        user_id: 'super_admin_monarch_1758946085586',
        role: 'super_admin'
      }
    },
    {
      email: 'driver@monarch.com', 
      password: 'driver123',
      user_metadata: {
        user_id: 'driver_monarch_1758946085586',
        role: 'driver'
      }
    }
  ];

  for (const user of users) {
    try {
      console.log(`Creating user: ${user.email}`);
      
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        user_metadata: user.user_metadata,
        email_confirm: true
      });

      if (error) {
        console.log(`❌ Error creating ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created ${user.email}:`, data.user?.id);
      }
    } catch (error) {
      console.log(`❌ Exception creating ${user.email}:`, error.message);
    }
  }
}

createUsers().then(() => {
  console.log('✅ User creation complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script error:', error);
  process.exit(1);
});




