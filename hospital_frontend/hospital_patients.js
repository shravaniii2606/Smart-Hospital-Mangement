const PATIENT_STORAGE_KEY = "healthsphere-hospital-patients";

const defaultPatients = [
  {
    id: "pat-2001",
    name: "Aarav Sharma",
    age: "32",
    gender: "Male",
    bloodGroup: "B+",
    phone: "+91 98765 22001",
    email: "aarav.sharma@demo.com",
    diagnosis: "Routine cardiac follow-up",
    appointments: [
      { id: "apt-1", date: "2026-04-06", time: "10:30 AM", doctor: "Dr. Priya Nair", department: "Cardiology", status: "Confirmed" },
      { id: "apt-2", date: "2026-04-19", time: "12:00 PM", doctor: "Dr. Priya Nair", department: "Cardiology", status: "Upcoming" }
    ],
    reports: [
      { id: "rep-1", title: "ECG Report", date: "2026-03-20", summary: "Normal sinus rhythm with no acute abnormalities.", fileName: "ecg-report.png", fileType: "image/png", fileData: "" },
      { id: "rep-2", title: "Blood Test", date: "2026-03-22", summary: "CBC values are within expected range.", fileName: "blood-test.jpeg", fileType: "image/jpeg", fileData: "" }
    ]
  },
  {
    id: "pat-2002",
    name: "Meera Joshi",
    age: "27",
    gender: "Female",
    bloodGroup: "O+",
    phone: "+91 98765 22002",
    email: "meera.joshi@demo.com",
    diagnosis: "Orthopedic rehabilitation review",
    appointments: [
      { id: "apt-3", date: "2026-04-08", time: "11:15 AM", doctor: "Dr. Arjun Mehta", department: "Orthopedics", status: "Confirmed" }
    ],
    reports: [
      { id: "rep-3", title: "X-Ray Summary", date: "2026-03-18", summary: "Healing progress is visible with stable alignment.", fileName: "xray-summary.png", fileType: "image/png", fileData: "" }
    ]
  },
  {
    id: "pat-2003",
    name: "Ishita Verma",
    age: "9",
    gender: "Female",
    bloodGroup: "A+",
    phone: "+91 98765 22003",
    email: "parent.ishita@demo.com",
    diagnosis: "Pediatric wellness follow-up",
    appointments: [
      { id: "apt-4", date: "2026-04-11", time: "09:45 AM", doctor: "Dr. Sana Iqbal", department: "Pediatrics", status: "Upcoming" }
    ],
    reports: [
      { id: "rep-4", title: "Growth Assessment", date: "2026-03-15", summary: "Growth and nutrition markers are healthy for age.", fileName: "growth-assessment.jpeg", fileType: "image/jpeg", fileData: "" }
    ]
  }
];

function loadPatients() {
  const rawPatients = localStorage.getItem(PATIENT_STORAGE_KEY);

  if (!rawPatients) {
    localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(defaultPatients));
    return [...defaultPatients];
  }

  try {
    const parsedPatients = JSON.parse(rawPatients);

    if (Array.isArray(parsedPatients) && parsedPatients.length) {
      return parsedPatients;
    }
  } catch (error) {
  }

  localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(defaultPatients));
  return [...defaultPatients];
}

function savePatients(patients) {
  localStorage.setItem(PATIENT_STORAGE_KEY, JSON.stringify(patients));
}

function getPatientById(id) {
  return loadPatients().find((patient) => patient.id === id);
}

function updatePatientRecord(updatedPatient) {
  const patients = loadPatients().map((patient) => {
    return patient.id === updatedPatient.id ? updatedPatient : patient;
  });

  savePatients(patients);
}

function addPatientReport(patientId, report) {
  const patient = getPatientById(patientId);

  if (!patient) {
    return;
  }

  patient.reports = [report, ...(patient.reports || [])];
  updatePatientRecord(patient);
}

function createReportId() {
  return "rep-" + Date.now();
}

function slugifyPatientName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function createDemoPatient(name) {
  const cleanedName = name.trim();
  const slug = slugifyPatientName(cleanedName) || Date.now();

  return {
    id: "pat-custom-" + slug,
    name: cleanedName,
    age: "30",
    gender: "Not Specified",
    bloodGroup: "Unknown",
    phone: "+91 90000 00000",
    email: slug + "@demo.com",
    diagnosis: "General consultation record",
    appointments: [
      {
        id: "apt-custom-" + slug,
        date: "2026-04-12",
        time: "11:00 AM",
        doctor: "Dr. Priya Nair",
        department: "General Review",
        status: "Scheduled"
      }
    ],
    reports: [
      {
        id: "rep-custom-" + slug,
        title: "Initial Assessment",
        date: "2026-04-03",
        summary: "Demo patient record generated from search. You can continue adding reports from the reports page.",
        fileName: "initial-assessment.png",
        fileType: "image/png",
        fileData: ""
      }
    ]
  };
}

function ensurePatientByName(name) {
  const cleanedName = name.trim();

  if (!cleanedName) {
    return null;
  }

  const patients = loadPatients();
  const existingPatient = patients.find((patient) => patient.name.toLowerCase() === cleanedName.toLowerCase());

  if (existingPatient) {
    return existingPatient;
  }

  const newPatient = createDemoPatient(cleanedName);
  patients.push(newPatient);
  savePatients(patients);
  return newPatient;
}
