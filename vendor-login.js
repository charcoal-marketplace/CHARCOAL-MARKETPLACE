const API =
  "https://charcoal-marketplace-main-production.up.railway.app/api";

const $ = id => document.getElementById(id);


/* =========================================================
   PI INITIALIZATION
========================================================= */

let piInitialized = false;

async function initPi() {

  if (!window.Pi) {

    throw new Error(
      "Please open Charcoal Marketplace in Pi Browser."
    );

  }


  if (piInitialized) {
    return true;
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


    /*
     * IMPORTANT:
     * Pi.init() returns a Promise.
     * We must wait for it before Pi.authenticate().
     */

    await Pi.init(options);


    piInitialized = true;


    console.log(
      "[PI] Pi SDK initialized successfully."
    );


    return true;


  } catch (error) {

    console.error(
      "[PI] Initialization error:",
      error
    );


    piInitialized = false;


    throw new Error(
      "Unable to initialize Pi. Please open the app in Pi Browser and try again."
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


  /*
   * The wallet address is now obtained/authorized
   * through Pi authentication.
   *
   * We no longer require the vendor to manually
   * type the address.
   *
   * Keep the existing HTML field so the existing
   * page does not break, but make it optional.
   */

  const walletInput =
    $("piWalletAddress");


  if (walletInput) {

    walletInput.required = false;

    walletInput.removeAttribute(
      "required"
    );

  }


  initPi()
    .catch(error => {

      console.error(
        "[PI] Register initialization:",
        error
      );

    });

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


  initPi()
    .catch(error => {

      console.error(
        "[PI] Login initialization:",
        error
      );

    });

}


/* =========================================================
   PI AUTHENTICATION
========================================================= */

async function piAuth() {

  /*
   * Make absolutely sure Pi is initialized
   * before authentication.
   */

  await initPi();


  if (!window.Pi) {

    throw new Error(
      "Please open Charcoal Marketplace in Pi Browser."
    );

  }


  console.log(
    "[PI] Requesting Pi authentication..."
  );


  /*
   * IMPORTANT:
   *
   * username:
   *   Used for vendor identity/display.
   *
   * wallet_address:
   *   Required because the marketplace needs
   *   permission to send vendor earnings to
   *   the vendor through Pi A2U payments.
   *
   * We intentionally do NOT request the vendor's
   * private wallet key/passphrase.
   */

  const auth =
    await Pi.authenticate(

      [
        "username",
        "wallet_address"
      ],

      function (payment) {

        console.log(
          "[PI] Incomplete payment found:",
          payment
        );

      }

    );


  if (
    !auth ||
    !auth.accessToken
  ) {

    throw new Error(
      "Pi authentication did not return an access token."
    );

  }


  console.log(
    "[PI] Pi authentication successful."
  );


  /*
   * The backend receives ONLY the access token.
   *
   * We do NOT trust or send auth.user data to the
   * backend. The backend verifies the token directly
   * with Pi /me.
   */

  return auth;

}


/* =========================================================
   PI VENDOR LOGIN
========================================================= */

async function loginWithPi() {

  const btn =
    $("piLoginBtn");


  const msg =
    $("loginMsg");


  if (btn) {
    btn.disabled = true;
  }


  if (msg) {

    msg.textContent =
      "Connecting to Pi...";

  }


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


    if (msg) {

      msg.textContent =
        "Verifying your Pi account...";

    }


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


    let data;


    try {

      data =
        await res.json();

    } catch (jsonError) {

      throw new Error(
        "The server returned an invalid response."
      );

    }


    if (
      !res.ok ||
      !data.success
    ) {

      if (msg) {

        msg.textContent =
          data.message ||
          "Pi login failed.";

      }


      return;

    }


    /* =====================================================
       APPROVED VENDOR
    ===================================================== */

    if (

      data.user?.role ===
        "vendor" &&

      data.user?.status ===
        "approved"

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
        JSON.stringify(
          data.user
        )
      );


      if (msg) {

        msg.textContent =
          "Vendor login successful ✔";

      }


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

      if (msg) {

        msg.textContent =
          "Your vendor application is still awaiting Admin approval.";

      }


      return;

    }


    /* =====================================================
       REJECTED APPLICATION
    ===================================================== */

    if (
      data.user?.vendor_status ===
      "rejected"
    ) {

      if (msg) {

        msg.textContent =
          "Your previous vendor application was rejected. You may submit a new application.";

      }


      showRegister();


      return;

    }


    /* =====================================================
       NOT A VENDOR
    ===================================================== */

    if (msg) {

      msg.textContent =
        "This Pi account is not an approved vendor. Please register as a vendor first.";

    }


    showRegister();


  } catch (error) {

    console.error(
      "[PI] Vendor login error:",
      error
    );


    if (msg) {

      msg.textContent =
        error.message ||
        "Pi login failed.";

    }


  } finally {

    if (btn) {
      btn.disabled = false;
    }

  }

}


/* =========================================================
   VENDOR APPLICATION
========================================================= */

const vendorForm =
  $("vendorForm");


if (vendorForm) {

  vendorForm.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      const btn =
        $("registerBtn");


      const msg =
        $("registerMsg");


      if (btn) {
        btn.disabled = true;
      }


      if (msg) {

        msg.textContent =
          "Verifying Pi account and submitting...";

      }


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


        /*
         * IMPORTANT:
         *
         * We no longer require the vendor to manually
         * enter a wallet address.
         *
         * The wallet_address permission is granted
         * through Pi.authenticate().
         *
         * The backend verifies the permission from
         * the Pi access token.
         */

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
              .trim()

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


        let data;


        try {

          data =
            await res.json();

        } catch (jsonError) {

          throw new Error(
            "The server returned an invalid response."
          );

        }


        if (
          !res.ok ||
          !data.success
        ) {

          if (msg) {

            msg.textContent =
              data.message ||
              "Application failed.";

          }


          return;

        }


        if (msg) {

          msg.textContent =
            "Application submitted successfully. Please wait for Admin approval.";

        }


        vendorForm.reset();


      } catch (error) {

        console.error(
          "[PI] Vendor registration error:",
          error
        );


        if (msg) {

          msg.textContent =
            error.message ||
            "Unable to submit application.";

        }

      } finally {

        if (btn) {
          btn.disabled = false;
        }

      }

    }
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

initPi()
  .catch(error => {

    console.error(
      "[PI] Initial startup error:",
      error
    );

  });