import { supabase } from './minimal-supabase';

async function getToken() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@monarch.com',
    password: 'admin123'
  });
  
  if (error) {
    console.log('Error:', error.message);
  } else {
    console.log('Token:', data.session?.access_token);
  }
}

getToken();

