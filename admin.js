/* =========================================================
   CHARCOAL MARKETPLACE
   ADMIN DASHBOARD
========================================================= */

const API= "https://charcoal-marketplace-main-production.up.railway.app/api";
/* =========================================================
   AUTH STATE
========================================================= */

let adminToken =
  localStorage.getItem("adminToken");


/* =========================================================
   REDIRECT TO LOGIN
========================================================= */

function redirectToLogin() {

  localStorage.removeItem(
    "adminToken"
  );

  window.location.replace(
    "admin-login.html"
  );

}


/* =========================================================
   AUTH HEADERS
========================================================= */

function getHeaders() {

  adminToken =
    localStorage.getItem("adminToken");


  const headers = {
    "Content-Type":
      "application/json"
  };


  if (adminToken) {

    headers.Authorization =
      `Bearer ${adminToken}`;

  }


  return headers;

}


/* =========================================================
   VERIFY ADMIN
========================================================= */

async function verifyAdminAccess() {

  adminToken =
    localStorage.getItem("adminToken");


  if (!adminToken) {

    console.warn(
      "No adminToken found."
    );

    redirectToLogin();

    return false;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/me`,
        {
          method: "GET",
          headers: getHeaders()
        }
      );


    /*
      Read the response safely.
    */

    const data =
      await response.json()
        .catch(() => ({}));


    console.log(
      "Admin verification response:",
      response.status,
      data
    );


    /*
      TOKEN INVALID / EXPIRED
    */

    if (
      response.status === 401
    ) {

      console.error(
        "Admin token rejected:",
        data.message
      );

      alert(
        data.message ||
        "Your administrator session has expired. Please login again."
      );

      redirectToLogin();

      return false;

    }


    /*
      ADMIN ACCESS DENIED
    */

    if (
      response.status === 403
    ) {

      console.error(
        "Admin access denied:",
        data.message
      );

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return false;

    }


    /*
      OTHER SERVER ERROR
    */

    if (!response.ok) {

      console.error(
        "Admin verification HTTP error:",
        response.status,
        data
      );

      alert(
        data.message ||
        `Administrator verification failed. Server returned ${response.status}.`
      );

      return false;

    }


    /*
      VERIFY RESPONSE STRUCTURE
    */

    if (
      !data.success ||
      !data.admin
    ) {

      console.error(
        "Invalid admin verification response:",
        data
      );

      alert(
        data.message ||
        "Invalid administrator verification response."
      );

      redirectToLogin();

      return false;

    }


    /*
      VERIFY ROLE
    */

    if (
      data.admin.role !== "admin"
    ) {

      console.error(
        "Wrong administrator role:",
        data.admin.role
      );

      alert(
        "This account does not have administrator privileges."
      );

      redirectToLogin();

      return false;

    }


    /*
      VERIFY ACCOUNT STATUS
    */

    if (
      data.admin.status !== "approved"
    ) {

      console.error(
        "Administrator account is not approved:",
        data.admin.status
      );

      alert(
        `Administrator account status is "${data.admin.status}". Account must be approved.`
      );

      redirectToLogin();

      return false;

    }


    /*
      SUCCESS
    */

    console.log(
      "✅ Administrator verified:",
      data.admin
    );


    /*
      Store useful admin information
      for the dashboard.
    */

    window.currentAdmin =
      data.admin;


    return true;

  } catch (error) {

    console.error(
      "Admin verification network error:",
      error
    );


    alert(
      "Unable to connect to the administrator server."
    );


    return false;

  }

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    const authorized =
      await verifyAdminAccess();


    if (!authorized) {

      return;

    }


    console.log(
      "✅ Administrator dashboard authorized"
    );


    showSection(
      "dashboard"
    );


    loadDashboard();

    loadPendingProducts();

    loadPendingVendors();
    
    loadPendingPayouts();

  }
);


/* =========================================================
   SECTION NAVIGATION
========================================================= */

function showSection(sectionId) {

  const sections =
    document.querySelectorAll(
      ".section"
    );


  sections.forEach(
    section => {

      section.classList.remove(
        "active"
      );

    }
  );


  const target =
    document.getElementById(
      sectionId
    );


  if (target) {

    target.classList.add(
      "active"
    );

  }

}


/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {

  try {

    const response =
      await fetch(
        `${API}/admin/dashboard`,
        {
          method: "GET",
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator authorization failed."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Dashboard request failed"
      );

    }


    if (
      !data.success ||
      !data.stats
    ) {

      console.warn(
        "Invalid dashboard response:",
        data
      );

      return;

    }


    const stats =
      data.stats;


    const sales =
      document.getElementById(
        "sales"
      );

    const orders =
      document.getElementById(
        "ordersCount"
      );

    const vendors =
      document.getElementById(
        "vendorsCount"
      );

    const products =
      document.getElementById(
        "productsCount"
      );


    if (sales) {

      sales.textContent =
        `${Number(
          stats.sales || 0
        ).toFixed(2)} Pi`;

    }


    if (orders) {

      orders.textContent =
        stats.orders || 0;

    }


    if (vendors) {

      vendors.textContent =
        stats.vendors || 0;

    }


    if (products) {

      products.textContent =
        stats.products || 0;

    }


  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

  }

}


/* =========================================================
   LOGOUT
========================================================= */

function logout() {

  const confirmed =
    confirm(
      "Are you sure you want to logout?"
    );


  if (!confirmed) {

    return;

  }


  localStorage.removeItem(
    "adminToken"
  );


  window.location.replace(
    "admin-login.html"
  );

}


/* =========================================================
   PENDING PRODUCTS
========================================================= */

async function loadPendingProducts() {

  const container =
    document.getElementById(
      "pendingProducts"
    );


  if (!container) {

    return;

  }


  try {

    container.innerHTML =
      "<p>Loading products...</p>";


    const response =
      await fetch(
        `${API}/admin/products/pending`,
        {
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ([]));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Products request failed"
      );

    }


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      container.innerHTML =
        "<p>No pending products</p>";

      return;

    }


    container.innerHTML =
      data.map(
        product => `

        <div class="card">

          <img
            src="${getImageURL(
              product.image
            )}"
            alt="${escapeHTML(
              product.name
            )}"
          >

          <h3>
            ${escapeHTML(
              product.name
            )}
          </h3>

          <p>
            ${escapeHTML(
              product.location || ""
            )}
          </p>

          <p>
            Vendor:
            ${escapeHTML(
              product.vendor_name ||
              "Unknown"
            )}
          </p>

          <h4>
            ${Number(
              product.price_pi || 0
            ).toFixed(2)}
            Pi
          </h4>

          <button
            onclick="approveProduct(${product.id})"
          >
            Approve
          </button>

          <button
            onclick="rejectProduct(${product.id})"
          >
            Reject
          </button>

        </div>

      `
      ).join("");


  } catch (error) {

    console.error(
      "Pending products error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load pending products.</p>";

  }

}


/* =========================================================
   PENDING VENDORS
========================================================= */

async function loadPendingVendors() {

  const container =
    document.getElementById(
      "pendingVendors"
    );


  if (!container) {

    return;

  }


  try {

    container.innerHTML =
      "<p>Loading vendors...</p>";


    const response =
      await fetch(
        `${API}/admin/vendors/pending`,
        {
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ([]));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Vendor request failed"
      );

    }


    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {

      container.innerHTML =
        "<p>No pending vendors</p>";

      return;

    }


    container.innerHTML =
      data.map(
        vendor => `

        <div class="card">

          <h3>
            ${escapeHTML(
              vendor.name
            )}
          </h3>

          <p>
            ${escapeHTML(
              vendor.email
            )}
          </p>

          <p>
            Pi Username:
            ${escapeHTML(
              vendor.pi_username || "N/A"
            )}
          </p>

          <p>
            Business:
            ${escapeHTML(
              vendor.business_name || "N/A"
            )}
          </p>

          <p>
            Applied:
            ${
              vendor.vendor_applied_at
                ? new Date(
                    vendor.vendor_applied_at
                  ).toLocaleDateString()
                : "Unknown"
            }
          </p>

          <button
            onclick="approveVendor(${vendor.id})"
          >
            Approve
          </button>

          <button
            onclick="rejectVendor(${vendor.id})"
          >
            Reject
          </button>

        </div>

      `
      ).join("");


  } catch (error) {

    console.error(
      "Pending vendors error:",
      error
    );

    container.innerHTML =
      "<p>Unable to load pending vendors.</p>";

  }

}


/* =========================================================
   APPROVE PRODUCT
========================================================= */

async function approveProduct(id) {

  if (
    !confirm(
      "Approve this product?"
    )
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/products/approve/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      alert(
        data.message ||
        "Product approval failed."
      );

      return;

    }


    alert(
      "Product approved successfully ✔"
    );


    loadPendingProducts();

    loadDashboard();


  } catch (error) {

    console.error(
      "Approve product error:",
      error
    );

    alert(
      "Unable to approve product."
    );

  }

}


/* =========================================================
   REJECT PRODUCT
========================================================= */

async function rejectProduct(id) {

  if (
    !confirm(
      "Reject this product?"
    )
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/products/reject/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      alert(
        data.message ||
        "Product rejection failed."
      );

      return;

    }


    alert(
      "Product rejected."
    );


    loadPendingProducts();

    loadDashboard();


  } catch (error) {

    console.error(
      "Reject product error:",
      error
    );

    alert(
      "Unable to reject product."
    );

  }

}


/* =========================================================
   APPROVE VENDOR
========================================================= */

async function approveVendor(id) {

  if (
    !confirm(
      "Approve this vendor?"
    )
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/vendors/approve/${id}`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      alert(
        data.message ||
        "Vendor approval failed."
      );

      return;

    }


    alert(
      "Vendor approved successfully ✔"
    );


    loadPendingVendors();

    loadDashboard();


  } catch (error) {

    console.error(
      "Approve vendor error:",
      error
    );

    alert(
      "Unable to approve vendor."
    );

  }

}


