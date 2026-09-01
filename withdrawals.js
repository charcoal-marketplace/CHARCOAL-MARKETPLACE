/* =========================================================
   WITHDRAWALS
========================================================= */

const WITHDRAWAL_API =
    "/api/withdrawals";


/* =========================================================
   AUTH HEADERS
========================================================= */

function withdrawalHeaders() {

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt");

    return {

        "Content-Type":
            "application/json",

        ...(token
            ? {
                Authorization:
                    `Bearer ${token}`
              }
            : {})

    };

}


/* =========================================================
   LOAD WITHDRAWAL SUMMARY
========================================================= */

async function loadWithdrawalSummary() {

    try {

        const response =
            await fetch(
                `${WITHDRAWAL_API}/summary`,
                {
                    headers:
                        withdrawalHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load withdrawal summary"
            );

        }


        document.getElementById(
            "availablePlatformEarnings"
        ).textContent =
            `${Number(
                data.available_pi || 0
            ).toFixed(8)} Pi`;


        document.getElementById(
            "totalWithdrawn"
        ).textContent =
            `${Number(
                data.withdrawn_pi || 0
            ).toFixed(8)} Pi`;


        document.getElementById(
            "totalAdminPercentage"
        ).textContent =
            `${Number(
                data.total_admin_percentage || 0
            ).toFixed(2)}%`;


        renderAdminShares(
            data.admins || []
        );


    } catch (error) {

        console.error(
            "Withdrawal summary:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   RENDER ADMIN SHARES
========================================================= */

function renderAdminShares(
    admins
) {

    const container =
        document.getElementById(
            "adminSharesContainer"
        );


    if (!container) {

        return;

    }


    if (!admins.length) {

        container.innerHTML =
            `
            <p>
                No approved administrators found.
            </p>
            `;

        return;

    }


    container.innerHTML =
        admins.map(
            admin => {

                return `

                <div
                    class="admin-share-row"
                    data-user-id="${admin.id}"
                >

                    <div>

                        <strong>
                            ${escapeWithdrawalHtml(
                                admin.name
                            )}
                        </strong>

                        <small>
                            ${escapeWithdrawalHtml(
                                admin.admin_level
                            )}
                        </small>

                        <br>

                        <small>
                            Pi:
                            ${escapeWithdrawalHtml(
                                admin.pi_username ||
                                admin.pi_uid ||
                                "Not connected"
                            )}
                        </small>

                    </div>


                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value="${Number(
                            admin.admin_share_percent || 0
                        )}"
                        class="admin-share-input"
                        data-user-id="${admin.id}"
                    />

                    <span>
                        %
                    </span>

                </div>

                `;

            }
        ).join("");

}


/* =========================================================
   SAVE ADMIN SHARES
========================================================= */

async function saveAdminShares() {

    const inputs =
        document.querySelectorAll(
            ".admin-share-input"
        );


    const shares = [];


    inputs.forEach(
        input => {

            shares.push({

                user_id:
                    Number(
                        input.dataset.userId
                    ),

                admin_share_percent:
                    Number(
                        input.value
                    )

            });

        }
    );


    const total =
        shares.reduce(
            (
                sum,
                item
            ) =>
                sum +
                Number(
                    item.admin_share_percent || 0
                ),
            0
        );


    if (
        Math.abs(
            total - 100
        ) > 0.0001
    ) {

        alert(
            `Admin percentages must total 100%. Current total: ${total.toFixed(2)}%`
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${WITHDRAWAL_API}/admin-shares`,
                {

                    method:
                        "POST",

                    headers:
                        withdrawalHeaders(),

                    body:
                        JSON.stringify({
                            shares
                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to save admin percentages"
            );

        }


        alert(
            "Admin percentages saved successfully."
        );


        await loadWithdrawalSummary();


    } catch (error) {

        console.error(
            "Save admin shares:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   START WITHDRAWAL
========================================================= */

async function startPlatformWithdrawal() {

    const button =
        document.getElementById(
            "startWithdrawalButton"
        );


    const description =
        document.getElementById(
            "withdrawalDescription"
        )?.value.trim();


    if (!confirm(
        "Are you sure you want to withdraw and distribute all currently available platform earnings?"
    )) {

        return;

    }


    try {

        if (button) {

            button.disabled =
                true;

            button.textContent =
                "Processing withdrawal...";

        }


        const response =
            await fetch(
                `${WITHDRAWAL_API}/start`,
                {

                    method:
                        "POST",

                    headers:
                        withdrawalHeaders(),

                    body:
                        JSON.stringify({

                            description:
                                description ||
                                "Marketplace platform earnings withdrawal"

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Withdrawal failed"
            );

        }


        console.log(
            "Withdrawal result:",
            data
        );


        alert(
            data.message ||
            "Withdrawal processing completed."
        );


        await loadWithdrawalSummary();

        await loadWithdrawalHistory();


    } catch (error) {

        console.error(
            "Start withdrawal:",
            error
        );


        alert(
            error.message
        );

    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                `
                <i class="fas fa-money-bill-transfer"></i>
                Withdraw Platform Earnings
                `;

        }

    }

}


/* =========================================================
   LOAD HISTORY
========================================================= */

async function loadWithdrawalHistory() {

    const container =
        document.getElementById(
            "withdrawalHistory"
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                `${WITHDRAWAL_API}/history`,
                {
                    headers:
                        withdrawalHeaders()
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Unable to load withdrawal history"
            );

        }


        const withdrawals =
            data.withdrawals ||
            [];


        if (!withdrawals.length) {

            container.innerHTML =
                `
                <p>
                    No withdrawals yet.
                </p>
                `;

            return;

        }


        container.innerHTML =
            withdrawals.map(
                withdrawal => {

                    return `

                    <div
                        class="withdrawal-history-row"
                    >

                        <strong>
                            Withdrawal #${withdrawal.id}
                        </strong>

                        <span>
                            ${Number(
                                withdrawal.total_amount_pi || 0
                            ).toFixed(8)}
                            Pi
                        </span>

                        <span>
                            ${escapeWithdrawalHtml(
                                withdrawal.status
                            )}
                        </span>

                        <small>
                            ${escapeWithdrawalHtml(
                                withdrawal.description || ""
                            )}
                        </small>

                        <small>
                            ${withdrawal.created_at || ""}
                        </small>

                        ${
                            withdrawal.status !==
                            "completed"

                            ?

                            `
                            <button
                                type="button"
                                onclick="retryWithdrawal(${withdrawal.id})"
                            >
                                Retry
                            </button>
                            `

                            :

                            ""
                        }

                    </div>

                    `;

                }
            ).join("");


    } catch (error) {

        console.error(
            "Withdrawal history:",
            error
        );


        container.innerHTML =
            `
            <p>
                ${escapeWithdrawalHtml(
                    error.message
                )}
            </p>
            `;

    }

}


/* =========================================================
   RETRY
========================================================= */

async function retryWithdrawal(
    withdrawalId
) {

    if (!confirm(
        `Retry failed payments for Withdrawal #${withdrawalId}?`
    )) {

        return;

    }


    try {

        const response =
            await fetch(
                `${WITHDRAWAL_API}/${withdrawalId}/retry`,
                {

                    method:
                        "POST",

                    headers:
                        withdrawalHeaders()

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Retry failed"
            );

        }


        alert(
            data.message
        );


        await loadWithdrawalSummary();

        await loadWithdrawalHistory();


    } catch (error) {

        console.error(
            "Retry withdrawal:",
            error
        );


        alert(
            error.message
        );

    }

}


/* =========================================================
   LOAD WHEN WITHDRAWAL SECTION OPENS
========================================================= */

function initializeWithdrawals() {

    loadWithdrawalSummary();

    loadWithdrawalHistory();

}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeWithdrawalHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}