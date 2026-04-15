import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setupAdmin() {
  const email = 'jeswinjoeanil@gmail.com';
  const password = '123456';

  console.log('Step 1: Trying to sign up admin account...');
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });

  if (signUpError) {
    if (signUpError.message.includes('already registered') || signUpError.message.includes('already been registered')) {
      console.log('Account already exists. Trying to sign in to get the UID...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        console.error('Sign in failed:', signInError.message);
        console.log('\n⚠️  The account exists but the password may be different.');
        console.log('Please go to Supabase Dashboard > Authentication > Users');
        console.log('Find jeswinjoeanil@gmail.com and use "Send password reset" or delete and re-run this script.');
        return;
      }
      const uid = signInData.user.id;
      await upsertAdminProfile(uid, email);
    } else {
      console.error('Sign up error:', signUpError.message);
    }
    return;
  }

  const uid = signUpData.user?.id;
  if (!uid) {
    console.error('No UID returned from sign up');
    return;
  }
  console.log('Account created! UID:', uid);
  await upsertAdminProfile(uid, email);
}

async function upsertAdminProfile(uid, email) {
  console.log('\nStep 2: Removing old admin records (if any)...');
  
  // Remove old non-admin records for this email
  await supabase.from('users').delete().eq('email', 'jeswinjoeanil5@gmail.com');
  await supabase.from('users').delete().eq('email', 'aniljoseph29@gmail.com');

  console.log('Step 3: Upserting admin profile...');
  const { data, error } = await supabase.from('users').upsert({
    uid,
    email,
    displayName: 'Admin',
    phoneNumber: '9846422644',
    role: 'admin',
    membershipType: 'none',
  }, { onConflict: 'uid' });

  if (error) {
    console.error('Profile upsert error:', error.message);
  } else {
    console.log('\n✅ Admin setup complete!');
    console.log('Email:', email);
    console.log('Password: 123456');
    console.log('Role: admin');
  }
}

setupAdmin();
