import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lhemetinzammlxnhnmmq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoZW1ldGluemFtbWx4bmhubW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4MjkwMDgsImV4cCI6MjA2OTQwNTAwOH0.pX1upo9TChfPvA2rXslae7AnulvdVaOeFlh788S0Ni4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Aquí puedes poner las URLs de tus logos si las necesitas en algún componente
export const logoBrayanRifas1 = 'https://4tsix0yujj.ufs.sh/f/2vMRHqOYUHc0H5SVxzRcSojWGwvDPb4hl1EOXpnTeqzCZR0g';
export const logoBrayanRifas2 = 'https://4tsix0yujj.ufs.sh/f/2vMRHqOYUHc0iofiuCU3SvywDhA4KtNVcgeG7fQn92ZEUMjC';