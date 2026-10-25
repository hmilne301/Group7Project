'use strict';

const SUPABASE_URL = "https://uosadigvzldjrmtkplly.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_iLUxF-SAh1KH0BYPekONCw_uvo-9KWB";

// db is used by every page to talk to Supabase
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);