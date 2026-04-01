(function () {
  "use strict";

  var PATIENT_ACCOUNTS_KEY = "patientAccounts";

  function parseJSON(value, fallback) {
    try {
      return JSON.parse(value);
    } catch (err) {
      return fallback;
    }
  }

  function getPatientAccounts() {
    return parseJSON(localStorage.getItem(PATIENT_ACCOUNTS_KEY), []) || [];
  }

  function setPatientAccounts(accounts) {
    localStorage.setItem(PATIENT_ACCOUNTS_KEY, JSON.stringify(accounts));
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

  document.addEventListener("DOMContentLoaded", function () {
    var signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var name = document.getElementById("signupName").value.trim();
        var email = document.getElementById("signupEmail").value.trim().toLowerCase();
        var password = document.getElementById("signupPassword").value;
        var phone = document.getElementById("signupPhone").value.trim();
        var gender = document.getElementById("signupGender").value;
        var dob = document.getElementById("signupDob").value;
        var age = document.getElementById("signupAge").value;
        var bloodGroup = document.getElementById("signupBloodGroup").value;
        var height = document.getElementById("signupHeight").value;
        var weight = document.getElementById("signupWeight").value;

        if (!email || !password) {
          showError("signupError", "Email and password are required.");
          return;
        }

        var accounts = getPatientAccounts();
        var existing = accounts.find(function (account) {
          return account.email === email;
        });

        if (existing) {
          showError("signupError", "An account with this email already exists.");
          return;
        }

        accounts.push({
          name: name || "User",
          email: email,
          password: password,
          phone: phone,
          gender: gender,
          dob: dob,
          age: age,
          bloodGroup: bloodGroup,
          height: height,
          weight: weight
        });

        setPatientAccounts(accounts);
        showError("signupError", "");
        redirectToHome();
      });
    }

    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", function (event) {
        event.preventDefault();

        var email = document.getElementById("loginEmail").value.trim().toLowerCase();
        var password = document.getElementById("loginPassword").value;

        var accounts = getPatientAccounts();
        var match = accounts.find(function (account) {
          return account.email === email && account.password === password;
        });

        if (!match) {
          showError("loginError", "Invalid email or password.");
          return;
        }

        showError("loginError", "");
        redirectToHome();
      });
    }
  });
})();
