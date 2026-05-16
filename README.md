# Hospital Management System

A fullstack hospital management application with 
separate portals for hospital staff and patients. 
Built as a collaborative project to simulate how 
real hospital management systems work.

## Portals

### Hospital Side
- Doctor management and scheduling
- Bed availability and allocation
- Patient records and appointments
- Prescriptions management
- Emergency handling
- Reports generation
- AI assistant for hospital staff

### Patient Side
- Patient registration and login
- Book and manage appointments
- Ambulance booking
- Bed booking and billing
- Medical history form
- Consent form management
- City-wise hospital search
- Prescription viewing
- Profile management

## Project Structure

Shared/
├── hospital_backend/
│   ├── hospital_beds.js
│   ├── hospital_doctors.js
│   └── hospital_patients.js
├── hospital_frontend/
│   ├── doctors.html
│   ├── emergency.html
│   ├── prescriptions.html
│   ├── reports.html
│   └── ...
├── patient_backend/
│   ├── server.js
│   ├── script.js
│   ├── package.json
│   └── supabase/
└── patient_frontend/
    ├── ai.html
    ├── admission_form.html
    ├── ambulance_booking.html
    ├── appointments.html
    ├── bed_availability.html
    ├── bed_billing.html
    ├── book_appointment.html
    ├── book_your_bed.html
    ├── city_hospital.html
    ├── medical_history_form.html
    ├── prescriptions.html
    └── ...

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: Supabase (PostgreSQL)
- AI Integration: OpenAI API
- Version Control: Collaborative Git workflow

## Features

- Dual portal system — separate interfaces for 
  hospital staff and patients
- Real-time appointment sorting with only active 
  patients visible
- AI assistant for medical queries
- Ambulance booking system
- City-wise hospital search
- Bed allocation and billing
- Medical history and consent management
- Emergency handling module

## How to Run Locally

1. Install dependencies:
   cd patient_backend
   npm install

2. Set up environment variables:
   OPENAI_API_KEY=your_key_here
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key

3. Start the backend:
   node server.js

4. Open patient_frontend/index.html 
   or hospital_frontend/index.html in your browser



## What I learned

- Building a large-scale multi-portal application
- Collaborative development using Git
- Supabase as a backend-as-a-service with PostgreSQL
- Node.js and Express.js for backend development
- OpenAI API integration for medical AI assistant
- Managing separate frontend and backend for 
  multiple user roles
