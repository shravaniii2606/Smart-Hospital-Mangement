const SUPABASE_URL = "https://nfmzosvedtieicnfbmlh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbXpvc3ZlZHRpZWljbmZibWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzk1MDgsImV4cCI6MjA5MDYxNTUwOH0.UWGk4L8AQu-5NfpknMKizvFmAcyX6QgUmqOGSr1G6Wc";
const HOSPITAL_BEDS_TABLE = "hospital_beds";
const HOSPITAL_BED_REQUESTS_TABLE = "hospital_bed_requests";

function getSupabaseClient() {
  if (typeof supabase === "undefined" || !supabase.createClient) {
    throw new Error("Supabase library not loaded. Check the script tag.");
  }
  return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

function normalizeWard(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeStatus(value) {
  return String(value || "").trim().toLowerCase() === "booked" ? "booked" : "available";
}

<<<<<<< HEAD
=======
function normalizeRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "rejected") {
    return normalized;
  }
  return "pending";
}

>>>>>>> 3a44a57e14b8d9d6dcd00350c2336a04326897ec
function normalizeBedRecord(row) {
  return {
    id: row.id,
    ward: normalizeWard(row.ward),
    roomNumber: String(row.room_number || "").trim(),
    bedNumber: String(row.bed_number || "").trim(),
    status: normalizeStatus(row.status)
  };
}

<<<<<<< HEAD
function normalizeRequestStatus(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "approved" || normalized === "rejected") {
    return normalized;
  }
  return "pending";
}

=======
>>>>>>> 3a44a57e14b8d9d6dcd00350c2336a04326897ec
function normalizeBedRequest(row) {
  return {
    id: row.id,
    bedId: row.bed_id,
    ward: normalizeWard(row.ward),
    roomNumber: String(row.room_number || "").trim(),
    bedNumber: String(row.bed_number || "").trim(),
    patientUserId: row.patient_user_id || "",
    patientName: String(row.patient_name || "").trim(),
    patientEmail: String(row.patient_email || "").trim(),
    status: normalizeRequestStatus(row.status),
    createdAt: row.created_at || ""
  };
}

function bedSort(left, right) {
  const wardComparison = left.ward.localeCompare(right.ward, undefined, { sensitivity: "base" });
  if (wardComparison !== 0) {
    return wardComparison;
  }

  const roomComparison = left.roomNumber.localeCompare(right.roomNumber, undefined, {
    numeric: true,
    sensitivity: "base"
  });
  if (roomComparison !== 0) {
    return roomComparison;
  }

  return left.bedNumber.localeCompare(right.bedNumber, undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

async function loadHospitalBeds() {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(HOSPITAL_BEDS_TABLE)
    .select("id, ward, room_number, bed_number, status")
    .order("ward", { ascending: true })
    .order("room_number", { ascending: true })
    .order("bed_number", { ascending: true });

  if (error) {
    console.error("Error loading hospital beds:", error);
    throw new Error(
      error.code === "42P01"
        ? "Supabase table 'hospital_beds' was not found."
        : error.message || "Unable to load hospital beds."
    );
  }

  return (data || []).map(normalizeBedRecord).sort(bedSort);
}

<<<<<<< HEAD
async function findHospitalBed(client, ward, roomNumber, bedNumber) {
  const { data, error } = await client
    .from(HOSPITAL_BEDS_TABLE)
    .select("id, ward, room_number, bed_number, status")
    .eq("ward", normalizeWard(ward))
    .eq("room_number", String(roomNumber || "").trim())
    .eq("bed_number", String(bedNumber || "").trim())
    .maybeSingle();

  if (error) {
    console.error("Error finding hospital bed:", error);
    throw new Error(error.message || "Unable to find hospital bed.");
  }

  return data ? normalizeBedRecord(data) : null;
}

=======
>>>>>>> 3a44a57e14b8d9d6dcd00350c2336a04326897ec
async function getHospitalBedById(id) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(HOSPITAL_BEDS_TABLE)
    .select("id, ward, room_number, bed_number, status")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error loading hospital bed by id:", error);
    throw new Error(error.message || "Unable to load hospital bed.");
  }

  return data ? normalizeBedRecord(data) : null;
}

<<<<<<< HEAD
async function createHospitalBed({ ward, roomNumber, bedNumber, status }) {
  const client = getSupabaseClient();
  const normalizedWard = normalizeWard(ward);
  const normalizedRoom = String(roomNumber || "").trim();
  const normalizedBed = String(bedNumber || "").trim();
  const normalizedStatus = normalizeStatus(status);

  if (!normalizedWard || !normalizedRoom || !normalizedBed) {
    throw new Error("Ward, room number, and bed number are required.");
  }

  const existing = await findHospitalBed(client, normalizedWard, normalizedRoom, normalizedBed);
  if (existing) {
    throw new Error("This bed already exists for the selected ward and room.");
  }

  const { data, error } = await client
    .from(HOSPITAL_BEDS_TABLE)
    .insert({
      ward: normalizedWard,
      room_number: normalizedRoom,
      bed_number: normalizedBed,
      status: normalizedStatus
    })
    .select("id, ward, room_number, bed_number, status")
    .single();

  if (error) {
    console.error("Error creating hospital bed:", error);
    throw new Error(error.message || "Unable to create hospital bed.");
  }

  return normalizeBedRecord(data);
}

