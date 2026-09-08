const API =
  "https://charcoal-marketplace-main-production.up.railway.app/api";

const token =
  localStorage.getItem("token");


if (!token) {

  window.location.replace(
    "vendor-login.html"
  );

}


function headers() {

  return {
    Authorization:
      `Bearer ${token}`
  };

}


function logout() {

  localStorage.removeItem(
    "token"
  );

  localStorage.removeItem(
    "vendorToken"
  );

  localStorage.removeItem(
    "user"
  );

  window.location.href =
    "vendor-login.html";

}


function goHome() {

  window.location.href =
    "home.html";

}


function goVendor() {

  window.location.href =
    "vendor.html";

}


function goProfile() {

  window.location.href =
    "profile.html";

}


/* =========================================================
   VERIFY VENDOR ACCESS
========================================================= */

async function ensureVendor() {

  try {

    const res =
      await fetch(
        `${API}/orders/vendor`,
        {
          headers:
            headers()
        }
      );


    if (
      res.status === 401 ||
      res.status === 403
    ) {

      logout();

      return false;

    }


    return true;


  } catch {

    return false;

  }

}


/* =========================================================
   ADD PRODUCT
========================================================= */

const form =
  document.getElementById(
    "productForm"
  );


if (form) {

  form.addEventListener(
    "submit",
    async e => {

      e.preventDefault();


      const btn =
        document.getElementById(
          "submitBtn"
        );


      btn.disabled = true;

      btn.textContent =
        "Uploading...";


      try {

        const fd =
          new FormData();


        fd.append(
          "name",
          document
            .getElementById("name")
            .value
            .trim()
        );


        fd.append(
          "price_pi",
          document
            .getElementById("price_pi")
            .value
        );


        fd.append(
          "location",
          document
            .getElementById("location")
            .value
            .trim()
        );


        fd.append(
          "stock",
          document
            .getElementById("stock")
            .value
        );


        fd.append(
          "image",
          document
            .getElementById("image")
            .files[0]
        );


        const res =
          await fetch(
            `${API}/products`,
            {
              method:
                "POST",

              headers:
                headers(),

              body:
                fd
            }
          );


        const data =
          await res.json()
            .catch(
              () => ({})
            );


        if (
          res.status === 401 ||
          res.status === 403
        ) {

          alert(
            data.message ||
            "Vendor access denied"
          );

          logout();

          return;

        }


        if (!res.ok) {

          throw new Error(
            data.message ||
            "Upload failed"
          );

        }


        alert(
          data.message ||
          "Product submitted"
        );


        form.reset();


        loadMyProducts();


      } catch (error) {

        console.error(
          error
        );


        alert(
          error.message ||
          "Server error"
        );


      } finally {

        btn.disabled =
          false;

        btn.textContent =
          "Add Product";

      }

    }
  );

}


/* =========================================================
   LOAD MY PRODUCTS
========================================================= */

async function loadMyProducts() {

  const container =
    document.getElementById(
      "myProducts"
    );


  if (!container) {

    return;

  }


  try {

    container.innerHTML =
      "<p>Loading your products...</p>";


    const res =
      await fetch(
        `${API}/products/my`,
        {
          headers:
            headers()
        }
      );


    const data =
      await res.json()
        .catch(
          () => []
        );


    if (
      res.status === 401 ||
      res.status === 403
    ) {

      logout();

      return;

    }


    if (
      !Array.isArray(data) ||
      !data.length
    ) {

      container.innerHTML =
        "<p>No products yet.</p>";

      return;

    }


    container.innerHTML =
      data
        .map(
          p => {

            const active =
              Boolean(
                p.is_active
              );


            let listingStatus =
              "Delisted";


            if (
              p.status ===
                "approved" &&
              active
            ) {

              listingStatus =
                "Listed";

            }


            if (
              p.status ===
              "pending"
            ) {

              listingStatus =
                "Awaiting Admin Approval";

            }


            if (
              p.status ===
              "rejected"
            ) {

              listingStatus =
                "Rejected";

            }


            if (
              p.status ===
              "suspended"
            ) {

              listingStatus =
                "Suspended";

            }


            return `

              <div
                class="card vendor-product-card"
              >

                <img
                  src="${getImageURL(
                    p.image
                  )}"
                  alt="${escapeHTML(
                    p.name
                  )}"
                >


                <h3>
                  ${escapeHTML(
                    p.name
                  )}
                </h3>


                <p>
                  ${escapeHTML(
                    p.location ||
                    ""
                  )}
                </p>


                <h4>
                  ${Number(
                    p.price_pi ||
                    0
                  ).toFixed(2)}
                  Pi
                </h4>


                <p>
                  Stock:
                  ${Number(
                    p.stock ||
                    0
                  )}
                </p>


                <p>
                  Approval:
                  ${escapeHTML(
                    p.status
                  )}
                </p>


                <p>
                  Listing:
                  <strong>
                    ${listingStatus}
                  </strong>
                </p>


                <div
                  class="vendor-product-actions"
                >

                  ${
                    p.is_active
                      ? `

                        <button
                          class="vendor-delist-btn"
                          onclick="vendorDelistProduct(${p.id})"
                        >
                          🚫 Delist
                        </button>

                      `
                      : (
                        p.status ===
                        "approved"
                          ? `

                            <button
                              class="vendor-relist-btn"
                              onclick="vendorRelistProduct(${p.id})"
                            >
                              ✅ Relist
                            </button>

                          `
                          : ""
                      )
                  }


                  <button
                    class="vendor-delete-btn"
                    onclick="vendorDeleteProduct(${p.id})"
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>

            `;

          }
        )
        .join("");


  } catch (error) {

    console.error(
      error
    );


    container.innerHTML =
      "<p>Failed to load products.</p>";

  }

}


