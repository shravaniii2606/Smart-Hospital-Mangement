(function () {
  "use strict";

  var SUPABASE_URL = "https://nfmzosvedtieicnfbmlh.supabase.co";
  var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mbXpvc3ZlZHRpZWljbmZibWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzk1MDgsImV4cCI6MjA5MDYxNTUwOH0.UWGk4L8AQu-5NfpknMKizvFmAcyX6QgUmqOGSr1G6Wc";

  function getSupabaseClient() {
    if (typeof supabase === "undefined" || !supabase.createClient) {
      return null;
    }
    return supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  function redirectToHome() {
    window.location.href = "patient_home.html";
  }

  function showError(targetId, message) {
    var errorEl = document.getElementById(targetId);
    if (!errorEl) {
      return;
    }
    errorEl.textContent = message;
    errorEl.hidden = !message;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.textContent = value || "-";
  }

  function calculateAgeFromDob(dobValue) {
    if (!dobValue) {
      return "";
    }

    var dob = new Date(dobValue + "T00:00:00");
    if (Number.isNaN(dob.getTime())) {
      return "";
    }

    var today = new Date();
    var years = today.getFullYear() - dob.getFullYear();
    var months = today.getMonth() - dob.getMonth();

    if (today.getDate() < dob.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) {
      return "";
    }

    var yearLabel = years === 1 ? "year" : "years";
    var monthLabel = months === 1 ? "month" : "months";
    return years + " " + yearLabel + " " + months + " " + monthLabel;
  }

  function formatUnitValue(value, unit) {
    if (value === null || value === undefined) {
      return "-";
    }

    var text = String(value).trim();
    if (!text) {
      return "-";
    }

    if (text.toLowerCase().indexOf(unit.toLowerCase()) !== -1) {
      return text;
    }

    return text + " " + unit;
  }

  function setInputValue(id, value) {
    var el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.value = value || "";
  }

  function toggleProfileEditMode(isEditing) {
    var viewEl = document.getElementById("profileView");
    var formEl = document.getElementById("profileEditForm");
    var editBtn = document.getElementById("profileEditBtn");
    var saveBtn = document.getElementById("profileSaveBtn");
    var cancelBtn = document.getElementById("profileCancelBtn");

    if (viewEl) {
      viewEl.hidden = !!isEditing;
    }
    if (formEl) {
      formEl.hidden = !isEditing;
    }
    if (editBtn) {
      editBtn.hidden = !!isEditing;
    }
    if (saveBtn) {
      saveBtn.hidden = !isEditing;
    }
    if (cancelBtn) {
      cancelBtn.hidden = !isEditing;
    }
  }

  function populateProfileForm(profile, user) {
    setInputValue("profileEditName", profile.name || "");
    setInputValue("profileEditEmail", profile.email || user.email || "");
    setInputValue("profileEditPhone", profile.phone || "");
    setInputValue("profileEditGender", profile.gender || "");
    setInputValue("profileEditDob", profile.dob || "");
    setInputValue("profileEditAge", calculateAgeFromDob(profile.dob || ""));
    setInputValue("profileEditBlood", profile.blood_group || "");
    setInputValue("profileEditHeight", profile.height || "");
    setInputValue("profileEditWeight", profile.weight || "");
  }

  function renderProfileView(profile, user) {
    setText("profileName", profile.name || user.email || "User");
    setText("profileEmail", profile.email || user.email || "-");
    setText("profilePhone", profile.phone);
    setText("profileGender", profile.gender);
    setText("profileDob", profile.dob);
    setText("profileAge", profile.age || calculateAgeFromDob(profile.dob || ""));
    setText("profileBlood", profile.blood_group);
    setText("profileHeight", formatUnitValue(profile.height, "ft"));
    setText("profileWeight", formatUnitValue(profile.weight, "kg"));
  }

  function bindAgeAutoCalculation(dobId, ageId) {
    var dobInput = document.getElementById(dobId);
    var ageInput = document.getElementById(ageId);
    if (!dobInput || !ageInput || dobInput.dataset.ageBound === "true") {
      return;
    }

    var updateAge = function () {
      ageInput.value = calculateAgeFromDob(dobInput.value);
    };

    dobInput.dataset.ageBound = "true";
    dobInput.addEventListener("change", updateAge);
    dobInput.addEventListener("input", updateAge);
    updateAge();
  }

  function bindDobBounds(dobId) {
    var dobInput = document.getElementById(dobId);
    if (!dobInput) {
      return;
    }

    var today = new Date();
    var max = today.toISOString().split("T")[0];
    var minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
    var min = minDate.toISOString().split("T")[0];
    dobInput.min = min;
    dobInput.max = max;
  }

  async function saveProfile(client) {
    if (!client) {
      showError("profileError", "Supabase client not loaded.");
      return;
    }

    var userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data || !userResult.data.user) {
      showError("profileError", "Please login to update your profile.");
      return;
    }

    var user = userResult.data.user;
    var dob = (document.getElementById("profileEditDob") || {}).value || "";
    var payload = {
      user_id: user.id,
      name: ((document.getElementById("profileEditName") || {}).value || "").trim() || "User",
      email: ((document.getElementById("profileEditEmail") || {}).value || user.email || "").trim(),
      phone: ((document.getElementById("profileEditPhone") || {}).value || "").trim(),
      gender: ((document.getElementById("profileEditGender") || {}).value || "").trim(),
      dob: dob,
      age: calculateAgeFromDob(dob),
      blood_group: ((document.getElementById("profileEditBlood") || {}).value || "").trim(),
      height: ((document.getElementById("profileEditHeight") || {}).value || "").trim(),
      weight: ((document.getElementById("profileEditWeight") || {}).value || "").trim()
    };

    var profileResult = await client
      .from("patient_profile")
      .upsert(payload, { onConflict: "user_id" });

    if (profileResult.error) {
      showError("profileError", profileResult.error.message || "Unable to save profile.");
      return;
    }

    await hydrateProfile(client);
    toggleProfileEditMode(false);
    showError("profileError", "");
  }

  function isUpcomingAppointment(appt) {
    if (!appt || !appt.appointment_date) {
      return false;
    }
    var now = new Date();
    var datePart = appt.appointment_date;
    var apptDateOnly = new Date(datePart + "T00:00:00");
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (apptDateOnly > today) {
      return true;
    }
    if (apptDateOnly < today) {
      return false;
    }

    if (!appt.appointment_time) {
      return false;
    }

    var timeParts = appt.appointment_time.split(":");
    var hours = Number(timeParts[0]);
    var minutes = Number(timeParts[1]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return false;
    }

    var apptDateTime = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes
    );

    return apptDateTime > now;
  }

  function renderHomeAppointments(rows) {
    var listEl = document.getElementById("homeAppointmentsList");
    var emptyEl = document.getElementById("homeAppointmentsEmpty");
    if (!listEl || !emptyEl) {
      return;
    }

    if (!rows || rows.length === 0) {
      listEl.innerHTML = "";
      emptyEl.style.display = "block";
      return;
    }

    emptyEl.style.display = "none";
    listEl.innerHTML = rows
      .map(function (appt) {
        return (
          "<div class=\"hs-recent-item\">" +
          "<div>" +
          "<strong>" +
          (appt.doctor_name || "Doctor") +
          "</strong>" +
          "<span>" +
          (appt.doctor_specialty || "Specialist") +
          "</span>" +
          "<span>Date: " +
          (appt.appointment_date || "-") +
          " · Time: " +
          (appt.appointment_time || "-") +
          "</span>" +
          "</div>" +
          "<span class=\"appt-status-badge upcoming\">Upcoming</span>" +
          "</div>"
        );
      })
      .join("");
  }

  function renderHomeBedRecommendation(recommendation) {
    var cardEl = document.getElementById("bedRecommendationCard");
    var emptyEl = document.getElementById("bedRecommendationEmpty");
    var titleEl = document.getElementById("bedRecommendationTitle");
    var messageEl = document.getElementById("bedRecommendationMessage");

    if (!cardEl || !emptyEl || !titleEl || !messageEl) {
      return;
    }

    if (!recommendation) {
      cardEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    titleEl.textContent = "Bed booking recommended";
    messageEl.textContent =
      (recommendation.doctor_name || "Your doctor") +
      " has recommended you to book your bed in advance.";
    cardEl.style.display = "flex";
    emptyEl.style.display = "none";
  }

  function renderHomeBedBooking(booking) {
    var cardEl = document.getElementById("homeBedBookingCard");
    var emptyEl = document.getElementById("homeBedBookingEmpty");
    var titleEl = document.getElementById("homeBedBookingTitle");
    var metaEl = document.getElementById("homeBedBookingMeta");
    var wardEl = document.getElementById("homeBedBookingWard");
    var viewBillBtn = document.getElementById("homeBedBookingViewBill");

    if (!cardEl || !emptyEl || !titleEl || !metaEl || !wardEl) {
      return;
    }

    if (!booking) {
      cardEl.style.display = "none";
      emptyEl.style.display = "block";
      return;
    }

    var ward = String(booking.ward || "").toLowerCase();
    var wardLabel = ward === "icu" ? "ICU ward" : "General ward";
    titleEl.textContent = "City Hospital";
    metaEl.textContent = "Room " + (booking.room_number || "-") + " - Bed " + (booking.bed_number || "-");
    wardEl.textContent = wardLabel;
    cardEl.style.display = "flex";
    emptyEl.style.display = "none";

    if (viewBillBtn) {
      viewBillBtn.style.display = "inline-flex";
    }
  }

  async function findLatestBedRecommendation(client, emails) {
    var uniqueEmails = Array.from(
      new Set(
        (emails || [])
          .map(function (email) {
            return String(email || "").trim().toLowerCase();
          })
          .filter(Boolean)
      )
    );

    if (!uniqueEmails.length) {
      return null;
    }

    var result = await client
      .from("prescriptions")
      .select("doctor_name, created_at, date, bed_required, patient_email")
      .in("patient_email", uniqueEmails)
      .eq("bed_required", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      return null;
    }

    return result.data || null;
  }

  async function loadHomeBedRecommendation(client) {
    if (!client) {
      renderHomeBedRecommendation(null);
      return;
    }

    var userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data || !userResult.data.user) {
      renderHomeBedRecommendation(null);
      return;
    }

    var patientEmail = String(userResult.data.user.email || "").trim().toLowerCase();
    if (!patientEmail) {
      renderHomeBedRecommendation(null);
      return;
    }

    var profileResult = await client
      .from("patient_profile")
      .select("email")
      .eq("user_id", userResult.data.user.id)
      .maybeSingle();

    var recommendation = await findLatestBedRecommendation(client, [
      patientEmail,
      profileResult && profileResult.data ? profileResult.data.email : ""
    ]);

    renderHomeBedRecommendation(recommendation);
  }

  async function loadHomeBedBooking(client) {
    if (!client) {
      renderHomeBedBooking(null);
      return;
    }

    var userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data || !userResult.data.user) {
      renderHomeBedBooking(null);
      return;
    }

    var result = await client
      .from("hospital_bed_requests")
      .select("ward, room_number, bed_number, status, created_at")
      .eq("patient_user_id", userResult.data.user.id)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (result.error) {
      renderHomeBedBooking(null);
      return;
    }

    renderHomeBedBooking(result.data || null);
  }

  function openStoredInvoice() {
    var stored = null;
    try {
      stored = JSON.parse(localStorage.getItem("latestBedInvoice") || "null");
    } catch (error) {
      stored = null;
    }
    if (!stored) {
      return;
    }
    var bed = stored.bed || {};
    var wardLabel = bed.ward === "icu" ? "ICU" : "General";
    var typeLabel = stored.type === "premium" ? "Premium" : "Normal";
    var bedInfo = bed.roomNumber ? ("Room " + bed.roomNumber + " - Bed " + bed.bedNumber) : "Bed not selected";
    var patientName = stored.patient ? stored.patient.name : "Patient";
    var patientEmail = stored.patient ? stored.patient.email : "-";
    var html =
      "<html><head><title>Bed Invoice</title></head><body style=\"font-family: Arial, sans-serif; padding: 24px;\">" +
      "<h2>HealthSphere - Bed Invoice</h2>" +
      "<p><strong>Patient:</strong> " + patientName + " (" + patientEmail + ")</p>" +
      "<p><strong>Hospital:</strong> City Hospital</p>" +
      "<p><strong>Bed:</strong> " + bedInfo + " (" + wardLabel + " ward, " + typeLabel + ")</p>" +
      "<hr />" +
      "<p><strong>Days:</strong> " + (stored.days || 1) + "</p>" +
      "<p><strong>Base Rate:</strong> INR " + Number(stored.base || 0).toLocaleString("en-IN") + "</p>" +
      "<p><strong>Service Charge:</strong> INR " + Number(stored.service || 0).toLocaleString("en-IN") + "</p>" +
      "<p><strong>Total:</strong> INR " + Number(stored.total || 0).toLocaleString("en-IN") + "</p>" +
      "</body></html>";
    var preview = window.open("", "_blank");
    if (preview) {
      preview.document.write(html);
      preview.document.close();
    }
  }

  async function loadHomeAppointments(client) {
    var listEl = document.getElementById("homeAppointmentsList");
    var emptyEl = document.getElementById("homeAppointmentsEmpty");
    if (!listEl || !emptyEl || !client) {
      return;
    }

    var userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data || !userResult.data.user) {
      renderHomeAppointments([]);
      return;
    }

    var userId = userResult.data.user.id;
    var result = await client
      .from("appointments")
      .select("*")
      .eq("user_id", userId)
      .order("appointment_date", { ascending: true })
      .order("appointment_time", { ascending: true });

    if (result.error) {
      renderHomeAppointments([]);
      return;
    }

    var upcoming = (result.data || []).filter(function (appt) {
      return isUpcomingAppointment(appt) && appt.status !== "cancelled";
    });

    renderHomeAppointments(upcoming);
  }

  async function hydrateHomeName(client) {
    var nameEl = document.getElementById("welcomeName");
    if (!nameEl || !client) {
      return;
    }

    var userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data || !userResult.data.user) {
      return;
    }

    var userId = userResult.data.user.id;
    var profileResult = await client
      .from("patient_profile")
      .select("name,email")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileResult.error) {
      return;
    }

    var displayName = "User";
    if (profileResult.data && profileResult.data.name) {
      displayName = profileResult.data.name;
    } else if (profileResult.data && profileResult.data.email) {
      displayName = profileResult.data.email;
    }

    nameEl.textContent = displayName;
  }

  async function hydrateProfile(client) {
    var nameEl = document.getElementById("profileName");
    if (!nameEl || !client) {
      return;
    }

    var userResult = await client.auth.getUser();
    if (userResult.error || !userResult.data || !userResult.data.user) {
      showError("profileError", "Please login to view your profile.");
      return;
    }

    var user = userResult.data.user;
    var profileResult = await client
      .from("patient_profile")
      .select("name,email,phone,gender,dob,age,blood_group,height,weight")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileResult.error) {
      showError("profileError", profileResult.error.message || "Unable to load profile.");
      return;
    }

    var profile = profileResult.data || {};
    renderProfileView(profile, user);
    populateProfileForm(profile, user);

    showError("profileError", "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var client = getSupabaseClient();

    hydrateHomeName(client);
    loadHomeBedRecommendation(client);
    loadHomeBedBooking(client);
    loadHomeAppointments(client);
    hydrateProfile(client);
    bindDobBounds("signupDob");
    bindDobBounds("profileEditDob");
    bindAgeAutoCalculation("signupDob", "signupAge");
    bindAgeAutoCalculation("profileEditDob", "profileEditAge");

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn && client) {
      logoutBtn.addEventListener("click", async function () {
        await client.auth.signOut();
        window.location.href = "login.html";
      });
    }

    var homeBillBtn = document.getElementById("homeBedBookingViewBill");
    if (homeBillBtn) {
      homeBillBtn.addEventListener("click", function () {
        openStoredInvoice();
      });
    }

    var profileEditBtn = document.getElementById("profileEditBtn");
    if (profileEditBtn) {
      profileEditBtn.addEventListener("click", function () {
        toggleProfileEditMode(true);
        showError("profileError", "");
      });
    }

    var profileCancelBtn = document.getElementById("profileCancelBtn");
    if (profileCancelBtn) {
      profileCancelBtn.addEventListener("click", function () {
        toggleProfileEditMode(false);
        showError("profileError", "");
      });
    }

    var profileSaveBtn = document.getElementById("profileSaveBtn");
    if (profileSaveBtn) {
      profileSaveBtn.addEventListener("click", async function () {
        await saveProfile(client);
      });
    }

    var signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!client) {
          showError("signupError", "Supabase client not loaded. Check the script tag.");
          return;
        }

        var nameInput = document.getElementById("signupName");
        var emailInput = document.getElementById("signupEmail");
        var passwordInput = document.getElementById("signupPassword");
        var phoneInput = document.getElementById("signupPhone");
        var genderInput = document.getElementById("signupGender");
        var dobInput = document.getElementById("signupDob");
        var ageInput = document.getElementById("signupAge");
        var bloodInput = document.getElementById("signupBloodGroup");
        var heightInput = document.getElementById("signupHeight");
        var weightInput = document.getElementById("signupWeight");

        if (!emailInput || !passwordInput) {
          showError("signupError", "Signup form is missing required fields.");
          return;
        }

        var name = nameInput ? nameInput.value.trim() : "";
        var email = emailInput.value.trim().toLowerCase();
        var password = passwordInput.value;
        var phone = phoneInput ? phoneInput.value.trim() : "";
        var gender = genderInput ? genderInput.value : "";
        var dob = dobInput ? dobInput.value : "";
        var age = ageInput ? ageInput.value : "";
        var bloodGroup = bloodInput ? bloodInput.value : "";
        var height = heightInput ? heightInput.value : "";
        var weight = weightInput ? weightInput.value : "";

        if (!email || !password) {
          showError("signupError", "Email and password are required.");
          return;
        }

        showError("signupError", "");

        var signUpResult = await client.auth.signUp({
          email: email,
          password: password
        });

        if (signUpResult.error) {
          showError("signupError", signUpResult.error.message || "Signup failed.");
          return;
        }

        var user = signUpResult.data && signUpResult.data.user ? signUpResult.data.user : null;
        if (user && user.id) {
          var profilePayload = {
            user_id: user.id,
            name: name || "User",
            email: email,
            phone: phone,
            gender: gender,
            dob: dob,
            age: age,
            blood_group: bloodGroup,
            height: height,
            weight: weight
          };

          var profileResult = await client
            .from("patient_profile")
            .upsert(profilePayload, { onConflict: "user_id" });

          if (profileResult.error) {
            showError("signupError", profileResult.error.message || "Profile save failed.");
            return;
          }
        }

        redirectToHome();
      });
    }

    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (!client) {
          showError("loginError", "Supabase client not loaded. Check the script tag.");
          return;
        }

        var loginEmailInput = document.getElementById("loginEmail");
        var loginPasswordInput = document.getElementById("loginPassword");

        if (!loginEmailInput || !loginPasswordInput) {
          showError("loginError", "Login form is missing required fields.");
          return;
        }

        var email = loginEmailInput.value.trim().toLowerCase();
        var password = loginPasswordInput.value;

        if (!email || !password) {
          showError("loginError", "Email and password are required.");
          return;
        }

        showError("loginError", "");

        var signInResult = await client.auth.signInWithPassword({
          email: email,
          password: password
        });

        if (signInResult.error) {
          showError("loginError", "Invalid email or password.");
          return;
        }

        redirectToHome();
      });
    }
  });
})();
