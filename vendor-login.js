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

    return;

  }


  try {

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


    /*
     * Pi SDK 2.0 initialization.
     */

    await Pi.init(
      options
    );


    console.log(
      "[PI AUTH] Pi SDK initialized.",
      options
    );


  } catch (error) {

    console.error(
      "[PI AUTH] Pi initialization error:",
      error
    );

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
   * IMPORTANT:
   *
   * Mainnet vendor accounts need the wallet address
   * permission so the backend can receive the vendor's
   * verified receiving address.
   *
   * Required vendor scopes:
   *
   * username        -> vendor identity
   * payments        -> keeps vendor account authorized for
   *                    marketplace payment capabilities
   * wallet_address  -> required for A2U vendor payouts
   */

  const scopes = [

    "username",

    "payments",

    "wallet_address"

  ];


  console.log(
    "[PI AUTH] Requesting Pi scopes:",
    scopes
  );


  /*
   * Make sure Pi has finished initialization.
   */

  await initPi();


  /*
   * Authenticate with Pi.
   *
   * Only the accessToken is sent to the backend.
   * The backend verifies it against Pi /me.
   */

  const auth =
    await Pi.authenticate(

      scopes,

      function (payment) {

        console.log(
          "[PI AUTH] Incomplete payment:",
          payment
        );

      }

    );


  console.log(
    "[PI AUTH] Authentication completed."
  );


  /*
   * We deliberately do NOT trust auth.user as the
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
           WALLET ADDRESS
        =================================================

           IMPORTANT:
           Do NOT trust a wallet address typed by the vendor.

           The backend will obtain the authoritative wallet
           from Pi /me after the vendor grants the
           wallet_address scope.

           The old HTML field is intentionally ignored here
           for backward compatibility.
        */

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
            "",

          /*
           * Kept only for compatibility with older backends.
           * The corrected backend NEVER trusts this value.
           */

          pi_wallet_address:
            ""

        };


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


        if (!res.ok) {

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


        if (vendorForm) {

          vendorForm.reset();

        }


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