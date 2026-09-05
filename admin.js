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
    
    loadVendors();
    
    loadPendingPayouts();

  }
);


/* =========================================================
   SECTION NAVIGATION
========================================================= */

/*
 * Opens / closes the compact three-dot admin menu.
 */

function toggleAdminMenu() {

  const menu =
    document.getElementById(
      "adminMenu"
    );

  const toggle =
    document.getElementById(
      "adminMenuToggle"
    );


  if (!menu) {

    return;

  }


  const isOpen =
    menu.classList.toggle(
      "open"
    );


  if (toggle) {

    toggle.setAttribute(
      "aria-expanded",
      isOpen
        ? "true"
        : "false"
    );

  }

}


/*
 * Closes the admin menu.
 */

function closeAdminMenu() {

  const menu =
    document.getElementById(
      "adminMenu"
    );

  const toggle =
    document.getElementById(
      "adminMenuToggle"
    );


  if (menu) {

    menu.classList.remove(
      "open"
    );

  }


  if (toggle) {

    toggle.setAttribute(
      "aria-expanded",
      "false"
    );

  }

}


/*
 * Shows exactly one dashboard section.
 */

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


  if (!target) {

    console.warn(
      "Admin section not found:",
      sectionId
    );

    closeAdminMenu();

    return;

  }


  target.classList.add(
    "active"
  );


  /*
   * Highlight selected menu item.
   */

  const menuItems =
    document.querySelectorAll(
      ".admin-menu-item"
    );


  menuItems.forEach(
    item => {

      item.classList.remove(
        "active-menu-item"
      );

    }
  );


  const selectedItem =
    document.querySelector(
      `.admin-menu-item[onclick="showSection('${sectionId}')"]`
    );


  if (selectedItem) {

    selectedItem.classList.add(
      "active-menu-item"
    );

  }


  /*
   * Close dropdown after selection.
   */

  closeAdminMenu();


  /*
   * Load section-specific data
   * when its page is opened.
   */

  if (
    sectionId === "vendors" &&
    typeof loadVendors ===
      "function"
  ) {

    loadVendors();

  }


  if (
    sectionId === "payouts" &&
    typeof loadPendingPayouts ===
      "function"
  ) {

    loadPendingPayouts();

  }


  if (
    sectionId === "invitations" &&
    typeof loadAdminInvitations ===
      "function"
  ) {

    loadAdminInvitations();

  }


  if (
  sectionId === "administrators" &&
  typeof loadAdministrators ===
    "function"
) {

  loadAdministrators();

  }
  

  if (
  sectionId === "adminRequests" &&
  typeof loadAdminRequests ===
    "function"
) {

  loadAdminRequests();

  }
  

  if (
    sectionId === "withdrawals" &&
    typeof initializeWithdrawals ===
      "function"
  ) {

    initializeWithdrawals();

  }

}


/*
 * Close menu when tapping outside it.
 */

document.addEventListener(
  "click",
  event => {

    const menu =
      document.getElementById(
        "adminMenu"
      );

    const toggle =
      document.getElementById(
        "adminMenuToggle"
      );


    if (!menu || !toggle) {

      return;

    }


    if (
      !menu.contains(event.target) &&
      !toggle.contains(event.target)
    ) {

      closeAdminMenu();

    }

  }
);


/*
 * Close menu with Escape.
 */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key ===
      "Escape"
    ) {

      closeAdminMenu();

    }

  }
);


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
   ALL VENDORS
   Admin → Vendors Management
========================================================= */