/* =========================================================
   REJECT VENDOR
========================================================= */

async function rejectVendor(id) {

  const reason =
    prompt(
      "Enter rejection reason:",
      "Vendor application rejected by Admin"
    );


  if (
    reason === null
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/vendors/reject/${id}`,
        {
          method: "POST",

          headers: getHeaders(),

          body: JSON.stringify({
            reason
          })
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      alert(
        data.message ||
        "Vendor rejection failed."
      );

      return;

    }


    alert(
      "Vendor rejected."
    );


    loadPendingVendors();

    loadDashboard();


  } catch (error) {

    console.error(
      "Reject vendor error:",
      error
    );

    alert(
      "Unable to reject vendor."
    );

  }

}


/* =========================================================
   VENDOR PAYOUTS
========================================================= */

async function loadPendingPayouts() {

  const container =
    document.getElementById(
      "pendingPayouts"
    );


  if (!container) {
    return;
  }


  try {

    container.innerHTML =
      "<p>Loading pending payouts...</p>";


    const response =
      await fetch(
        `${API}/admin/earnings/pending`,
        {
          method: "GET",
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to load pending payouts"
      );

    }


    const payouts =
  Array.isArray(data)
    ? data
    : Array.isArray(data.earnings)
      ? data.earnings
      : [];


    if (
      !Array.isArray(payouts) ||
      payouts.length === 0
    ) {

      container.innerHTML =
        "<p>No pending vendor payouts.</p>";

      return;

    }


    container.innerHTML =
      payouts.map(
        payout => `

        <div class="card">

          <h3>
            ${escapeHTML(
              payout.vendor_name ||
              "Vendor"
            )}
          </h3>

          <p>
            Pi Username:
            ${escapeHTML(
              payout.pi_username ||
              "N/A"
            )}
          </p>

          <p>
            Wallet Address:
            <br>
            <small>
              ${escapeHTML(
                payout.wallet_address ||
                "Not available"
              )}
            </small>
          </p>

          <p>
            Order:
            ${escapeHTML(
              payout.order_id ||
              "N/A"
            )}
          </p>

          <h3>
            ${Number(
              payout.amount_pi || 0
            ).toFixed(7)}
            Pi
          </h3>

          <p>
            Status:
            ${escapeHTML(
              payout.status ||
              "pending"
            )}
          </p>

          <button
            onclick="releaseVendorPayout(${payout.id})"
          >
            💰 Release Pi
          </button>

        </div>

      `
      ).join("");


  } catch (error) {

    console.error(
      "Pending payouts error:",
      error
    );


    container.innerHTML =
      "<p>Unable to load pending payouts.</p>";

  }

}


/* =========================================================
   RELEASE VENDOR PAYOUT
========================================================= */

async function releaseVendorPayout(
  earningId
) {

  if (
    !Number.isInteger(
      Number(earningId)
    )
  ) {

    alert(
      "Invalid payout ID."
    );

    return;

  }


  const confirmed =
    confirm(
      "Release this Pi payment to the vendor's wallet?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/earnings/${earningId}/release`,
        {
          method: "POST",
          headers: getHeaders()
        }
      );


    const data =
      await response.json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Administrator access denied."
      );

      redirectToLogin();

      return;

    }


    if (!response.ok) {

      alert(
        data.message ||
        "Pi payout failed."
      );

      return;

    }


    if (!data.success) {

      alert(
        data.message ||
        "Pi payout was not completed."
      );

      return;

    }


    alert(
      data.message ||
      "Pi released successfully to the vendor."
    );


    loadPendingPayouts();

    loadDashboard();


  } catch (error) {

    console.error(
      "Vendor payout error:",
      error
    );


    alert(
      "Unable to release Pi to the vendor."
    );

  }

}

