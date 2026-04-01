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
    setText("profileName", profile.name || user.email || "User");
    setText("profileEmail", profile.email || user.email || "-");
    setText("profilePhone", profile.phone);
    setText("profileGender", profile.gender);
    setText("profileDob", profile.dob);
    setText("profileAge", profile.age);
    setText("profileBlood", profile.blood_group);
    setText("profileHeight", profile.height);
    setText("profileWeight", profile.weight);

    showError("profileError", "");
  }

  document.addEventListener("DOMContentLoaded", function () {
    var client = getSupabaseClient();

    hydrateHomeName(client);
    hydrateProfile(client);

    var logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn && client) {
      logoutBtn.addEventListener("click", async function () {
        await client.auth.signOut();
        window.location.href = "login.html";
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