/* =========================================================
   VENDOR DELIST
========================================================= */

async function vendorDelistProduct(id) {

  const confirmed =
    confirm(
      "Delist this product?\n\nIt will remain in your account but will no longer appear in the marketplace."
    );


  if (!confirmed) {

    return;

  }


  try {

    const res =
      await fetch(
        `${API}/products/${id}/delist`,
        {
          method:
            "POST",

          headers:
            headers()
        }
      );


    const data =
      await res.json()
        .catch(
          () => ({})
        );


    if (
      res.status === 401 ||
      res.status === 403
    ) {

      alert(
        data.message ||
        "Vendor access denied."
      );

      logout();

      return;

    }


    if (!res.ok) {

      alert(
        data.message ||
        "Failed to delist product."
      );

      return;

    }


    alert(
      "Product delisted successfully."
    );


    loadMyProducts();


  } catch (error) {

    console.error(
      "Vendor delist error:",
      error
    );


    alert(
      "Unable to delist product."
    );

  }

}


/* =========================================================
   VENDOR RELIST
========================================================= */

async function vendorRelistProduct(id) {

  const confirmed =
    confirm(
      "Relist this product on the marketplace?"
    );


  if (!confirmed) {

    return;

  }


  try {

    const res =
      await fetch(
        `${API}/products/${id}/relist`,
        {
          method:
            "POST",

          headers:
            headers()
        }
      );


    const data =
      await res.json()
        .catch(
          () => ({})
        );


    if (
      res.status === 401 ||
      res.status === 403
    ) {

      alert(
        data.message ||
        "Vendor access denied."
      );

      logout();

      return;

    }


    if (!res.ok) {

      alert(
        data.message ||
        "Failed to relist product."
      );

      return;

    }


    alert(
      "Product relisted successfully."
    );


    loadMyProducts();


  } catch (error) {

    console.error(
      "Vendor relist error:",
      error
    );


    alert(
      "Unable to relist product."
    );

  }

}


/* =========================================================
   VENDOR DELETE
========================================================= */

async function vendorDeleteProduct(id) {

  const confirmed =
    confirm(
      "⚠️ PERMANENT DELETE\n\nAre you sure you want to permanently delete this product?\n\nThis cannot be undone."
    );


  if (!confirmed) {

    return;

  }


  const secondConfirmation =
    confirm(
      "Confirm permanent deletion of this product?"
    );


  if (!secondConfirmation) {

    return;

  }


  try {

    const res =
      await fetch(
        `${API}/products/${id}`,
        {
          method:
            "DELETE",

          headers:
            headers()
        }
      );


    const data =
      await res.json()
        .catch(
          () => ({})
        );


    if (
      res.status === 401 ||
      res.status === 403
    ) {

      alert(
        data.message ||
        "Vendor access denied."
      );

      logout();

      return;

    }


    if (!res.ok) {

      alert(
        data.message ||
        "Failed to delete product."
      );

      return;

    }


    alert(
      "Product deleted successfully."
    );


    loadMyProducts();


  } catch (error) {

    console.error(
      "Vendor delete error:",
      error
    );


    alert(
      "Unable to delete product."
    );

  }

}


/* =========================================================
   IMAGE URL
========================================================= */

function getImageURL(image) {

  if (!image) {

    return "";

  }


  if (
    image.startsWith("http")
  ) {

    return image;

  }


  return image.startsWith("/")
    ? image
    : "/" + image;

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (
      await ensureVendor()
    ) {

      loadMyProducts();
      loadVendorOrders();

    }

  }
);

