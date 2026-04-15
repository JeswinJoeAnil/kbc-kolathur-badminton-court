import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Force confirm the email by signing up again — Supabase will auto-confirm since confirmation is now off
console.log('Re-confirming admin account...');

// Sign in to verify current state
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'jeswinjoeanil@gmail.com',
  password: '123456'
});

if (signInError) {
  console.error('Sign in error:', signInError.message);
  console.log('\nThe email may still be unconfirmed in the database.');
  console.log('Please run this SQL in Supabase SQL Editor:');
  console.log(`
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmation_token = '',
    confirmation_sent_at = NULL
WHERE email = 'jeswinjoeanil@gmail.com';
  `);
} else {
  console.log('SUCCESS! Login works.');
  console.log('User:', signInData.user.email);
  console.log('Email confirmed at:', signInData.user.email_confirmed_at);
  await supabase.auth.signOut();
}
