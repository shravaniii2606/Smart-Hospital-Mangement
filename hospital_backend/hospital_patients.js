const SUPABASE_URL = "https://nfmzosvedtieicnfbmlh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbXpvc3ZlZHRpZWljbmZibWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzk1MDgsImV4cCI6MjA5MDYxNTUwOH0.UWGk4L8AQu-5NfpknMKizvFmAcyX6QgUmqOGSr1G6Wc";

function getSupabaseClient() {
  if (typeof supabase === "undefined" || !supabase.createClient) {
    throw new Error("Supabase library not loaded. Check the script tag.");
  }
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function compareAppointments(left, right) {
  const leftDate = left?.appointment_date || "";
  const rightDate = right?.appointment_date || "";
  if (leftDate !== rightDate) {
    return leftDate.localeCompare(rightDate);
  }

  const leftTime = left?.appointment_time || "";
  const rightTime = right?.appointment_time || "";
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

function normalizeAppointment(appointment) {
  return {
    id: appointment.id,
    date: appointment.appointment_date || "-",
    time: appointment.appointment_time || "-",
    doctor: appointment.doctor_name || "Doctor",
    department: appointment.doctor_specialty || "General",
    status: appointment.status || "pending",
    mode: appointment.mode || "-",
    reason: appointment.reason || "-",
    notes: appointment.notes || "",
    token: appointment.token || "-",
    appointment_date: appointment.appointment_date || "",
    appointment_time: appointment.appointment_time || "",
    doctor_id: appointment.doctor_id || null
  };
}

function buildPatientRecord(profile, appointments) {
  const sortedAppointments = (appointments || []).slice().sort(compareAppointments);
  const latestAppointment = sortedAppointments[sortedAppointments.length - 1] || null;
  const latestAppointmentName = latestAppointment?.patient_name || "";
  const latestAppointmentEmail = latestAppointment?.patient_email || "";

  return {
    id: profile.user_id,
    user_id: profile.user_id,
    name: profile.name || latestAppointmentName || profile.email || latestAppointmentEmail || "Patient",
    age: profile.age || "-",
    gender: profile.gender || "-",
    bloodGroup: profile.blood_group || "-",
    phone: profile.phone || "-",
    email: profile.email || latestAppointmentEmail || "-",
    diagnosis: latestAppointment?.reason || "Appointment booked",
    appointments: sortedAppointments.map(normalizeAppointment)
  };
}

function hasCompleteProfile(profile, appointments) {
  if (!profile && !(appointments || []).length) {
    return false;
  }

  const latestAppointment = (appointments || []).slice().sort(compareAppointments).pop() || null;
  const requiredFields = [
    profile?.user_id || latestAppointment?.user_id,
    profile?.name || latestAppointment?.patient_name,
    profile?.email || latestAppointment?.patient_email
  ];

  return requiredFields.every((value) => String(value || "").trim() !== "");
}

async function loadPatients() {
  const supabase = getSupabaseClient();
  const { data: profileRows, error: profilesError } = await supabase
    .from("patient_profile")
    .select("user_id,name,email,phone,gender,dob,age,blood_group,height,weight")
    .order("name", { ascending: true });

  if (profilesError) {
    console.error("Error loading patient profiles:", profilesError);
    return [];
  }

  const userIds = [...new Set((profileRows || []).map((profile) => profile.user_id).filter(Boolean))];
  if (!userIds.length) {
    return [];
  }

  const { data: appointments, error: appointmentsError } = await supabase
    .from("appointments")
    .select("*")
    .in("user_id", userIds)
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (appointmentsError) {
    console.error("Error loading hospital appointments:", appointmentsError);
  }

  const appointmentsByUser = (appointments || []).reduce((map, appointment) => {
    const userId = appointment.user_id;
    if (!userId) {
      return map;
    }
    if (!map[userId]) {
      map[userId] = [];
    }
    map[userId].push(appointment);
    return map;
  }, {});

  return (profileRows || [])
    .filter((profile) => hasCompleteProfile(profile, appointmentsByUser[profile.user_id] || []))
    .map((profile) => buildPatientRecord(profile, appointmentsByUser[profile.user_id] || []))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function getPatientById(id) {
  const patients = await loadPatients();
  return patients.find((patient) => patient.id === id) || null;
}

async function loadPatientAppointments(patientId) {
  const patient = await getPatientById(patientId);
  return patient ? patient.appointments || [] : [];
}
