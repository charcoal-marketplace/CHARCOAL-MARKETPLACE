const ACCOUNT_API = "https://charcoal-marketplace-main-production.up.railway.app/api";

function accountToken(){
  return localStorage.getItem("token");
}

function accountHeaders(){
  const token=accountToken();
  return token
    ? {Authorization:`Bearer ${token}`,Accept:"application/json"}
    : {Accept:"application/json"};
}

function escapeHTML(value){
  return String(value ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function requireAccount(){
  if(!accountToken()){
    window.location.replace("profile.html");
    return false;
  }
  return true;
}

function accountLogout(){
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("profile.html");
}

function nav(){
  return `<div class="nav">
    <a href="home.html">Home</a>
    <a href="vendor.html">Vendor</a>
    <a href="profile.html">Profile</a>
  </div>`;
}

async function loadOrders(){
  if(!requireAccount()) return;

  const box=document.getElementById("content");

  try{

    const res=await fetch(
      `${ACCOUNT_API}/orders/my`,
      {
        headers:accountHeaders()
      }
    );

    const data=await res.json().catch(()=>[]);

    if(!res.ok){

      throw new Error(
        data.message || "Unable to load orders"
      );

    }

    if(!Array.isArray(data)||!data.length){

      box.innerHTML=
        '<div class="card">No orders yet.</div>';

      return;

    }


    box.innerHTML=data.map(o=>{

      const deliveryStatus =
        String(
          o.delivery_status || "pending"
        ).toLowerCase();

      const orderStatus =
        String(
          o.status || "pending"
        ).toLowerCase();

      const confirmed =
        !!o.buyer_confirmed_at;


      /*
       * Buyer can confirm only after delivery.
       */

      const canConfirm =
        !confirmed &&
        (
          deliveryStatus === "delivered" ||
          orderStatus === "completed"
        );


      let confirmationHTML = "";


      if(confirmed){

        confirmationHTML = `
          <div class="card">
            <strong>✅ Product Received</strong>
            <p>
              You confirmed that this product was received.
            </p>
            <small>
              Confirmation:
              ${escapeHTML(
                o.buyer_confirmed_at || ""
              )}
            </small>
            <p>
              <strong>
                Vendor payment is now eligible for Admin release.
              </strong>
            </p>
          </div>
        `;

      }else if(canConfirm){

        confirmationHTML = `
          <div class="card">
            <strong>📦 Product Delivered</strong>

            <p>
              Have you received this product?
            </p>

            <button
              onclick="confirmProductReceived(${Number(o.id)})"
            >
              ✅ Confirm Product Received
            </button>
          </div>
        `;

      }else{

        confirmationHTML = `
          <div class="card">
            <strong>🚚 Delivery Status</strong>

            <p>
              ${escapeHTML(
                o.delivery_status || "pending"
              )}
            </p>

            ${
              deliveryStatus === "shipped"
                ? `
                  <p>
                    Your product has been shipped.
                    Please confirm receipt after delivery.
                  </p>
                `
                : `
                  <p>
                    The product is not yet marked as delivered.
                  </p>
                `
            }

          </div>
        `;

      }


      return `
        <div class="card">

          <strong>
            ${escapeHTML(
              o.product_name ||
              o.name ||
              "Order item"
            )}
          </strong>

          <p>
            Quantity:
            ${Number(o.quantity||0)}
          </p>

          <p>
            Subtotal:
            ${Number(
              o.subtotal_pi||0
            ).toFixed(2)} Pi
          </p>

          <p>
            Order Status:
            ${escapeHTML(
              o.status || "pending"
            )}
          </p>

          <p>
            Delivery:
            ${escapeHTML(
              o.delivery_status || "pending"
            )}
          </p>

          <p>
            Checkout:
            ${escapeHTML(
              o.checkout_ref || ""
            )}
          </p>

          ${confirmationHTML}

        </div>
      `;

    }).join("");


  }catch(e){

    box.innerHTML=
      `<div class="card">
        Unable to load orders:
        ${escapeHTML(e.message)}
      </div>`;

  }
}

async function confirmProductReceived(orderId){

  if(!requireAccount()) return;


  const confirmed =
    window.confirm(
      "Please confirm that you have received the product. This confirmation will make the vendor's earning eligible for Admin release."
    );


  if(!confirmed){
    return;
  }


  try{

    const res =
      await fetch(
        `${ACCOUNT_API}/orders/${Number(orderId)}/confirm-received`,
        {
          method:"POST",
          headers:{
            ...accountHeaders(),
            "Content-Type":"application/json"
          }
        }
      );


    const data =
      await res.json().catch(()=>({}));


    if(!res.ok){

      throw new Error(
        data.message ||
        "Unable to confirm product receipt"
      );

    }


    alert(
      data.message ||
      "Product receipt confirmed successfully."
    );


    /*
     * Reload the orders so the button disappears
     * and the confirmed state is displayed.
     */

    await loadOrders();


  }catch(error){

    alert(
      error.message ||
      "Failed to confirm product receipt"
    );

  }

}

function loadCart(){
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem("cart"))||[]}catch{}
  const box=document.getElementById("content");
  if(!cart.length){
    box.innerHTML='<div class="card">Your cart is empty.</div>';
    return;
  }
  let total=0;
  box.innerHTML=cart.map((item,i)=>{
    const qty=Number(item.qty||item.quantity||1);
    const price=Number(item.price||item.price_pi||0);
    total+=qty*price;
    return `<div class="card item">
      <div><strong>${escapeHTML(item.name)}</strong><br>${price.toFixed(2)} Pi × ${qty}</div>
      <button onclick="removeCartItem(${i})">Remove</button>
    </div>`;
  }).join("")+
  `<div class="card"><strong>Total: ${total.toFixed(2)} Pi</strong><br>
    <a class="action" href="checkout.html">Proceed to Checkout</a>
  </div>`;
}