async function loadVendors() {

  const container =
    document.getElementById(
      "adminVendors"
    );


  if (!container) {

    return;

  }


  try {

    container.innerHTML =
      "<p>Loading vendors...</p>";


    const response =
      await fetch(
        `${API}/admin/vendors`,
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
        "Failed to load vendors"
      );

    }


    const vendors =
      Array.isArray(data)
        ? data
        : Array.isArray(data.vendors)
          ? data.vendors
          : [];


    if (!vendors.length) {

      container.innerHTML = `
        <div class="card">

          <h3>
            No Vendors Found
          </h3>

          <p>
            There are currently no approved vendors.
          </p>

        </div>
      `;

      return;

    }


    container.innerHTML =
      vendors.map(
        vendor => `

        <div class="card">

          <h3>
            🏪
            ${escapeHTML(
              vendor.business_name ||
              vendor.name ||
              "Vendor"
            )}
          </h3>

          <p>
            <strong>Owner:</strong>
            ${escapeHTML(
              vendor.name ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Pi Username:</strong>
            ${escapeHTML(
              vendor.pi_username ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Email:</strong>
            ${escapeHTML(
              vendor.email ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Phone:</strong>
            ${escapeHTML(
              vendor.business_phone ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Location:</strong>
            ${escapeHTML(
              vendor.business_location ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Vendor Status:</strong>
            ${escapeHTML(
              vendor.vendor_status ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Account Status:</strong>
            ${escapeHTML(
              vendor.status ||
              "N/A"
            )}
          </p>

          <p>
            <strong>Pi Wallet:</strong>
            <br>
            <small>
              ${escapeHTML(
                vendor.pi_wallet_address ||
                "Wallet permission not available"
              )}
            </small>
          </p>

          <div style="margin-top:12px;">

            <button
              type="button"
              onclick="revokeVendor(${vendor.id})"
              style="
                background:#b00020;
                color:white;
                border:none;
                padding:10px 14px;
                border-radius:8px;
                cursor:pointer;
              "
            >
              🚫 Revoke Vendor
            </button>

          </div>

        </div>

      `
      ).join("");


  } catch (error) {

    console.error(
      "Load vendors error:",
      error
    );


    container.innerHTML = `
      <div class="card">

        <p>
          ❌ Unable to load vendors.
        </p>

        <button
          type="button"
          onclick="loadVendors()"
        >
          🔄 Try Again
        </button>

      </div>
    `;

  }

}

/* =========================================================
   REVOKE VENDOR
========================================================= */

