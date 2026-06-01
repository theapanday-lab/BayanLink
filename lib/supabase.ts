import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = "https://flyjkmszfdnxqsrypxrl.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZseWprbXN6ZmRueHFzcnlweHJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4OTY1MzAsImV4cCI6MjA5MzQ3MjUzMH0.2QLxvcBBW1x2ZaEZBkKayRXjalhwSWGBTQpmoBLg7SE";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

