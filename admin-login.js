/* =========================================================
   CHARCOAL MARKETPLACE
   PI ADMIN LOGIN
   PI SDK AUTHENTICATION + WALLET PERMISSION
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
   PI SDK + WALLET ADDRESS PERMISSION
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

    Pi.init({
      version: "2.0"
    });


    console.log(
      "✅ Pi SDK initialized"
    );


    /* -----------------------------------------------------
       PI AUTHENTICATION
       REQUIRE:
       - username
       - wallet_address
    ----------------------------------------------------- */

    msg.innerText =
      "Requesting administrator wallet permission...";


    const auth =
      await Pi.authenticate(
        [
          "username",
          "wallet_address"
        ]
      );


    /* -----------------------------------------------------
       BASIC AUTH RESPONSE CHECK
    ----------------------------------------------------- */

    if (
      !auth ||
      !auth.accessToken ||
      !auth.user
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
      "✅ Pi authentication successful",
      {
        username:
          auth.user.username,

        uid:
          auth.user.uid,

        wallet_address:
          auth.user.wallet_address || null
      }
    );


    /* -----------------------------------------------------
       REQUIRE WALLET ADDRESS
    ----------------------------------------------------- */

    const walletAddress =
      auth.user.wallet_address;


    if (!walletAddress) {

      console.error(
        "❌ Pi wallet address permission was not granted.",
        auth
      );


      msg.innerText =
        "Wallet permission is required for Administrator Login. Please allow wallet access and try again.";

      return;

    }


    /*
      Basic public Pi wallet format check.

      A valid Pi/Stellar public wallet address begins
      with G and contains 56 characters total.
    */

    if (
      !/^G[A-Z2-7]{55}$/.test(
        String(walletAddress).trim()
      )
    ) {

      console.error(
        "❌ Invalid Pi wallet address returned by Pi:",
        walletAddress
      );


      msg.innerText =
        "Pi returned an invalid wallet address. Please try again.";

      return;

    }


    console.log(
      "💳 Pi wallet permission verified."
    );


    msg.innerText =
      "Wallet verified. Verifying administrator account...";


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
          data.message,

        wallet_verified:
          data.wallet_verified
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
       REQUIRE BACKEND WALLET VERIFICATION
    ----------------------------------------------------- */

    if (
      data.wallet_verified !== true
    ) {

      console.error(
        "❌ Backend did not confirm wallet verification:",
        data
      );


      msg.innerText =
        "Administrator wallet verification failed.";

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
       VERIFY WALLET STORED BY BACKEND
    ----------------------------------------------------- */

    if (
      !data.user.pi_wallet_address
    ) {

      console.error(
        "❌ Backend did not return a verified wallet address:",
        data.user
      );


      msg.innerText =
        "Administrator wallet address could not be verified.";

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
          data.user.admin_level,

        wallet_address:
          data.user.pi_wallet_address
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


    /*
      Give a more useful message when the user
      rejects the wallet permission.
    */

    const errorText =
      String(
        error?.message ||
        error ||
        ""
      ).toLowerCase();


    if (
      errorText.includes("wallet") ||
      errorText.includes("permission") ||
      errorText.includes("scope")
    ) {

      msg.innerText =
        "Wallet permission is required for Administrator Login. Please allow it and try again.";

    } else {

      msg.innerText =
        "Pi administrator authentication failed.";

    }

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