/* =========================================================
   ADMIN INVITATION CENTER
========================================================= */

function isSuperAdmin() {

  return (
    window.currentAdmin &&
    window.currentAdmin.role === "admin" &&
    window.currentAdmin.admin_level === "super_admin"
  );

}


/* =========================================================
   SEND ADMIN INVITATION
========================================================= */

async function sendAdminInvitation(event) {

  event.preventDefault();


  if (!isSuperAdmin()) {

    alert(
      "Only the Super Admin can send administrator invitations."
    );

    return;

  }


  const usernameInput =
    document.getElementById(
      "invitePiUsername"
    );


  const uidInput =
    document.getElementById(
      "invitePiUid"
    );


  const levelInput =
    document.getElementById(
      "inviteAdminLevel"
    );


  const messageBox =
    document.getElementById(
      "invitationMessage"
    );


  const button =
    document.getElementById(
      "sendInvitationBtn"
    );


  const piUsername =
    usernameInput
      ? usernameInput.value.trim()
      : "";


  const piUid =
    uidInput
      ? uidInput.value.trim()
      : "";


  const adminLevel =
    levelInput
      ? levelInput.value
      : "admin";


  if (
    !piUsername &&
    !piUid
  ) {

    if (messageBox) {

      messageBox.textContent =
        "Enter the Pi username or Pi UID.";

    }

    return;

  }


  if (
    button
  ) {

    button.disabled =
      true;

  }


  if (messageBox) {

    messageBox.textContent =
      "Sending administrator invitation...";

  }


  try {

    const response =
      await fetch(
        `${API}/admin/invitations`,
        {
          method: "POST",

          headers:
            getHeaders(),

          body:
            JSON.stringify({

              pi_username:
                piUsername ||
                null,

              pi_uid:
                piUid ||
                null,

              admin_level:
                adminLevel

            })

        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Super Admin access denied."
      );

      redirectToLogin();

      return;

    }


    if (
      !response.ok ||
      !data.success
    ) {

      if (messageBox) {

        messageBox.textContent =
          data.message ||
          "Failed to send invitation.";

      }

      return;

    }


    if (messageBox) {

      messageBox.textContent =
        data.message ||
        "Invitation sent successfully.";

    }


    alert(
      data.message ||
      "Administrator invitation sent successfully."
    );


    const form =
      document.getElementById(
        "adminInvitationForm"
      );


    if (form) {

      form.reset();

    }


    await loadAdminInvitations();


  } catch (error) {

    console.error(
      "Send admin invitation error:",
      error
    );


    if (messageBox) {

      messageBox.textContent =
        "Unable to connect to the server.";

    }

  } finally {

    if (button) {

      button.disabled =
        false;

    }

  }

}