/* =========================================================
   VENDOR ORDERS
========================================================= */

async function loadVendorOrders() {

  const container =
    document.getElementById(
      "vendorOrders"
    );

  if (!container) return;

  container.innerHTML =
    "<p>Loading orders...</p>";

  try {

    const response =
      await fetch(
        `${API}/orders/vendor`,
        {
          headers:
            headers()
        }
      );

    const data =
      await response.json()
        .catch(() => []);

    if (
      response.status === 401 ||
      response.status === 403
    ) {

      logout();
      return;

    }

    if (!response.ok) {

      throw new Error(
        data.message ||
        "Failed to load orders"
      );

    }

    if (
      !Array.isArray(data) ||
      !data.length
    ) {

      container.innerHTML =
        "<p>No customer orders yet.</p>";

      return;

    }

    /*
     * The backend returns one row per order item.
     * Group by order ID for a cleaner vendor dashboard.
     */
    const grouped = {};

    data.forEach(
      item => {

        const id =
          Number(item.id);

        if (!grouped[id]) {

          grouped[id] = {
            ...item,
            items: []
          };

        }

        grouped[id].items.push(
          item
        );

      }
    );

    container.innerHTML =
      Object.values(grouped)
        .map(
          order => {

            const canCancel =
              ["paid", "processing", "shipped"]
                .includes(
                  String(
                    order.status
                  )
                ) &&
              !order.buyer_confirmed_at &&
              ["pending", "failed"]
                .includes(
                  String(
                    order.refund_status ||
                    "none"
                  )
                );

            return `

              <div
                class="card"
                style="margin:15px 0;"
              >

                <h4>
                  Order #${order.id}
                </h4>

                <p>
                  <strong>Buyer:</strong>
                  ${escapeHTML(
                    order.buyer_name ||
                    order.pi_username ||
                    "Buyer"
                  )}
                </p>

                <p>
                  <strong>Total:</strong>
                  ${Number(
                    order.total_pi ||
                    0
                  ).toFixed(8)}
                  Pi
                </p>

                <p>
                  <strong>Order status:</strong>
                  ${escapeHTML(
                    order.status ||
                    ""
                  )}
                </p>

                <p>
                  <strong>Delivery:</strong>
                  ${escapeHTML(
                    order.delivery_status ||
                    ""
                  )}
                </p>

                <p>
                  <strong>Refund:</strong>
                  ${escapeHTML(
                    order.refund_status ||
                    "none"
                  )}
                </p>

                <p>
                  <strong>Products:</strong>
                  ${
                    order.items
                      .map(
                        item =>
                          `${escapeHTML(
                            item.name ||
                            item.product_name ||
                            "Product"
                          )} × ${Number(
                            item.quantity ||
                            0
                          )}`
                      )
                      .join(", ")
                  }
                </p>

                ${
                  canCancel
                    ? `
                      <button
                        type="button"
                        class="vendor-delete-btn"
                        onclick="vendorCancelOrder(${order.id})"
                      >
                        ❌ Cancel Order / Start Refund
                      </button>
                    `
                    : (
                      order.refund_status ===
                      "pending"
                        ? `
                          <p>
                            ⏳ Refund requested. Waiting for
                            vendor cancellation / Admin processing.
                          </p>
                        `
                        : ""
                    )
                }

              </div>

            `;

          }
        ).join("");

  } catch (error) {

    console.error(
      "Vendor orders error:",
      error
    );

    container.innerHTML =
      `<p>Unable to load orders: ${escapeHTML(
        error.message ||
        "Server error"
      )}</p>`;

  }

}


async function vendorCancelOrder(
  orderId
) {

  const reason =
    prompt(
      "Why are you cancelling this order?",
      "Buyer did not receive the product; refund requested."
    );

  if (reason === null) return;

  if (
    !confirm(
      `Cancel order #${orderId} and make it eligible for Admin refund processing?`
    )
  ) {
    return;
  }

  try {

    const response =
      await fetch(
        `${API}/refunds/vendor-cancel/${orderId}`,
        {
          method:
            "POST",
          headers: {
            ...headers(),
            "Content-Type":
              "application/json"
          },
          body:
            JSON.stringify({
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
        "Vendor access denied."
      );

      logout();
      return;

    }

    if (!response.ok) {

      alert(
        data.message ||
        "Unable to cancel order."
      );

      return;

    }

    alert(
      data.message ||
      "Order cancelled. Refund is now waiting for Admin."
    );

    await loadVendorOrders();

  } catch (error) {

    console.error(
      "Vendor cancel order error:",
      error
    );

    alert(
      error.message ||
      "Unable to cancel order."
    );

  }

}
