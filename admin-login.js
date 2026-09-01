/* =========================================================
   CHARCOAL MARKETPLACE
   PI ADMIN LOGIN
   PI SDK AUTHENTICATION ONLY
========================================================= */

const API =
  "https://charcoal-marketplace-main-production.up.railway.app/api";


/* =========================================================
   ELEMENT HELPER
========================================================= */

function getEl(id) {
  return document.getElementById(id);
}


/* =========================================================
   PAGE START
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    console.log(
      "🔐 Pi Admin Login initialized"
    );

    console.log(
      "🌐 API:",
      API
    );

    /*
      Check whether an administrator
      is already authenticated.
    */

    checkExistingAdmin();

  }
);


/* =========================================================
   EXISTING ADMIN CHECK
========================================================= */

async function checkExistingAdmin() {

  const token =
    localStorage.getItem("adminToken");


  /*
    No existing token.
    User remains on the Pi login page.
  */

  if (!token) {

    console.log(
      "ℹ️ No existing admin token found"
    );

    return;

  }


  console.log(
    "🔑 Existing admin token found. Verifying..."
  );


  try {

    const response =
      await fetch(
        `${API}/admin/me`,
        {
          method: "GET",

          headers: {

            Authorization:
              `Bearer ${token}`,

            Accept:
              "application/json"

          }
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    console.log(
      "🔎 Admin verification:",
      {
        status:
          response.status,

        success:
          data.success,

        code:
          data.code,

        message:
          data.message
      }
    );


    /*
      Existing token is valid.
    */

    if (
      response.ok &&
      data.success
    ) {

      console.log(
        "✅ Existing administrator verified"
      );


      window.location.replace(
        "admin.html"
      );


      return;

    }


    /*
      Existing token is invalid.
    */

    console.warn(
      "⚠️ Existing admin token rejected:",
      data
    );


    localStorage.removeItem(
      "adminToken"
    );


  } catch (error) {

    console.error(
      "❌ Existing admin verification failed:",
      error
    );

  }

}


/* =========================================================
   PI ADMIN LOGIN
   PI SDK ONLY
========================================================= */

async function loginWithPi() {

  const msg =
    getEl("msg");

  const btn =
    getEl("piLoginBtn");


  if (!msg || !btn) {

    console.error(
      "❌ Pi login elements not found"
    );

    return;

  }


  /* -------------------------------------------------------
     CHECK PI SDK
  ------------------------------------------------------- */

  if (!window.Pi) {

    console.error(
      "❌ Pi SDK is not available"
    );


    msg.innerText =
      "Please open the marketplace inside Pi Browser.";

    return;

  }


  btn.disabled = true;

  msg.innerText =
    "Connecting to Pi Network...";


  console.log(
    "🟣 Starting Pi administrator authentication..."
  );


  try {

    /* -----------------------------------------------------
       INITIALIZE PI SDK
    ----------------------------------------------------- */

    await Pi.init({
      version: "2.0"
    });


    console.log(
      "✅ Pi SDK initialized"
    );


    /* -----------------------------------------------------
       PI AUTHENTICATION
    ----------------------------------------------------- */

    const auth =
      await Pi.authenticate(
        [
          "username",
          "wallet_address"
        ],
        function (payment) {
          console.log(
            "[PI AUTH] Incomplete payment found:",
            payment
          );
        }
      );


    if (
      !auth ||
      !auth.accessToken
    ) {

      console.error(
        "❌ Invalid Pi authentication response:",
        auth
      );


      msg.innerText =
        "Pi authentication failed.";

      return;

    }


    console.log(
      "✅ Pi authentication successful"
    );


    msg.innerText =
      "Verifying administrator account...";


    /* -----------------------------------------------------
       SEND PI TOKEN TO BACKEND
    ----------------------------------------------------- */

    const response =
      await fetch(
        `${API}/auth/pi-admin-login`,
        {
          method: "POST",

          headers: {

            "Content-Type":
              "application/json",

            Accept:
              "application/json"

          },

          body:
            JSON.stringify({

              accessToken:
                auth.accessToken

            })

        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    console.log(
      "🔎 Pi admin verification response:",
      {
        status:
          response.status,

        success:
          data.success,

        code:
          data.code,

        message:
          data.message
      }
    );


    /* -----------------------------------------------------
       BACKEND LOGIN FAILED
    ----------------------------------------------------- */

    if (
      !response.ok ||
      !data.success ||
      !data.token
    ) {

      console.error(
        "❌ Pi administrator verification rejected:",
        data
      );


      msg.innerText =
        data.message ||
        "Pi admin login failed.";


      return;

    }


    /* -----------------------------------------------------
       VERIFY ADMIN ROLE
    ----------------------------------------------------- */

    if (
      !data.user ||
      data.user.role !== "admin"
    ) {

      console.error(
        "❌ Pi account authenticated but is not an admin:",
        data.user
      );


      msg.innerText =
        "This Pi account is not an administrator.";


      return;

    }


    /* -----------------------------------------------------
       VERIFY ADMIN STATUS
    ----------------------------------------------------- */

    if (
      data.user.status &&
      data.user.status !== "approved"
    ) {

      console.error(
        "❌ Pi administrator account is not approved:",
        data.user
      );


      msg.innerText =
        "This administrator account is not approved.";


      return;

    }


    /* -----------------------------------------------------
       SAVE ADMIN JWT
    ----------------------------------------------------- */

    localStorage.setItem(
      "adminToken",
      data.token
    );


    console.log(
      "✅ Pi administrator JWT saved successfully"
    );


    console.log(
      "👑 Administrator:",
      {
        id:
          data.user.id,

        username:
          data.user.pi_username,

        role:
          data.user.role,

        status:
          data.user.status,

        admin_level:
          data.user.admin_level
      }
    );


    msg.innerText =
      "Admin verification successful ✔";


    /* -----------------------------------------------------
       REDIRECT TO ADMIN DASHBOARD
    ----------------------------------------------------- */

    setTimeout(
      () => {

        window.location.replace(
          "admin.html"
        );

      },
      500
    );


  } catch (error) {

    console.error(
      "❌ Pi administrator authentication error:",
      error
    );


    msg.innerText =
      "Pi administrator authentication failed.";

  } finally {

    btn.disabled = false;

  }

}


/* =========================================================
   LOGOUT HELPER
========================================================= */

function logoutAdmin() {

  console.log(
    "🚪 Logging out administrator..."
  );


  localStorage.removeItem(
    "adminToken"
  );


  window.location.replace(
    "admin-login.html"
  );

}