function removeCartItem(index){
  let cart=[];
  try{cart=JSON.parse(localStorage.getItem("cart"))||[]}catch{}
  cart.splice(index,1);
  localStorage.setItem("cart",JSON.stringify(cart));
  loadCart();
}

async function loadNotifications(){
  if(!requireAccount()) return;
  const box=document.getElementById("content");
  try{
    const res=await fetch(`${ACCOUNT_API}/notifications`,{headers:accountHeaders()});
    const data=await res.json().catch(()=>[]);
    if(!res.ok) throw new Error(data.message||"Unable to load notifications");
    const rows=Array.isArray(data)?data:(data.notifications||[]);
    if(!rows.length){
      box.innerHTML='<div class="card">No notifications.</div>';
      return;
    }
    box.innerHTML=rows.map(n=>`
      <div class="card">
        <strong>${escapeHTML(n.type||"general")}</strong>
        <p>${escapeHTML(n.message)}</p>
        <small>${escapeHTML(n.created_at||"")}</small>
      </div>`).join("");
    fetch(`${ACCOUNT_API}/notifications/read-all`,{
      method:"POST",headers:accountHeaders()
    }).catch(()=>{});
  }catch(e){
    box.innerHTML=`<div class="card">${escapeHTML(e.message)}</div>`;
  }
}

function loadSaved(){
  const box=document.getElementById("content");
  box.innerHTML='<div class="card">No saved products are available yet. You can add products to your cart from the marketplace.</div>';
}

function loadPersonalInfo(){
  if(!requireAccount()) return;
  let user={};
  try{
    user=JSON.parse(localStorage.getItem("user")||"{}");
  }catch{}
  document.getElementById("content").innerHTML=`
    <div class="card">
      <p><strong>Name:</strong> ${escapeHTML(user.name||"Pi User")}</p>
      <p><strong>Pi Username:</strong> ${escapeHTML(user.pi_username||"Not available")}</p>
      <p><strong>Business:</strong> ${escapeHTML(user.business_name||"Not registered")}</p>
      <p><strong>Location:</strong> ${escapeHTML(user.business_location||"Not set")}</p>
      <p class="muted">Profile editing can be added after the account-profile API is enabled.</p>
    </div>`;
}


