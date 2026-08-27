const API =
  "https://charcoal-marketplace-main-production.up.railway.app/api";

const $ = id => document.getElementById(id);


/* =========================================================
   PI INITIALIZATION
========================================================= */

function initPi() {

  if (!window.Pi) {
    return;
  }

  try {

    const piSandbox =
      location.hostname === "sandbox.minepi.com" ||
      localStorage.getItem("PI_SANDBOX") === "true";

    const options = {
      version: "2.0"
    };

    if (piSandbox) {
      options.sandbox = true;
    }

    Pi.init(options);

  } catch (error) {

    console.error(
      "Pi initialization error:",
      error
    );

  }

}


/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

  $("loginSection")
    .classList
    .add("hidden");

  $("registerSection")
    .classList
    .remove("hidden");

  $("registerPrompt")
    .classList
    .add("hidden");

  initPi();

}


/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  $("registerSection")
    .classList
    .add("hidden");

  $("loginSection")
    .classList
    .remove("hidden");

  $("registerPrompt")
    .classList
    .remove("hidden");

  initPi();

}


/* =========================================================
   PI AUTHENTICATION
========================================================= */

async function piAuth() {

  if (!window.Pi) {

    throw new Error(
      "Please open Charcoal Marketplace in Pi Browser."
    );

  }

  initPi();

  return await Pi.authenticate(

    /*
     * username:
     *      Needed for vendor identity.
     *
     * wallet_address:
     *      Needed so Pi can provide the vendor's
     *      current receiving wallet address.
     */
    [
      "username",
      "wallet_address"
    ],

    function (payment) {

      console.log(
        "Incomplete payment:",
        payment
      );

    }

  );

}


/* =========================================================
   PI VENDOR LOGIN
========================================================= */

async function loginWithPi() {

  const btn =
    $("piLoginBtn");

  const msg =
    $("loginMsg");


  btn.disabled = true;

  msg.textContent =
    "Connecting to Pi...";


  try {

    const auth =
      await piAuth();


    if (
      !auth ||
      !auth.accessToken
    ) {

      throw new Error(
        "Pi authentication failed."
      );

    }


    msg.textContent =
      "Verifying your Pi account...";


    const res =
      await fetch(
        `${API}/auth/pi-login`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({
            accessToken:
              auth.accessToken
          })
        }
      );


    const data =
      await res.json();


    if (!res.ok || !data.success) {

      msg.textContent =
        data.message ||
        "Pi login failed.";

      return;

    }


    /* =====================================================
       CHECK VENDOR STATUS
    ===================================================== */

    if (
      data.user?.role === "vendor" &&
      data.user?.status === "approved"
    ) {

      localStorage.setItem(
        "token",
        data.token
      );

      localStorage.setItem(
        "vendorToken",
        data.token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );


      msg.textContent =
        "Vendor login successful ✔";


      window.location.href =
        "vendor-dashboard.html";

      return;

    }


    /* =====================================================
       PENDING APPLICATION
    ===================================================== */

    if (
      data.user?.vendor_status ===
      "pending"
    ) {

      msg.textContent =
        "Your vendor application is still awaiting Admin approval.";

      return;

    }


    /* =====================================================
       REJECTED APPLICATION
    ===================================================== */

    if (
      data.user?.vendor_status ===
      "rejected"
    ) {

      msg.textContent =
        "Your previous vendor application was rejected. You may submit a new application.";

      showRegister();

      return;

    }


    /* =====================================================
       NOT A VENDOR
    ===================================================== */

    msg.textContent =
      "This Pi account is not an approved vendor. Please register as a vendor first.";

    showRegister();


  } catch (error) {

    console.error(
      "Pi vendor login error:",
      error
    );

    msg.textContent =
      error.message ||
      "Pi login failed.";

  } finally {

    btn.disabled = false;

  }

}


/* =========================================================
   VENDOR APPLICATION
========================================================= */

$("vendorForm")
  .addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      const btn =
        $("registerBtn");

      const msg =
        $("registerMsg");


      btn.disabled = true;

      msg.textContent =
        "Verifying Pi account and submitting...";


      try {

        /*
         * Vendor application MUST begin
         * with Pi authentication.
         */

        const auth =
          await piAuth();


        if (
          !auth ||
          !auth.accessToken
        ) {

          throw new Error(
            "Pi authentication failed."
          );

        }


        /* =================================================
           PI WALLET ADDRESS
        ================================================= */

        const walletInput =
          $("piWalletAddress");


        if (!walletInput) {

          throw new Error(
            "Pi wallet address field is missing from the registration form."
          );

        }


        const piWalletAddress =
          walletInput.value.trim();


        /*
         * We still keep your existing
         * registration field.
         *
         * The backend will store it.
         */

        if (!piWalletAddress) {

          throw new Error(
            "Please enter your Pi wallet address."
          );

        }


        const body = {

          accessToken:
            auth.accessToken,

          name:
            $("vendorName")
              .value
              .trim(),

          business_name:
            $("businessName")
              .value
              .trim(),

          business_phone:
            $("businessPhone")
              .value
              .trim(),

          business_location:
            $("businessLocation")
              .value
              .trim(),

          business_description:
            $("businessDescription")
              .value
              .trim(),

          pi_wallet_address:
            piWalletAddress

        };


        const res =
          await fetch(
            `${API}/auth/vendor-register`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify(body)

            }
          );


        const data =
          await res.json();


        if (!res.ok) {

          msg.textContent =
            data.message ||
            "Application failed.";

          return;

        }


        msg.textContent =
          "Application submitted successfully. Please wait for Admin approval.";

        $("vendorForm").reset();


      } catch (error) {

        console.error(
          "Vendor registration error:",
          error
        );

        msg.textContent =
          error.message ||
          "Unable to submit application.";

      } finally {

        btn.disabled = false;

      }

    }
  );


/* =========================================================
   INITIALIZE
========================================================= */

initPi();