
import { createClient } from '@supabase/supabase-js';

// Kullanıcı tarafından sağlanan yeni Supabase kimlik bilgileriyle güncellendi.
export const supabaseUrl = 'https://ftksmrtshyxfnboonnlz.supabase.co';
export const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0a3NtcnRzaHl4Zm5ib29ubmx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4NTE4NjcsImV4cCI6MjA4MDQyNzg2N30.V3e9tAWoz3l4ryJGiLFacNoF-z3qjby_lWTwqEzHx9A';

export const supabase = createClient(supabaseUrl, supabaseKey);
