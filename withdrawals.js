/* =========================================================
   CHARCOAL MARKETPLACE
   ADMIN PLATFORM WITHDRAWALS
========================================================= */


/* =========================================================
   RAILWAY API
========================================================= */

const WITHDRAWAL_API =
    "https://charcoal-marketplace-main-production.up.railway.app/api/a2u/withdrawals";


/* =========================================================
   AUTH HEADERS
   IMPORTANT:
   Admin dashboard uses adminToken.
========================================================= */

function withdrawalHeaders() {

    const token =
        localStorage.getItem("adminToken") ||
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
                    method:
                        "GET",

                    headers:
                        withdrawalHeaders()
                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Unable to load withdrawal summary (${response.status})`
            );

        }


        const available =
            document.getElementById(
                "availablePlatformEarnings"
            );


        const withdrawn =
            document.getElementById(
                "totalWithdrawn"
            );


        const percentage =
            document.getElementById(
                "totalAdminPercentage"
            );


        if (available) {

            available.textContent =
                `${Number(
                    data.available_pi || 0
                ).toFixed(8)} Pi`;

        }


        if (withdrawn) {

            withdrawn.textContent =
                `${Number(
                    data.withdrawn_pi || 0
                ).toFixed(8)} Pi`;

        }


        if (percentage) {

            percentage.textContent =
                `${Number(
                    data.total_admin_percentage || 0
                ).toFixed(2)}%`;

        }


        renderAdminShares(
            data.admins || []
        );


    } catch (error) {

        console.error(
            "Withdrawal summary:",
            error
        );


        const container =
            document.getElementById(
                "adminSharesContainer"
            );


        if (container) {

            container.innerHTML =
                `
                <p class="withdrawal-error">
                    ${escapeWithdrawalHtml(
                        error.message
                    )}
                </p>
                `;

        }

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

                const share =
                    Number(
                        admin.admin_share_percent || 0
                    );


                return `

                <div
                    class="admin-share-row"
                    data-user-id="${Number(
                        admin.id
                    )}"
                >

                    <div class="admin-share-info">

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

                        <small>
                            Pi:
                            ${escapeWithdrawalHtml(
                                admin.pi_username ||
                                admin.pi_uid ||
                                "Not connected"
                            )}
                        </small>

                    </div>


                    <div class="admin-share-input-wrapper">

                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value="${share}"
                            class="admin-share-input"
                            data-user-id="${Number(
                                admin.id
                            )}"
                        />

                        <span>
                            %
                        </span>

                    </div>

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


    if (!inputs.length) {

        alert(
            "No administrator share fields were found."
        );

        return;

    }


    const shares = [];


    let invalid =
        false;


    inputs.forEach(
        input => {

            const value =
                Number(
                    input.value
                );


            if (
                !Number.isFinite(value) ||
                value < 0 ||
                value > 100
            ) {

                invalid =
                    true;

                return;

            }


            shares.push({

                user_id:
                    Number(
                        input.dataset.userId
                    ),

                admin_share_percent:
                    value

            });

        }
    );


    if (invalid) {

        alert(
            "Each administrator percentage must be between 0% and 100%."
        );

        return;

    }


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
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Unable to save admin percentages (${response.status})`
            );

        }


        alert(
            data.message ||
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
   START PLATFORM WITHDRAWAL
========================================================= */

async function startPlatformWithdrawal() {

    const button =
        document.getElementById(
            "startWithdrawalButton"
        );


    const descriptionElement =
        document.getElementById(
            "withdrawalDescription"
        );


    const description =
        descriptionElement
            ?.value
            ?.trim() ||
        "Marketplace platform earnings withdrawal";


    if (!confirm(
        "Are you sure you want to withdraw and distribute ALL currently available platform earnings?"
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

                            description

                        })

                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Withdrawal failed (${response.status})`
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


        if (
            descriptionElement
        ) {

            descriptionElement.value =
                "";

        }


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
   LOAD WITHDRAWAL HISTORY
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

                    method:
                        "GET",

                    headers:
                        withdrawalHeaders()

                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Unable to load withdrawal history (${response.status})`
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

                    const status =
                        String(
                            withdrawal.status ||
                            ""
                        );


                    return `

                    <div
                        class="withdrawal-history-row"
                    >

                        <strong>
                            Withdrawal #${Number(
                                withdrawal.id
                            )}
                        </strong>

                        <span>
                            ${Number(
                                withdrawal.total_amount_pi || 0
                            ).toFixed(8)}
                            Pi
                        </span>

                        <span>
                            ${escapeWithdrawalHtml(
                                status
                            )}
                        </span>

                        <small>
                            ${escapeWithdrawalHtml(
                                withdrawal.description ||
                                ""
                            )}
                        </small>

                        <small>
                            ${escapeWithdrawalHtml(
                                withdrawal.created_at ||
                                ""
                            )}
                        </small>


                        ${
                            status !==
                            "completed"

                            ?

                            `
                            <button
                                type="button"
                                onclick="retryWithdrawal(${Number(
                                    withdrawal.id
                                )})"
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
            <p class="withdrawal-error">
                ${escapeWithdrawalHtml(
                    error.message
                )}
            </p>
            `;

    }

}


/* =========================================================
   RETRY WITHDRAWAL
========================================================= */

async function retryWithdrawal(
    withdrawalId
) {

    if (!withdrawalId) {

        return;

    }


    if (!confirm(
        `Retry failed payments for Withdrawal #${withdrawalId}?`
    )) {

        return;

    }


    try {

        const response =
            await fetch(
                `${WITHDRAWAL_API}/${Number(
                    withdrawalId
                )}/retry`,
                {

                    method:
                        "POST",

                    headers:
                        withdrawalHeaders()

                }
            );


        const data =
            await response.json()
                .catch(
                    () => ({})
                );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Retry failed (${response.status})`
            );

        }


        alert(
            data.message ||
            "Withdrawal retry completed."
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
   INITIALIZE WITHDRAWALS
========================================================= */

function initializeWithdrawals() {

    console.log(
        "Initializing platform withdrawals..."
    );


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