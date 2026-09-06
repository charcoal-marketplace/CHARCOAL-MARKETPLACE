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
       
       IMPORTANT:
       
       An account can be BOTH:
       
         role = admin
         vendor_status = approved
       
       Therefore we MUST NOT require:
       
         role === "vendor"
       
       We use vendor_status as the vendor permission.
    ===================================================== */

    if (

      data.user?.vendor_status ===
      "approved"

    ) {

      /* ---------------------------------------------------
         SAVE AUTH TOKEN
      --------------------------------------------------- */

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


      /* ---------------------------------------------------
         SAVE WALLET ADDRESS IF AVAILABLE
      --------------------------------------------------- */

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


      /*
       * Your vendor dashboard file is vendor.html.
       */

      window.location.href =
        "vendor.html";


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
       NOT AN APPROVED VENDOR
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