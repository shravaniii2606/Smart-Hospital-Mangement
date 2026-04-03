const SUPABASE_URL = "https://nfmzosvedtieicnfbmlh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbXpvc3ZlZHRpZWljbmZibWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzk1MDgsImV4cCI6MjA5MDYxNTUwOH0.UWGk4L8AQu-5NfpknMKizvFmAcyX6QgUmqOGSr1G6Wc";

function getSupabaseClient() {
  if (typeof supabase === "undefined" || !supabase.createClient) {
    throw new Error("Supabase library not loaded. Check the script tag.");
  }
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

async function loadDoctors() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('doctor_profile')
    .select('*');

  if (error) {
    console.error('Error loading doctors:', error);
    return [];
  }
  return data || [];
}

async function getDoctorById(id) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('doctor_profile')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error getting doctor:', error);
    return null;
  }
  return data;
}

async function upsertDoctor(doctorData) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('doctor_profile')
    .upsert(doctorData, { onConflict: 'id' });

  if (error) {
    console.error('Error upserting doctor:', error);
    throw error;
  }
  return data;
}

async function deleteDoctor(id) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('doctor_profile')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting doctor:', error);
    throw error;
  }
}

function generateDoctorId() {
  return "doc-" + Date.now();
}