/* =========================================================
   LOAD ADMIN INVITATIONS
========================================================= */

async function loadAdminInvitations() {

  const container =
    document.getElementById(
      "adminInvitationsList"
    );


  if (!container) {

    return;

  }


  if (!isSuperAdmin()) {

    container.innerHTML =
      "<p>Only the Super Admin can view invitations.</p>";

    return;

  }


  container.innerHTML =
    "<p>Loading invitations...</p>";


  try {

    const response =
      await fetch(
        `${API}/admin/invitations`,
        {
          method: "GET",

          headers:
            getHeaders()
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Super Admin access denied."
      );

      redirectToLogin();

      return;

    }


    if (
      !response.ok ||
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Unable to load invitations."
      );

    }


    const invitations =
      Array.isArray(
        data.invitations
      )
        ? data.invitations
        : [];


    if (
      !invitations.length
    ) {

      container.innerHTML =
        "<p>No administrator invitations yet.</p>";

      return;

    }


    container.innerHTML =
      invitations
        .map(
          invitation => {

            const status =
              String(
                invitation.status ||
                "pending"
              ).toLowerCase();


            const canRevoke =
              status === "pending";


            return `
              <div class="card">

                <h3>
                  ✉️
                  ${escapeHTML(
                    invitation.invited_pi_username ||
                    invitation.invited_name ||
                    "Pi User"
                  )}
                </h3>

                <p>
                  Pi UID:
                  <small>
                    ${escapeHTML(
                      invitation.invited_pi_uid ||
                      "N/A"
                    )}
                  </small>
                </p>

                <p>
                  Admin Level:
                  <strong>
                    ${escapeHTML(
                      invitation.admin_level
                    )}
                  </strong>
                </p>

                <p>
                  Status:
                  <strong>
                    ${escapeHTML(
                      status
                    )}
                  </strong>
                </p>

                <p>
                  Expires:
                  ${escapeHTML(
                    invitation.expires_at ||
                    ""
                  )}
                </p>

                ${
                  invitation.invited_name
                    ? `
                      <p>
                        User:
                        ${escapeHTML(
                          invitation.invited_name
                        )}
                      </p>
                    `
                    : ""
                }

                ${
                  canRevoke
                    ? `
                      <button
                        type="button"
                        onclick="revokeAdminInvitation(${Number(invitation.id)})"
                      >
                        ❌ Revoke
                      </button>
                    `
                    : ""
                }

              </div>
            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Load admin invitations error:",
      error
    );


    container.innerHTML =
      `<p>${escapeHTML(
        error.message ||
        "Unable to load invitations."
      )}</p>`;

  }

}


/* =========================================================
   REVOKE ADMIN INVITATION
========================================================= */

async function revokeAdminInvitation(
  invitationId
) {

  if (
    !isSuperAdmin()
  ) {

    alert(
      "Only the Super Admin can revoke invitations."
    );

    return;

  }


  if (
    !confirm(
      "Revoke this administrator invitation?"
    )
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/invitations/${Number(invitationId)}/revoke`,
        {
          method: "POST",

          headers:
            getHeaders()
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    if (
      response.status === 401 ||
      response.status === 403
    ) {

      alert(
        data.message ||
        "Super Admin access denied."
      );

      redirectToLogin();

      return;

    }


    if (
      !response.ok ||
      !data.success
    ) {

      alert(
        data.message ||
        "Failed to revoke invitation."
      );

      return;

    }


    alert(
      data.message ||
      "Invitation revoked successfully."
    );


    await loadAdminInvitations();


  } catch (error) {

    console.error(
      "Revoke invitation error:",
      error
    );


    alert(
      "Unable to revoke invitation."
    );

  }

}


/* =========================================================
   INVITATION FORM
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const form =
      document.getElementById(
        "adminInvitationForm"
      );


    if (form) {

      form.addEventListener(
        "submit",
        sendAdminInvitation
      );

    }

  }
);

/* =========================================================
   IMAGE URL
========================================================= */

function getImageURL(path) {

  if (!path) {
    return "placeholder.png";
  }

  const value = String(path).trim();

  /*
    If backend already returned a complete URL,
    use it exactly as it is.
  */

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  /*
    Product images are stored on Railway.
  */

  const backendURL =
    API.replace(/\/api\/?$/, "");

  const cleanPath =
    value.replace(/^\/+/, "");

  return `${backendURL}/${cleanPath}`;
}


function escapeHTML(value) {

  return String(
    value ?? ""
  )

    .replaceAll(
      "&",
      "&amp;"
    )

    .replaceAll(
      "<",
      "&lt;"
    )

    .replaceAll(
      ">",
      "&gt;"
    )

    .replaceAll(
      '"',
      "&quot;"
    )

    .replaceAll(
      "'",
      "&#039;"
    );

}