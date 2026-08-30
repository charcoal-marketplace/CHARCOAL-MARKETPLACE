const API =
  "https://charcoal-marketplace-main-production.up.railway.app/api";


const $ =
  id =>
    document.getElementById(id);



/* =========================================================
   PI INITIALIZATION
========================================================= */

async function initPi() {

  if (!window.Pi) {

    console.warn(
      "[PI AUTH] Pi SDK is not available."
    );

    return false;

  }


  try {

    /*
     * TESTNET / MAINNET
     *
     * Your existing system can still use PI_SANDBOX=true
     * for Testnet testing.
     *
     * Production Mainnet should NOT have PI_SANDBOX=true
     * in localStorage.
     */

    const piSandbox =
      location.hostname ===
        "sandbox.minepi.com" ||

      localStorage.getItem(
        "PI_SANDBOX"
      ) === "true";


    const options = {

      version:
        "2.0"

    };


    if (piSandbox) {

      options.sandbox =
        true;

    }


    await Pi.init(
      options
    );


    console.log(
      "[PI AUTH] Pi SDK initialized:",
      options
    );


    return true;


  } catch (error) {

    console.error(
      "[PI AUTH] Pi initialization error:",
      error
    );


    return false;

  }

}



/* =========================================================
   SHOW REGISTER
========================================================= */

function showRegister() {

  const loginSection =
    $("loginSection");

  const registerSection =
    $("registerSection");

  const registerPrompt =
    $("registerPrompt");


  if (loginSection) {

    loginSection
      .classList
      .add("hidden");

  }


  if (registerSection) {

    registerSection
      .classList
      .remove("hidden");

  }


  if (registerPrompt) {

    registerPrompt
      .classList
      .add("hidden");

  }


  initPi();

}



/* =========================================================
   SHOW LOGIN
========================================================= */

function showLogin() {

  const registerSection =
    $("registerSection");

  const loginSection =
    $("loginSection");

  const registerPrompt =
    $("registerPrompt");


  if (registerSection) {

    registerSection
      .classList
      .add("hidden");

  }


  if (loginSection) {

    loginSection
      .classList
      .remove("hidden");

  }


  if (registerPrompt) {

    registerPrompt
      .classList
      .remove("hidden");

  }


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


  /*
   * These are the permissions used by your application.
   *
   * username:
   *   Identifies the Pioneer.
   *
   * payments:
   *   Required by the Pi payment functionality.
   *
   * wallet_address:
   *   Allows the app to receive the authenticated user's
   *   wallet address when the Pioneer grants permission.
   *
   * IMPORTANT:
   *
   * wallet_address is NOT required merely to log into
   * the vendor dashboard.
   */

  const scopes = [

    "username",

    "payments",

    "wallet_address"

  ];


  console.log(
    "[PI AUTH] Requesting scopes:",
    scopes
  );


  const initialized =
    await initPi();


  if (!initialized) {

    throw new Error(
      "Pi SDK could not be initialized."
    );

  }


  /*
   * Authenticate with Pi.
   *
   * The backend receives ONLY the access token and
   * independently verifies it against Pi /me.
   */

  const auth =
    await Pi.authenticate(

      scopes,

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

    throw new Error(
      "Pi authentication did not return an access token."
    );

  }


  console.log(
    "[PI AUTH] Pi authentication completed."
  );


  /*
   * Do not trust frontend user information as the
   * backend identity source.
   *
   * The backend verifies auth.accessToken with Pi.
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

    btn.disabled =
      true;

  }


  if (msg) {

    msg.textContent =
      "Connecting to Pi...";

  }


  try {


    /* =====================================================
       AUTHENTICATE
    ===================================================== */

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



    /* =====================================================
       SEND ACCESS TOKEN TO BACKEND
    ===================================================== */

    const res =
      await fetch(

        `${API}/auth/pi-login`,

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/json"

          },

          body:
            JSON.stringify({

              accessToken:
                auth.accessToken

            })

        }

      );



    let data;


    try {

      data =
        await res.json();

    } catch {

      throw new Error(
        "The server returned an invalid response."
      );

    }



    /* =====================================================
       SERVER ERROR
    ===================================================== */

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


      /*
       * Save the verified wallet address if Pi supplied it.
       *
       * This is NOT used as a trusted source for payout.
       * The backend remains the authority.
       */

      if (
        data.user?.pi_wallet_address
      ) {

        localStorage.setItem(
          "vendorWalletAddress",
          data.user.pi_wallet_address
        );

      }


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
      "[PI AUTH] Pi vendor login error:",
      error
    );


    if (msg) {

      msg.textContent =
        error.message ||
        "Pi login failed.";

    }


  } finally {


    if (btn) {

      btn.disabled =
        false;

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

        btn.disabled =
          true;

      }


      if (msg) {

        msg.textContent =
          "Verifying Pi account and submitting...";

      }


      try {


        /* =================================================
           PI AUTHENTICATION
        ================================================= */

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
           VENDOR INFORMATION
        ================================================= */

        const body = {

          accessToken:
            auth.accessToken,


          name:
            $("vendorName")
              ?.value
              ?.trim() ||
            "",


          business_name:
            $("businessName")
              ?.value
              ?.trim() ||
            "",


          business_phone:
            $("businessPhone")
              ?.value
              ?.trim() ||
            "",


          business_location:
            $("businessLocation")
              ?.value
              ?.trim() ||
            "",


          business_description:
            $("businessDescription")
              ?.value
              ?.trim() ||
            ""

        };


        /*
         * IMPORTANT:
         *
         * There is NO manually entered wallet address.
         *
         * The backend verifies the access token against
         * Pi /me and stores wallet_address if Pi supplies it.
         */



        /* =================================================
           SUBMIT APPLICATION
        ================================================= */

        const res =
          await fetch(

            `${API}/auth/vendor-register`,

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify(
                  body
                )

            }

          );


        let data;


        try {

          data =
            await res.json();

        } catch {

          throw new Error(
            "The server returned an invalid response."
          );

        }



        /* =================================================
           APPLICATION FAILED
        ================================================= */

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



        /* =================================================
           SUCCESS
        ================================================= */

        if (msg) {

          msg.textContent =
            "Application submitted successfully. Please wait for Admin approval.";

        }


        vendorForm.reset();


      } catch (error) {


        console.error(
          "[PI AUTH] Vendor registration error:",
          error
        );


        if (msg) {

          msg.textContent =
            error.message ||
            "Unable to submit application.";

        }


      } finally {


        if (btn) {

          btn.disabled =
            false;

        }

      }

    }

  );

}



/* =========================================================
   INITIALIZE
========================================================= */

initPi();