=======
>>>>>>> 3a44a57e14b8d9d6dcd00350c2336a04326897ec
async function updateHospitalBedStatus(id, status) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(HOSPITAL_BEDS_TABLE)
    .update({ status: normalizeStatus(status) })
    .eq("id", id)
    .select("id, ward, room_number, bed_number, status")
    .single();

  if (error) {
    console.error("Error updating hospital bed status:", error);
    throw new Error(error.message || "Unable to update bed status.");
  }

  return normalizeBedRecord(data);
}

async function loadBedBookingRequests(status) {
  const client = getSupabaseClient();
  let query = client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .select("id, bed_id, ward, room_number, bed_number, patient_user_id, patient_name, patient_email, status, created_at")
    .order("created_at", { ascending: true });

  if (status) {
    query = query.eq("status", normalizeRequestStatus(status));
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error loading bed booking requests:", error);
    throw new Error(
      error.code === "42P01"
        ? "Supabase table 'hospital_bed_requests' was not found."
        : error.message || "Unable to load bed booking requests."
    );
  }

  return (data || []).map(normalizeBedRequest);
}

async function loadPatientBedBookingRequests(patientUserId) {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .select("id, bed_id, ward, room_number, bed_number, patient_user_id, patient_name, patient_email, status, created_at")
    .eq("patient_user_id", patientUserId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error loading patient bed booking requests:", error);
    throw new Error(error.message || "Unable to load patient bed booking requests.");
  }

  return (data || []).map(normalizeBedRequest);
}

async function createBedBookingRequest({ bedId, patientUserId, patientName, patientEmail }) {
  const client = getSupabaseClient();
  const bed = await getHospitalBedById(bedId);

  if (!bed) {
    throw new Error("Selected bed was not found.");
  }

  if (bed.status !== "available") {
    throw new Error("This bed is no longer available.");
  }

  if (!patientUserId || !patientName || !patientEmail) {
    throw new Error("Patient information is required to request a bed.");
  }

  const { data: existingRequest, error: existingError } = await client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .select("id")
    .eq("bed_id", bedId)
    .eq("patient_user_id", patientUserId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingError) {
    console.error("Error checking existing bed request:", existingError);
    throw new Error(existingError.message || "Unable to check existing bed requests.");
  }

  if (existingRequest) {
    throw new Error("You already have a pending request for this bed.");
  }

  const { data, error } = await client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .insert({
      bed_id: bed.id,
      ward: bed.ward,
      room_number: bed.roomNumber,
      bed_number: bed.bedNumber,
      patient_user_id: patientUserId,
      patient_name: patientName,
      patient_email: patientEmail,
      status: "pending"
    })
    .select("id, bed_id, ward, room_number, bed_number, patient_user_id, patient_name, patient_email, status, created_at")
    .single();

  if (error) {
    console.error("Error creating bed booking request:", error);
    throw new Error(error.message || "Unable to create bed booking request.");
  }

  return normalizeBedRequest(data);
}

async function approveBedBookingRequest(requestId) {
  const client = getSupabaseClient();
  const { data: requestRow, error: requestError } = await client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .select("id, bed_id, ward, room_number, bed_number, patient_user_id, patient_name, patient_email, status, created_at")
    .eq("id", requestId)
    .maybeSingle();

  if (requestError) {
    console.error("Error loading booking request:", requestError);
    throw new Error(requestError.message || "Unable to load booking request.");
  }

  if (!requestRow) {
    throw new Error("Booking request was not found.");
  }

  const request = normalizeBedRequest(requestRow);
  if (request.status !== "pending") {
    throw new Error("Only pending requests can be approved.");
  }

  const bed = await getHospitalBedById(request.bedId);
  if (!bed) {
    throw new Error("Requested bed was not found.");
  }

  if (bed.status !== "available") {
    throw new Error("This bed is no longer available for approval.");
  }

  await updateHospitalBedStatus(request.bedId, "booked");

  const { data: approvedData, error: approveError } = await client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .update({ status: "approved" })
    .eq("id", requestId)
    .select("id, bed_id, ward, room_number, bed_number, patient_user_id, patient_name, patient_email, status, created_at")
    .single();

  if (approveError) {
    console.error("Error approving booking request:", approveError);
    throw new Error(approveError.message || "Unable to approve booking request.");
  }

  const { error: rejectError } = await client
    .from(HOSPITAL_BED_REQUESTS_TABLE)
    .update({ status: "rejected" })
    .eq("bed_id", request.bedId)
    .eq("status", "pending")
    .neq("id", requestId);

  if (rejectError) {
    console.error("Error rejecting competing booking requests:", rejectError);
  }

  return normalizeBedRequest(approvedData);
}
<<<<<<< HEAD

async function seedHospitalBeds(defaultBeds) {
  const currentBeds = await loadHospitalBeds();
  if (currentBeds.length) {
    return currentBeds;
  }

  const rowsToInsert = (defaultBeds || []).map((bed) => ({
    ward: normalizeWard(bed.ward),
    room_number: String(bed.roomNumber || "").trim(),
    bed_number: String(bed.bedNumber || "").trim(),
    status: normalizeStatus(bed.status)
  })).filter((bed) => bed.ward && bed.room_number && bed.bed_number);

  if (!rowsToInsert.length) {
    return [];
  }

  const client = getSupabaseClient();
  const { error } = await client.from(HOSPITAL_BEDS_TABLE).insert(rowsToInsert);
  if (error) {
    console.error("Error seeding hospital beds:", error);
    throw new Error(error.message || "Unable to seed hospital beds.");
  }

  return loadHospitalBeds();
}
=======
>>>>>>> 3a44a57e14b8d9d6dcd00350c2336a04326897ec
