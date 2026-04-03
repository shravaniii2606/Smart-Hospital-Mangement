const DOCTOR_STORAGE_KEY = "healthsphere-hospital-doctors";

const defaultDoctors = [
  {
    id: "doc-1001",
    name: "Dr. Priya Nair",
    specialty: "Cardiologist",
    experience: "12 years",
    availability: "Mon - Fri, 9:00 AM - 3:00 PM",
    email: "priya.nair@healthsphere.demo",
    phone: "+91 98765 12001",
    bio: "Specializes in preventive cardiology, echocardiography, and long-term cardiac care planning."
  },
  {
    id: "doc-1002",
    name: "Dr. Arjun Mehta",
    specialty: "Orthopedic Surgeon",
    experience: "9 years",
    availability: "Tue - Sat, 11:00 AM - 5:00 PM",
    email: "arjun.mehta@healthsphere.demo",
    phone: "+91 98765 12002",
    bio: "Focuses on trauma management, sports injuries, and post-operative mobility rehabilitation."
  },
  {
    id: "doc-1003",
    name: "Dr. Sana Iqbal",
    specialty: "Pediatrician",
    experience: "7 years",
    availability: "Mon - Sat, 10:00 AM - 4:00 PM",
    email: "sana.iqbal@healthsphere.demo",
    phone: "+91 98765 12003",
    bio: "Provides child wellness support, vaccination guidance, and routine developmental care."
  }
];

function loadDoctors() {
  const rawDoctors = localStorage.getItem(DOCTOR_STORAGE_KEY);

  if (!rawDoctors) {
    localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(defaultDoctors));
    return [...defaultDoctors];
  }

  try {
    const parsedDoctors = JSON.parse(rawDoctors);

    if (Array.isArray(parsedDoctors) && parsedDoctors.length) {
      return parsedDoctors;
    }
  } catch (error) {
  }

  localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(defaultDoctors));
  return [...defaultDoctors];
}

function saveDoctors(doctors) {
  localStorage.setItem(DOCTOR_STORAGE_KEY, JSON.stringify(doctors));
}

function getDoctorById(id) {
  return loadDoctors().find((doctor) => doctor.id === id);
}

function upsertDoctor(doctorData) {
  const doctors = loadDoctors();
  const doctorIndex = doctors.findIndex((doctor) => doctor.id === doctorData.id);

  if (doctorIndex >= 0) {
    doctors[doctorIndex] = doctorData;
  } else {
    doctors.push(doctorData);
  }

  saveDoctors(doctors);
}

function deleteDoctor(id) {
  const doctors = loadDoctors().filter((doctor) => doctor.id !== id);
  saveDoctors(doctors);
}

function generateDoctorId() {
  return "doc-" + Date.now();
}