async function revokeVendor(
  vendorId
) {

  if (
    !confirm(
      "Are you sure you want to revoke this vendor?\n\nThe vendor will lose vendor access and their active products will be disabled."
    )
  ) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/vendors/${vendorId}/revoke`,
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

      throw new Error(
        data.message ||
        "Vendor revoke failed"
      );

    }


    alert(
      data.message ||
      "Vendor revoked successfully."
    );


    await loadVendors();

    await loadDashboard();


  } catch (error) {

    console.error(
      "Revoke vendor error:",
      error
    );


    alert(
      error.message ||
      "Unable to revoke vendor."
    );

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
        `${API}/a2u/earnings/pending`,
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
            Pi Wallet:
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

          <p>
            Buyer Confirmation:
            ${payout.buyer_confirmed_at
              ? "Confirmed ✔"
              : "Waiting for buyer confirmation"}
          </p>

          ${payout.payout_error
            ? `
              <p style="color:#b00020;">
                Payout Error:
                <br>
                <small>
                  ${escapeHTML(String(payout.payout_error))}
                </small>
              </p>
            `
            : ""}

            ${payout.payout_ready_reason
  ? `
    <p>
      <strong>Payout Check:</strong>
      <br>
      <small>
        ${escapeHTML(
          String(payout.payout_ready_reason)
        )}
      </small>
    </p>
  `
  : ""}


<button
  ${payout.payout_ready === 1 ||
    payout.payout_ready === true
      ? ""
      : "disabled"}
  onclick="releaseVendorPayout(${payout.id})"
>
  ${
    payout.payout_ready === 1 ||
    payout.payout_ready === true
      ? "💰 Release Pi"
      : "🔒 Payout Not Ready"
  }
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
        `${API}/a2u/earnings/${earningId}/release`,
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
        data.error?.error_message ||
        data.error?.message ||
        "Pi payout failed."
      );

      return;

    }


    if (!data.success) {

      alert(
        data.message ||
        data.error?.error_message ||
        data.error?.message ||
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
   LOAD ADMINISTRATORS
   SUPER ADMIN ONLY

   GET /api/admin/administrators
========================================================= */

async function loadAdministrators() {

  const container =
    document.getElementById(
      "administratorsList"
    );


  if (!container) {

    console.warn(
      "Administrators list container not found."
    );

    return;

  }


  if (!isSuperAdmin()) {

    container.innerHTML =
      `
      <p>
        Only the Super Admin can view administrators.
      </p>
      `;

    return;

  }


  container.innerHTML =
    `
    <p>
      Loading administrators...
    </p>
    `;


  try {

    const response =
      await fetch(
        `${API}/admin/administrators`,
        {
          method: "GET",
          headers: getHeaders()
        }
      );


    const data =
      await response
        .json()
        .catch(() => ({}));


    /* -----------------------------------------------------
       AUTHORIZATION ERROR
    ----------------------------------------------------- */

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


    /* -----------------------------------------------------
       SERVER ERROR
    ----------------------------------------------------- */

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to load administrators."
      );

    }


    /* -----------------------------------------------------
       RESPONSE VALIDATION
    ----------------------------------------------------- */

    if (
      !data.success
    ) {

      throw new Error(
        data.message ||
        "Invalid administrator response."
      );

    }


    const administrators =
      Array.isArray(
        data.administrators
      )
        ? data.administrators
        : [];


    /* -----------------------------------------------------
       NO ADMINISTRATORS
    ----------------------------------------------------- */

    if (
      administrators.length === 0
    ) {

      container.innerHTML =
        `
        <div class="card">

          <h3>
            👑 No Administrators Found
          </h3>

          <p>
            There are currently no approved
            administrator accounts.
          </p>

        </div>
        `;

      return;

    }


    /* -----------------------------------------------------
       DISPLAY ADMINISTRATORS
    ----------------------------------------------------- */

    container.innerHTML =
      administrators
        .map(
          admin => {

            const id =
              Number(admin.id);


            const name =
              admin.name ||
              admin.pi_username ||
              "Administrator";


            const username =
              admin.pi_username ||
              "N/A";


            const email =
              admin.email ||
              "N/A";


            const piUid =
              admin.pi_uid ||
              "N/A";


            const level =
              admin.admin_level ||
              "admin";


            const status =
              admin.status ||
              "unknown";


            const createdAt =
              admin.created_at
                ? new Date(
                    admin.created_at
                  ).toLocaleString()
                : "N/A";


            const isSelf =
              Number(
                window.currentAdmin?.id
              ) === id;


            const isSuperAdminAccount =
              level ===
              "super_admin";


            return `
              <div
                class="card"
                style="
                  margin-bottom:15px;
                "
              >

                <h3>
                  👑
                  ${escapeHTML(
                    name
                  )}
                </h3>


                <p>
                  <strong>
                    Pi Username:
                  </strong>

                  ${escapeHTML(
                    username
                  )}
                </p>


                <p>
                  <strong>
                    Pi UID:
                  </strong>

                  <small>
                    ${escapeHTML(
                      piUid
                    )}
                  </small>
                </p>


                <p>
                  <strong>
                    Email:
                  </strong>

                  ${escapeHTML(
                    email
                  )}
                </p>


                <p>
                  <strong>
                    Role:
                  </strong>

                  ${escapeHTML(
                    admin.role ||
                    "admin"
                  )}
                </p>


                <p>
                  <strong>
                    Admin Level:
                  </strong>

                  ${escapeHTML(
                    level
                  )}
                </p>


                <p>
                  <strong>
                    Status:
                  </strong>

                  ${escapeHTML(
                    status
                  )}
                </p>


                <p>
                  <strong>
                    Added:
                  </strong>

                  ${escapeHTML(
                    createdAt
                  )}
                </p>


                ${
                  isSelf
                    ? `
                      <p>
                        ⭐
                        <strong>
                          This is your Super Admin account.
                        </strong>
                      </p>
                    `
                    : ""
                }


                ${
                  isSuperAdminAccount
                    ? ""
                    : `
                      <div
                        style="
                          display:flex;
                          gap:10px;
                          flex-wrap:wrap;
                          margin-top:15px;
                        "
                      >

                        <button
                          type="button"
                          onclick="changeAdminLevel(${id}, 'admin')"
                        >
                          👤 Make Admin
                        </button>


                        <button
                          type="button"
                          onclick="changeAdminLevel(${id}, 'moderator')"
                        >
                          🛡️ Make Moderator
                        </button>


                        ${
                          !isSelf
                            ? `
                              <button
                                type="button"
                                onclick="removeAdministrator(${id})"
                              >
                                ❌ Remove Administrator
                              </button>
                            `
                            : ""
                        }

                      </div>
                    `
                }

              </div>
            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Load administrators error:",
      error
    );


    container.innerHTML =
      `
      <div class="card">

        <p>
          ❌
          ${escapeHTML(
            error.message ||
            "Unable to load administrators."
          )}
        </p>


        <button
          type="button"
          onclick="loadAdministrators()"
        >
          🔄 Try Again
        </button>

      </div>
      `;

  }

}


