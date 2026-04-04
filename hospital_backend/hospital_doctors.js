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

  console.debug('Loaded doctors:', data);
  return data || [];
}

async function getDoctorById(id) {
  const supabase = getSupabaseClient();
  console.debug('getDoctorById called with id:', id);

  // try doc_id first
  let { data, error } = await supabase
    .from('doctor_profile')
    .select('*')
    .eq('doc_id', id)
    .single();

  console.debug('id query result:', { data, error });

  if (error || !data) {
    // fallback to id
    const fallback = await supabase
      .from('doctor_profile')
      .select('*')
      .eq('id', id)
      .single();

    console.debug('doc_id query result:', { data: fallback.data, error: fallback.error });

    if (fallback.error || !fallback.data) {
      console.warn('Doctor not found by id or doc_id:', id, error || fallback.error);
      return null;
    }

    return fallback.data;
  }

  return data;
}

async function loadAppointmentsForDoctor(doctorId) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('doctor_id', doctorId)
    .eq('status', 'pending')
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error) {
    console.error('Error loading appointments for doctor:', error);
    return [];
  }

  console.debug(`Loaded ${data ? data.length : 0} appointments for doctor ${doctorId}`, data);
  return (data || []).sort(compareAppointments);
}

function compareAppointments(left, right) {
  const leftDate = left?.appointment_date || '';
  const rightDate = right?.appointment_date || '';
  if (leftDate !== rightDate) {
    return leftDate.localeCompare(rightDate);
  }

  const leftTime = left?.appointment_time || '';
  const rightTime = right?.appointment_time || '';
  if (leftTime !== rightTime) {
    return leftTime.localeCompare(rightTime);
  }

  const leftToken = Number(left?.token || 0);
  const rightToken = Number(right?.token || 0);
  if (!Number.isNaN(leftToken) && !Number.isNaN(rightToken) && leftToken !== rightToken) {
    return leftToken - rightToken;
  }

  return 0;
}

async function updateAppointmentStatus(appointmentId, status) {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);
  if (error) {
    console.error('Error updating appointment status:', error);
    throw error;
  }
}

async function upsertDoctor(doctorData) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('doctor_profile')
    .upsert(doctorData, { onConflict: 'doc_id' });

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
    .eq('doc_id', id);

  if (error) {
    console.error('Error deleting doctor:', error);
    throw error;
  }
}

function generateDoctorId() {
  return "doc-" + Date.now();
}