async function loadEarnings(){

  if(!requireAccount()) return;

  const box=document.getElementById("content");

  try{

    const res=await fetch(
      `${ACCOUNT_API}/orders/vendor`,
      {
        headers:accountHeaders()
      }
    );

    const data=await res.json().catch(()=>[]);

    if(!res.ok){

      throw new Error(
        data.message || "Vendor access required"
      );

    }

    const rows=Array.isArray(data) ? data : [];

    const total=rows.reduce(
      (sum,row)=>
        sum + Number(row.subtotal_pi || 0),
      0
    );

    if(!rows.length){

      box.innerHTML=`
        <div class="card">
          <h2>0.00 Pi</h2>
          <p>No vendor orders yet.</p>
        </div>
      `;

      return;

    }

    box.innerHTML=`
      <div class="card">
        <h2>${total.toFixed(2)} Pi</h2>
        <p>Gross value of your listed order items.</p>
      </div>

      ${rows.map(r=>{

        const orderId =
          Number(r.id);

        const orderStatus =
          String(
            r.status || "pending"
          ).toLowerCase();

        const deliveryStatus =
          String(
            r.delivery_status || "pending"
          ).toLowerCase();

        let actionHTML="";


        /* =====================================================
           STEP 1 — VENDOR MARKS ORDER AS SHIPPED

           Paid or processing orders can be shipped.
        ===================================================== */

        if(
          (
            orderStatus === "paid" ||
            orderStatus === "processing"
          ) &&
          deliveryStatus !== "shipped" &&
          deliveryStatus !== "delivered" &&
          orderStatus !== "completed"
        ){

          actionHTML=`
            <button
              type="button"
              onclick="markOrderShipped(${orderId})"
            >
              🚚 Mark as Shipped
            </button>
          `;

        }


        /* =====================================================
           STEP 2 — VENDOR MARKS ORDER AS DELIVERED

           This button appears ONLY after shipping.
        ===================================================== */

        else if(
          deliveryStatus === "shipped" &&
          orderStatus !== "completed"
        ){

          actionHTML=`
            <button
              type="button"
              onclick="markOrderDelivered(${orderId})"
            >
              📦 Mark as Delivered
            </button>
          `;

        }


        /* =====================================================
           STEP 3 — ORDER ALREADY DELIVERED
        ===================================================== */

        else if(
          deliveryStatus === "delivered" ||
          orderStatus === "completed"
        ){

          actionHTML=`
            <div class="card">
              <strong>✅ Delivered</strong>

              <p>
                Waiting for buyer to confirm receipt.
              </p>
            </div>
          `;

        }


        /* =====================================================
           STEP 4 — FALLBACK
        ===================================================== */

        else{

          actionHTML=`
            <div class="card">
              <strong>⏳ Order Status</strong>

              <p>
                This order is currently:
                ${escapeHTML(
                  r.status || "pending"
                )}
              </p>

              <p>
                Delivery:
                ${escapeHTML(
                  r.delivery_status || "pending"
                )}
              </p>
            </div>
          `;

        }


        return `
          <div class="card">

            <strong>
              ${escapeHTML(
                r.name ||
                r.product_name ||
                "Product"
              )}
            </strong>

            <p>
              Buyer:
              ${escapeHTML(
                r.buyer_name ||
                r.pi_username ||
                "Buyer"
              )}
            </p>

            <p>
              Quantity:
              ${Number(r.quantity || 0)}
            </p>

            <p>
              Amount:
              ${Number(
                r.subtotal_pi || 0
              ).toFixed(2)} Pi
            </p>

            <p>
              Order Status:
              <strong>
                ${escapeHTML(
                  r.status || "pending"
                )}
              </strong>
            </p>

            <p>
              Delivery:
              <strong>
                ${escapeHTML(
                  r.delivery_status || "pending"
                )}
              </strong>
            </p>

            ${r.checkout_ref ? `
              <p>
                Checkout:
                ${escapeHTML(r.checkout_ref)}
              </p>
            ` : ""}

            ${actionHTML}

          </div>
        `;

      }).join("")}
    `;

  }catch(e){

    box.innerHTML=
      `<div class="card">
        ${escapeHTML(e.message)}
      </div>`;

  }
}

/* =========================================================
VENDOR MARK ORDER AS DELIVERED
========================================================= */

async function markOrderDelivered(orderId){

if(!requireAccount()) return;

const confirmed =
window.confirm(
"Confirm that this order has been delivered to the buyer?"
);

if(!confirmed){
return;
}

try{

const res =
  await fetch(
    `${ACCOUNT_API}/orders/${Number(orderId)}/status`,
    {
      method:"PUT",

      headers:{
        ...accountHeaders(),
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        status:"completed"
      })
    }
  );


const data =
  await res.json().catch(()=>({}));


if(!res.ok){

  throw new Error(
    data.message ||
    "Unable to mark order as delivered"
  );

}


alert(
  "Order marked as delivered. The buyer can now confirm receipt."
);


/*
 * Reload vendor orders so the button disappears
 * and the new delivery status is displayed.
 */

await loadEarnings();

}catch(error){

console.error(
  "Mark delivered error:",
  error
);

alert(
  error.message ||
  "Failed to mark order as delivered."
);

}

}

async function markOrderShipped(orderId){

if(!requireAccount()) return;

const confirmed =
window.confirm(
"Confirm that this order has been shipped to the buyer?"
);

if(!confirmed){
return;
}

try{

const res =
  await fetch(
    `${ACCOUNT_API}/orders/${Number(orderId)}/status`,
    {
      method:"PUT",

      headers:{
        ...accountHeaders(),
        "Content-Type":"application/json"
      },

      body:JSON.stringify({
        status:"shipped"
      })
    }
  );


const data =
  await res.json().catch(()=>({}));


if(!res.ok){

  throw new Error(
    data.message ||
    "Unable to mark order as shipped"
  );

}


alert(
  "Order marked as shipped successfully."
);


/*
 * Reload vendor orders.
 *
 * The "Mark as Shipped" button will disappear
 * and the "Mark as Delivered" button will appear.
 */

await loadEarnings();

}catch(error){

console.error(
  "Mark shipped error:",
  error
);


alert(
  error.message ||
  "Failed to mark order as shipped."
);

}

}


document.addEventListener("DOMContentLoaded",()=>{
  const page=document.body.dataset.page;
  if(page==="orders") loadOrders();
  if(page==="cart") loadCart();
  if(page==="notifications") loadNotifications();
  if(page==="saved") loadSaved();
  if(page==="personal") loadPersonalInfo();
  if(page==="earnings") loadEarnings();
});