/* =========================================================
   CHANGE ADMINISTRATOR LEVEL
========================================================= */

async function changeAdminLevel(
  adminId,
  adminLevel
) {

  if (!isSuperAdmin()) {

    alert(
      "Only the Super Admin can change administrator levels."
    );

    return;

  }


  const id =
    Number(adminId);


  if (
    !Number.isInteger(id)
  ) {

    alert(
      "Invalid administrator ID."
    );

    return;

  }


  if (
    adminLevel !== "admin" &&
    adminLevel !== "moderator"
  ) {

    alert(
      "Invalid administrator level."
    );

    return;

  }


  if (
    id ===
    Number(
      window.currentAdmin?.id
    )
  ) {

    alert(
      "You cannot change your own administrator level."
    );

    return;

  }


  const confirmed =
    confirm(
      `Change this administrator to ${adminLevel}?`
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/administrators/${id}/level`,
        {
          method: "POST",
          headers: getHeaders(),

          body:
            JSON.stringify({
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

      throw new Error(
        data.message ||
        "Failed to change administrator level."
      );

    }


    alert(
      data.message ||
      `Administrator changed to ${adminLevel}.`
    );


    await loadAdministrators();


  } catch (error) {

    console.error(
      "Change administrator level error:",
      error
    );


    alert(
      error.message ||
      "Unable to change administrator level."
    );

  }

}


/* =========================================================
   REMOVE ADMINISTRATOR
========================================================= */

async function removeAdministrator(
  adminId
) {

  if (!isSuperAdmin()) {

    alert(
      "Only the Super Admin can remove administrators."
    );

    return;

  }


  const id =
    Number(adminId);


  if (
    !Number.isInteger(id)
  ) {

    alert(
      "Invalid administrator ID."
    );

    return;

  }


  if (
    id ===
    Number(
      window.currentAdmin?.id
    )
  ) {

    alert(
      "You cannot remove yourself."
    );

    return;

  }


  const confirmed =
    confirm(
      "Are you sure you want to remove this administrator?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/administrators/${id}/remove`,
        {
          method: "POST",
          headers: getHeaders()
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
        "Failed to remove administrator."
      );

    }


    alert(
      data.message ||
      "Administrator removed successfully."
    );


    await loadAdministrators();


  } catch (error) {

    console.error(
      "Remove administrator error:",
      error
    );


    alert(
      error.message ||
      "Unable to remove administrator."
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
   LOAD ADMIN REQUESTS
   SUPER ADMIN ONLY

   GET /api/admin/admin-requests
========================================================= */

async function loadAdminRequests() {

  const container =
    document.getElementById(
      "adminRequestsList"
    );


  if (!container) {

    return;

  }


  if (!isSuperAdmin()) {

    container.innerHTML =
      "<p>Only the Super Admin can view administrator requests.</p>";

    return;

  }


  container.innerHTML =
    "<p>Loading administrator requests...</p>";


  try {

    const response =
      await fetch(
        `${API}/admin/admin-requests`,
        {
          method: "GET",
          headers: getHeaders()
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
        "Unable to load administrator requests."
      );

    }


    const requests =
      Array.isArray(data.requests)
        ? data.requests
        : [];


    if (!requests.length) {

      container.innerHTML =
        `
        <div class="card">

          <h3>
            📭 No Pending Administrator Requests
          </h3>

          <p>
            There are currently no pending
            administrator access requests.
          </p>

        </div>
        `;

      return;

    }


    container.innerHTML =
      requests
        .map(
          request => {

            const requestId =
              Number(request.id);


            const username =
              request.pi_username ||
              "Unknown Pi User";


            const requesterName =
              request.requester_name ||
              username ||
              "Unknown User";


            const email =
              request.requester_email ||
              "N/A";


            const piUid =
              request.pi_uid ||
              "N/A";


            const adminLevel =
              request.admin_level ||
              "admin";


            const createdAt =
              request.created_at ||
              "N/A";


            return `
              <div class="card">

                <h3>
                  👤
                  ${escapeHTML(
                    requesterName
                  )}
                </h3>


                <p>
                  <strong>
                    Pi Username:
                  </strong>

                  ${escapeHTML(
                    username
                  )}
                </p>


                <p>
                  <strong>
                    Pi UID:
                  </strong>

                  <small>
                    ${escapeHTML(
                      piUid
                    )}
                  </small>
                </p>


                <p>
                  <strong>
                    Email:
                  </strong>

                  ${escapeHTML(
                    email
                  )}
                </p>


                <p>
                  <strong>
                    Requested Access:
                  </strong>

                  ${escapeHTML(
                    adminLevel
                  )}
                </p>


                <p>
                  <strong>
                    Requested:
                  </strong>

                  ${escapeHTML(
                    createdAt
                  )}
                </p>


                <p>
                  <strong>
                    Status:
                  </strong>

                  <span>
                    🟡 Pending
                  </span>
                </p>


                <div
                  style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    margin-top:15px;
                  "
                >

                  <button
                    type="button"
                    onclick="approveAdminRequest(${requestId})"
                  >
                    ✅ Approve
                  </button>


                  <button
                    type="button"
                    onclick="rejectAdminRequest(${requestId})"
                  >
                    ❌ Reject
                  </button>

                </div>

              </div>
            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      "Load admin requests error:",
      error
    );


    container.innerHTML =
      `
      <div class="card">

        <p>
          ❌
          ${escapeHTML(
            error.message ||
            "Unable to load administrator requests."
          )}
        </p>

        <button
          type="button"
          onclick="loadAdminRequests()"
        >
          🔄 Try Again
        </button>

      </div>
      `;

  }

}


/* =========================================================
   APPROVE ADMIN REQUEST

   POST /api/admin/admin-requests/:id/approve
========================================================= */

async function approveAdminRequest(
  requestId
) {

  if (!isSuperAdmin()) {

    alert(
      "Only the Super Admin can approve administrator requests."
    );

    return;

  }


  const id =
    Number(requestId);


  if (!Number.isInteger(id)) {

    alert(
      "Invalid administrator request ID."
    );

    return;

  }


  const confirmed =
    confirm(
      "Approve this administrator request?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/admin-requests/${id}/approve`,
        {
          method: "POST",
          headers: getHeaders()
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
        "Unable to approve administrator request."
      );

    }


    alert(
      data.message ||
      "Administrator request approved successfully."
    );


    await loadAdminRequests();


    if (
      typeof loadAdministrators ===
      "function"
    ) {

      loadAdministrators();

    }


    if (
      typeof loadDashboard ===
      "function"
    ) {

      loadDashboard();

    }


  } catch (error) {

    console.error(
      "Approve administrator request error:",
      error
    );


    alert(
      error.message ||
      "Failed to approve administrator request."
    );

  }

}


/* =========================================================
   REJECT ADMIN REQUEST

   POST /api/admin/admin-requests/:id/reject
========================================================= */

async function rejectAdminRequest(
  requestId
) {

  if (!isSuperAdmin()) {

    alert(
      "Only the Super Admin can reject administrator requests."
    );

    return;

  }


  const id =
    Number(requestId);


  if (!Number.isInteger(id)) {

    alert(
      "Invalid administrator request ID."
    );

    return;

  }


  const confirmed =
    confirm(
      "Reject this administrator request?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const response =
      await fetch(
        `${API}/admin/admin-requests/${id}/reject`,
        {
          method: "POST",
          headers: getHeaders()
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
        "Unable to reject administrator request."
      );

    }


    alert(
      data.message ||
      "Administrator request rejected."
    );


    await loadAdminRequests();


  } catch (error) {

    console.error(
      "Reject administrator request error:",
      error
    );


    alert(
      error.message ||
      "Failed to reject administrator request."
    );

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