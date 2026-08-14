/* =====================================================
   MAHARASHTRA TOWING SERVICE
   FINAL APP.JS
   VEHICLE PAGINATION
   CONTACT UPDATED
   ACCOUNTS PAGINATION
   MAINTENANCE DETAILS
===================================================== */


/* =====================================================
   GOOGLE SHEETS API
===================================================== */

const GOOGLE_SHEET_API =
  "https://script.google.com/macros/s/AKfycbzk39uUOIYynCJcrwqNlkTzlpsTeottcUhQooeh5hitSVc3box_9MWfT2o8J6Wkx3Bv/exec";


/* =====================================================
   COMMON FUNCTIONS
===================================================== */

const $ = selector =>
  document.querySelector(selector);


const today =
  new Date()
    .toISOString()
    .slice(0, 10);


const get = key =>
  JSON.parse(
    localStorage.getItem(key) || "[]"
  );


const put = (key, value) =>
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );


const money = number =>
  `₹${Number(number || 0).toLocaleString("en-IN")}`;


const esc = value =>
  String(value ?? "").replace(
    /[&<>"']/g,
    character =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
  );


const fmt = date =>
  date
    ? new Date(`${date}T00:00:00`)
        .toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        )
    : "—";


/* =====================================================
   GOOGLE SHEETS
===================================================== */

const sendToGoogleSheets = data => {

  try {

    fetch(
      GOOGLE_SHEET_API,
      {
        method: "POST",

        mode: "no-cors",

        headers: {
          "Content-Type":
            "text/plain;charset=utf-8"
        },

        body:
          JSON.stringify(data),

        keepalive: true
      }
    )
    .catch(error => {

      console.error(
        "Google Sheets error:",
        error
      );

    });

  }

  catch (error) {

    console.error(
      "Google Sheets request error:",
      error
    );

  }

};


/* =====================================================
   ACCOUNT HELPERS
===================================================== */

const getToll = account =>
  Number(
    account?.toll || 0
  );


const getRepair = account =>
  Number(
    account?.repair ??
    account?.repairing ??
    0
  );


const maintenanceTotal = account => {

  if (
    account &&
    (
      account.toll !== undefined ||
      account.repair !== undefined
    )
  ) {

    return (
      getToll(account) +
      getRepair(account)
    );

  }

  return Number(
    account?.maintenance || 0
  );

};


/* =====================================================
   DAILY PROFIT

   Charges
   - Diesel
   - Toll

   Repair is NOT deducted
===================================================== */

const correctProfit = account => {

  const charges =
    Number(
      account?.charges || 0
    );

  const diesel =
    Number(
      account?.diesel || 0
    );

  const toll =
    getToll(account);

  return (
    charges -
    diesel -
    toll
  );

};


/* =====================================================
   VEHICLE RECORDS PAGE
===================================================== */

if (
  document.body.dataset.page === "records"
) {

  let records =
    get("mts-final-records");


  /* ===================================================
     VEHICLE PAGINATION
  =================================================== */

  const RECORDS_PER_PAGE = 50;

  let currentPage = 1;


  /* ===================================================
     DEFAULT DATE
  =================================================== */

  if ($("#date")) {

    $("#date").value =
      today;

  }


  /* ===================================================
     CONTACT NUMBER
  =================================================== */

  const contactInput =
    $("#contact");


  if (contactInput) {

    contactInput.addEventListener(
      "input",
      () => {

        let value =
          contactInput.value;

        value =
          value.replace(
            /[^0-9+\-\s()]/g,
            ""
          );

        contactInput.value =
          value.slice(0, 16);

      }
    );

  }


  /* ===================================================
     RENDER VEHICLES
  =================================================== */

  const render = () => {

    records =
      get("mts-final-records");


    const dateSearch =
      $("#dateSearch")?.value || "";


    const vehicleSearch =
      $("#vehicleSearch")
        ?.value
        .trim()
        .toLowerCase() || "";


    /* =================================================
       SEARCH ALL RECORDS
    ================================================= */

    const filtered =
      records

        .filter(record =>

          (
            !dateSearch ||
            record.date === dateSearch
          )

          &&

          (
            !vehicleSearch ||

            String(
              record.vehicle || ""
            )
              .toLowerCase()
              .includes(
                vehicleSearch
              )
          )

        )


        /* =============================================
           NEWEST FIRST
        ============================================= */

        .sort(
          (a, b) => {

            const dateCompare =
              String(
                b.date || ""
              )
                .localeCompare(
                  String(
                    a.date || ""
                  )
                );


            if (
              dateCompare !== 0
            ) {

              return dateCompare;

            }


            return (
              records.indexOf(b) -
              records.indexOf(a)
            );

          }
        );


    /* =================================================
       PAGE COUNT
    ================================================= */

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          filtered.length /
          RECORDS_PER_PAGE
        )
      );


    if (
      currentPage > totalPages
    ) {

      currentPage =
        totalPages;

    }


    const start =
      (
        currentPage - 1
      ) *
      RECORDS_PER_PAGE;


    const end =
      start +
      RECORDS_PER_PAGE;


    const list =
      filtered.slice(
        start,
        end
      );


    if (
      !$("#recordsBody")
    ) {

      return;

    }


    /* =================================================
       VEHICLE TABLE
    ================================================= */

    $("#recordsBody").innerHTML =

      list.length

        ?

        list
          .map(
            record => `

              <tr>

                <td>
                  ${fmt(record.date)}
                </td>


                <td>
                  <b>
                    ${esc(
                      record.vehicle
                    )}
                  </b>
                </td>


                <td>
                  ${esc(
                    record.contact
                  )}
                </td>


                <td>
                  ${esc(
                    record.pickup
                  )}
                </td>


                <td>
                  ${esc(
                    record.drop
                  )}
                </td>


                <td>
                  ${money(
                    record.charges
                  )}
                </td>


                <td>

                  <button
                    class="delete"
                    data-id="${record.id}"
                    type="button"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            `
          )
          .join("")

        :

        `

          <tr>

            <td
              colspan="7"
              class="empty"
            >
              No vehicle records found.
            </td>

          </tr>

        `;


    /* =================================================
       PAGINATION INFO
    ================================================= */

    const pageInfo =
      $("#recordsPageInfo");


    const previous =
      $("#prevRecords");


    const next =
      $("#nextRecords");


    if (pageInfo) {

      pageInfo.textContent =
        filtered.length

          ?

          `Page ${currentPage} of ${totalPages} · ${filtered.length} records`

          :

          "Page 1 · 0 records";

    }


    if (previous) {

      previous.disabled =
        currentPage <= 1;

    }


    if (next) {

      next.disabled =
        currentPage >= totalPages;

    }

  };


  /* ===================================================
     SAVE VEHICLE
  =================================================== */

  if ($("#recordForm")) {

    $("#recordForm").onsubmit =
      event => {

        event.preventDefault();


        const form =
          new FormData(
            event.target
          );


        const contact =
          String(
            form.get("contact") || ""
          )
            .trim();


        const vehicleData = {

          type:
            "vehicle",

          id:
            crypto.randomUUID(),

          date:
            form.get("date"),

          vehicle:
            String(
              form.get("vehicle") || ""
            )
              .trim()
              .toUpperCase(),

          contact,

          pickup:
            String(
              form.get("pickup") || ""
            )
              .trim(),

          drop:
            String(
              form.get("drop") || ""
            )
              .trim(),

          charges:
            Number(
              form.get("charges") || 0
            )

        };


        records.push(
          vehicleData
        );


        put(
          "mts-final-records",
          records
        );


        event.target.reset();


        if ($("#date")) {

          $("#date").value =
            today;

        }


        currentPage = 1;


        render();


        if ($("#recordMessage")) {

          $("#recordMessage")
            .textContent =
              "✓ Vehicle record saved.";

        }


        sendToGoogleSheets(
          vehicleData
        );


        setTimeout(
          () => {

            if (
              $("#recordMessage")
            ) {

              $("#recordMessage")
                .textContent = "";

            }

          },
          2500
        );

      };

  }


  /* ===================================================
     SEARCH
  =================================================== */

  if ($("#dateSearch")) {

    $("#dateSearch").onchange =
      () => {

        currentPage = 1;

        render();

      };

  }


  if ($("#vehicleSearch")) {

    $("#vehicleSearch").oninput =
      () => {

        currentPage = 1;

        render();

      };

  }


  /* ===================================================
     CLEAR SEARCH
  =================================================== */

  if ($("#clearSearch")) {

    $("#clearSearch").onclick =
      () => {

        if ($("#dateSearch")) {

          $("#dateSearch").value =
            "";

        }


        if ($("#vehicleSearch")) {

          $("#vehicleSearch").value =
            "";

        }


        currentPage = 1;

        render();

      };

  }


  /* ===================================================
     PREVIOUS VEHICLE PAGE
  =================================================== */

  if ($("#prevRecords")) {

    $("#prevRecords").onclick =
      () => {

        if (
          currentPage > 1
        ) {

          currentPage--;

          render();


          $("#recordsBody")
            ?.closest(".table-card")
            ?.scrollIntoView({
              behavior:
                "smooth",

              block:
                "start"
            });

        }

      };

  }


  /* ===================================================
     NEXT VEHICLE PAGE
  =================================================== */

  if ($("#nextRecords")) {

    $("#nextRecords").onclick =
      () => {

        currentPage++;

        render();


        $("#recordsBody")
          ?.closest(".table-card")
          ?.scrollIntoView({
            behavior:
              "smooth",

            block:
              "start"
          });

      };

  }


  /* ===================================================
     DELETE VEHICLE
  =================================================== */

  if ($("#recordsBody")) {

    $("#recordsBody").onclick =
      event => {

        if (
          !event.target.matches(
            ".delete"
          )
        ) {

          return;

        }


        const id =
          event.target.dataset.id;


        if (
          !confirm(
            "Delete this vehicle record?\n\nIts Accounts entry will also be deleted."
          )
        ) {

          return;

        }


        const deletedRecord =
          records.find(
            record =>
              record.id === id
          );


        records =
          records.filter(
            record =>
              record.id !== id
          );


        put(
          "mts-final-records",
          records
        );


        let accounts =
          get("mts-final-accounts");


        const deletedAccounts =
          accounts.filter(
            account =>
              account.recordId === id
          );


        accounts =
          accounts.filter(
            account =>
              account.recordId !== id
          );


        put(
          "mts-final-accounts",
          accounts
        );


        if (deletedRecord) {

          sendToGoogleSheets({

            type:
              "deleteVehicle",

            date:
              deletedRecord.date,

            vehicle:
              deletedRecord.vehicle

          });

        }


        deletedAccounts.forEach(
          account => {

            sendToGoogleSheets({

              type:
                "deleteAccount",

              id:
                account.id,

              recordId:
                account.recordId,

              date:
                account.date,

              vehicle:
                account.vehicle

            });

          }
        );


        render();

      };

  }


  /* ===================================================
     INITIAL VEHICLE RENDER
  =================================================== */

  render();

}


/* =====================================================
   ACCOUNTS PAGE
===================================================== */

if (
  document.body.dataset.page === "accounts"
) {

  let records =
    get("mts-final-records");


  let accounts =
    get("mts-final-accounts");


  /* ===================================================
     ACCOUNTS PAGINATION
  =================================================== */

  const EXPENSES_PER_PAGE = 25;

  let expenseCurrentPage = 1;


  /* ===================================================
     DEFAULT DATES
  =================================================== */

  if ($("#accountDate")) {

    $("#accountDate").value =
      today;

  }


  const currentYear =
    new Date().getFullYear();


  if ($("#fromDate")) {

    $("#fromDate").value =
      `${currentYear}-01-01`;

  }


  if ($("#toDate")) {

    $("#toDate").value =
      today;

  }


  if ($("#monthPick")) {

    $("#monthPick").value =
      today.slice(0, 7);

  }


  /* ===================================================
     SUM
  =================================================== */

  const sum = list => {

    return list.reduce(

      (total, item) => {

        total.charges +=
          Number(
            item.charges || 0
          );


        total.diesel +=
          Number(
            item.diesel || 0
          );


        total.toll +=
          getToll(item);


        total.repair +=
          getRepair(item);


        total.maintenance +=
          maintenanceTotal(item);


        total.profit +=
          correctProfit(item);


        return total;

      },

      {
        charges:
          0,

        diesel:
          0,

        toll:
          0,

        repair:
          0,

        maintenance:
          0,

        profit:
          0
      }

    );

  };


  /* ===================================================
     DAILY VEHICLE JOBS
  =================================================== */

  const jobs = () => {

    if (
      !$("#accountDate")
    ) {

      return;

    }


    const date =
      $("#accountDate").value;


    records =
      get("mts-final-records");


    accounts =
      get("mts-final-accounts");


    const list =
      records.filter(
        record =>
          record.date === date
      );


    const old =
      Object.fromEntries(

        accounts

          .filter(
            account =>
              account.date === date
          )

          .map(
            account => [
              account.recordId,
              account
            ]
          )

      );


    if (!$("#jobsList")) {

      return;

    }


    $("#jobsList").innerHTML =

      list.length

        ?

        list
          .map(
            (record, index) => {

              const account =
                old[record.id] || {};


              const diesel =
                Number(
                  account.diesel || 0
                );


              const toll =
                getToll(account);


              const repair =
                getRepair(account);


              return `

                <article
                  class="job"
                  data-id="${record.id}"
                >


                  <div class="job-title">

                    <b>
                      ${index + 1}.
                      ${esc(
                        record.vehicle
                      )}
                    </b>


                    <small>
                      ${esc(
                        record.pickup
                      )}
                      →
                      ${esc(
                        record.drop
                      )}
                    </small>

                  </div>


                  <div class="charge">

                    Charges

                    <br>

                    <b>
                      ${money(
                        record.charges
                      )}
                    </b>

                  </div>


                  <label>

                    Diesel (₹)

                    <input
                      class="diesel"
                      type="number"
                      min="0"
                      step="1"
                      value="${diesel || ""}"
                      placeholder="0"
                    >

                  </label>


                  <label>

                    Toll (₹)

                    <input
                      class="toll"
                      type="number"
                      min="0"
                      step="1"
                      value="${toll || ""}"
                      placeholder="0"
                    >

                  </label>


                  <label>

                    Repair (₹)

                    <input
                      class="repair"
                      type="number"
                      min="0"
                      step="1"
                      value="${repair || ""}"
                      placeholder="0"
                    >

                  </label>


                  <label>

                    Repair Details

                    <textarea
                      class="details"
                      placeholder="e.g. Tyre repair / Engine repair / Part replacement"
                    >${esc(
                      account.details || ""
                    )}</textarea>

                  </label>


                </article>

              `;

            }
          )
          .join("")

        :

        `

          <div
            class="empty"
            style="padding:25px;"
          >

            No towing vehicle record exists
            for this date.

            <br>
            <br>

            Add it first from Vehicle Records.

          </div>

        `;


    live();

  };


  /* ===================================================
     LIVE DAILY PROFIT
  =================================================== */

  const live = () => {

    if (
      !$("#dailyProfitLabel")
    ) {

      return;

    }


    const current =

      [
        ...document.querySelectorAll(
          ".job"
        )
      ]

        .map(
          job => {

            const record =
              records.find(
                item =>
                  item.id ===
                  job.dataset.id
              );


            const charges =
              Number(
                record?.charges || 0
              );


            const diesel =
              Number(
                job.querySelector(
                  ".diesel"
                )?.value || 0
              );


            const toll =
              Number(
                job.querySelector(
                  ".toll"
                )?.value || 0
              );


            const repair =
              Number(
                job.querySelector(
                  ".repair"
                )?.value || 0
              );


            const profit =
              charges -
              diesel -
              toll;


            return {

              charges,

              diesel,

              toll,

              repair,

              maintenance:
                toll + repair,

              profit

            };

          }
        );


    const total =
      current.reduce(

        (result, item) => {

          result.charges +=
            item.charges;

          result.diesel +=
            item.diesel;

          result.toll +=
            item.toll;

          result.repair +=
            item.repair;

          result.maintenance +=
            item.maintenance;

          result.profit +=
            item.profit;

          return result;

        },

        {
          charges:
            0,

          diesel:
            0,

          toll:
            0,

          repair:
            0,

          maintenance:
            0,

          profit:
            0
        }

      );


    $("#dailyProfitLabel").innerHTML = `

      Profit for selected date

      <b>
        ${money(
          total.profit
        )}
      </b>

    `;

  };


  /* ===================================================
     SAVE DAILY ACCOUNTS
  =================================================== */

  if ($("#saveAccounts")) {

    $("#saveAccounts").onclick =
      () => {

        const date =
          $("#accountDate").value;


        const jobElements =
          [
            ...document.querySelectorAll(
              ".job"
            )
          ];


        if (
          !jobElements.length
        ) {

          $("#accountMessage")
            .textContent =
              "⚠️ No vehicle records for this date.";

          return;

        }


        const newRows =
          jobElements

            .map(
              job => {

                const record =
                  records.find(
                    item =>
                      item.id ===
                      job.dataset.id
                  );


                if (!record) {

                  return null;

                }


                const diesel =
                  Number(
                    job.querySelector(
                      ".diesel"
                    )?.value || 0
                  );


                const toll =
                  Number(
                    job.querySelector(
                      ".toll"
                    )?.value || 0
                  );


                const repair =
                  Number(
                    job.querySelector(
                      ".repair"
                    )?.value || 0
                  );


                const details =
                  job.querySelector(
                    ".details"
                  )?.value
                    .trim() || "";


                const profit =
                  Number(
                    record.charges || 0
                  ) -
                  diesel -
                  toll;


                const maintenance =
                  toll +
                  repair;


                const existing =
                  accounts.find(
                    account =>
                      account.recordId ===
                      record.id
                  );


                return {

                  id:
                    existing?.id ||
                    crypto.randomUUID(),

                  recordId:
                    record.id,

                  date,

                  vehicle:
                    record.vehicle,

                  pickup:
                    record.pickup,

                  drop:
                    record.drop,

                  charges:
                    Number(
                      record.charges || 0
                    ),

                  diesel,

                  toll,

                  repair,

                  maintenance,

                  details,

                  profit

                };

              }
            )

            .filter(Boolean);


        /* =============================================
           LOCAL SAVE
        ============================================= */

        accounts =
          accounts

            .filter(
              account =>
                account.date !== date
            )

            .concat(
              newRows
            );


        put(
          "mts-final-accounts",
          accounts
        );


        $("#accountMessage")
          .textContent =
            "✓ Entries saved.";


        /* =============================================
           GOOGLE SHEETS
        ============================================= */

        newRows.forEach(
          row => {

            sendToGoogleSheets({

              type:
                "account",

              id:
                row.id,

              recordId:
                row.recordId,

              date:
                row.date,

              vehicle:
                row.vehicle,

              pickup:
                row.pickup,

              drop:
                row.drop,

              charges:
                row.charges,

              diesel:
                row.diesel,

              toll:
                row.toll,

              repair:
                row.repair,

              repairing:
                row.repair,

              maintenance:
                row.maintenance,

              details:
                row.details,

              profit:
                row.profit

            });

          }
        );


        jobs();

        report();


        setTimeout(
          () => {

            if (
              $("#accountMessage")
            ) {

              $("#accountMessage")
                .textContent = "";

            }

          },
          2500
        );

      };

  }


  /* ===================================================
     REPORT
  =================================================== */

  const report = () => {

    accounts =
      get("mts-final-accounts");


    const from =
      $("#fromDate")?.value || "";


    const to =
      $("#toDate")?.value || "";


    const filtered =
      accounts.filter(
        account =>

          (
            !from ||
            account.date >= from
          )

          &&

          (
            !to ||
            account.date <= to
          )

      );


    const totals =
      sum(filtered);


    /* =================================================
       SUMMARY
    ================================================= */

    if ($("#totalCharges")) {

      $("#totalCharges")
        .textContent =
          money(
            totals.charges
          );

    }


    if ($("#totalDiesel")) {

      $("#totalDiesel")
        .textContent =
          money(
            totals.diesel
          );

    }


    if ($("#totalMaintenance")) {

      $("#totalMaintenance")
        .textContent =
          money(
            totals.maintenance
          );

    }


    if ($("#totalProfit")) {

      $("#totalProfit")
        .textContent =
          money(
            totals.charges -
            totals.diesel -
            totals.maintenance
          );

    }


    /* =================================================
       MONTHLY PERFORMANCE
    ================================================= */

    const groups = {};


    accounts.forEach(
      account => {

        const month =
          String(
            account.date || ""
          )
            .slice(0, 7);


        if (!month) {

          return;

        }


        if (
          !groups[month]
        ) {

          groups[month] = [];

        }


        groups[month].push(
          account
        );

      }
    );


    const monthlyRows =

      Object.entries(
        groups
      )

        .sort(
          (a, b) =>
            b[0].localeCompare(
              a[0]
            )
        )

        .map(
          ([month, list]) => {

            const total =
              sum(list);


            const monthName =
              new Date(
                `${month}-01T00:00:00`
              )
                .toLocaleString(
                  "en-IN",
                  {
                    month:
                      "long",

                    year:
                      "numeric"
                  }
                );


            const profit =
              total.charges -
              total.diesel -
              total.maintenance;


            return `

              <tr>

                <td>

                  <b>
                    ${monthName}
                  </b>

                </td>


                <td>
                  ${list.length}
                </td>


                <td>
                  ${money(
                    total.charges
                  )}
                </td>


                <td>
                  ${money(
                    total.diesel
                  )}
                </td>


                <td>
                  ${money(
                    total.maintenance
                  )}
                </td>


                <td
                  class="${
                    profit < 0
                      ? ""
                      : "good"
                  }"
                >

                  ${money(
                    profit
                  )}

                </td>

              </tr>

            `;

          }
        )
        .join("");


    if (
      $("#monthlyBody")
    ) {

      $("#monthlyBody").innerHTML =
        monthlyRows ||

        `

          <tr>

            <td
              colspan="6"
              class="empty"
            >
              No account entries yet.
            </td>

          </tr>

        `;

    }


    /* =================================================
       COMPLETE EXPENSE HISTORY
    ================================================= */

    const sortedAccounts =
      accounts

        .slice()

        .sort(
          (a, b) => {

            const dateCompare =
              String(
                b.date || ""
              )
                .localeCompare(
                  String(
                    a.date || ""
                  )
                );


            if (
              dateCompare !== 0
            ) {

              return dateCompare;

            }


            return (
              accounts.indexOf(b) -
              accounts.indexOf(a)
            );

          }
        );


    /* =================================================
       EXPENSE PAGE COUNT
    ================================================= */

    const totalExpensePages =
      Math.max(
        1,
        Math.ceil(
          sortedAccounts.length /
          EXPENSES_PER_PAGE
        )
      );


    if (
      expenseCurrentPage >
      totalExpensePages
    ) {

      expenseCurrentPage =
        totalExpensePages;

    }


    const expenseStart =
      (
        expenseCurrentPage -
        1
      ) *
      EXPENSES_PER_PAGE;


    const expenseEnd =
      expenseStart +
      EXPENSES_PER_PAGE;


    const expenseList =
      sortedAccounts.slice(
        expenseStart,
        expenseEnd
      );


    /* =================================================
       EXPENSE TABLE
    ================================================= */

    const expenseRows =

      expenseList

        .map(
          account => {

            const toll =
              getToll(account);


            const repair =
              getRepair(account);


            const maintenance =
              maintenanceTotal(
                account
              );


            const profit =
              Number(
                account.charges || 0
              ) -

              Number(
                account.diesel || 0
              ) -

              maintenance;


            return `

              <tr>


                <!-- DATE -->

                <td>
                  ${fmt(
                    account.date
                  )}
                </td>


                <!-- VEHICLE -->

                <td>

                  <b>
                    ${esc(
                      account.vehicle
                    )}
                  </b>

                </td>


                <!-- ROUTE -->

                <td>

                  ${esc(
                    account.pickup
                  )}

                  →

                  ${esc(
                    account.drop
                  )}

                </td>


                <!-- CHARGES -->

                <td>
                  ${money(
                    account.charges
                  )}
                </td>


                <!-- DIESEL -->

                <td>
                  ${money(
                    account.diesel
                  )}
                </td>


                <!-- TOLL -->

                <td>
                  ${money(
                    toll
                  )}
                </td>


                <!-- REPAIR -->

                <td>
                  ${money(
                    repair
                  )}
                </td>


                <!-- DETAILS -->

                <td>

                  ${esc(
                    account.details ||
                    "—"
                  )}

                </td>


                <!-- PROFIT -->

                <td
                  style="${
                    profit < 0

                      ?

                      "color:#dc1d2f;font-weight:800;"

                      :

                      "color:#109b66;font-weight:700;"
                  }"
                >

                  ${money(
                    profit
                  )}

                </td>


                <!-- ACTION -->

                <td>

                  <button
                    class="edit-account"
                    data-id="${account.id}"
                    type="button"
                  >
                    Edit
                  </button>


                  <button
                    class="delete-account"
                    data-id="${account.id}"
                    type="button"
                  >
                    Delete
                  </button>

                </td>


              </tr>

            `;

          }
        )
        .join("");


    if (
      $("#expensesBody")
    ) {

      $("#expensesBody").innerHTML =
        expenseRows ||

        `

          <tr>

            <td
              colspan="10"
              class="empty"
            >
              No expense entries yet.
            </td>

          </tr>

        `;

    }


    /* =================================================
       EXPENSE PAGINATION UI
    ================================================= */

    const expensePageInfo =
      $("#expensesPageInfo");


    const expensePrevious =
      $("#prevExpenses");


    const expenseNext =
      $("#nextExpenses");


    if (
      expensePageInfo
    ) {

      expensePageInfo.textContent =

        sortedAccounts.length

          ?

          `Page ${expenseCurrentPage} of ${totalExpensePages} · ${sortedAccounts.length} entries`

          :

          "Page 1 · 0 entries";

    }


    if (
      expensePrevious
    ) {

      expensePrevious.disabled =
        expenseCurrentPage <= 1;

    }


    if (
      expenseNext
    ) {

      expenseNext.disabled =
        expenseCurrentPage >=
        totalExpensePages;

    }


    idle();

  };


  /* ===================================================
     EDIT / DELETE ACCOUNT
  =================================================== */

  if (
    $("#expensesBody")
  ) {

    $("#expensesBody").onclick =
      event => {


        /* =============================================
           DELETE
        ============================================= */

        if (
          event.target.matches(
            ".delete-account"
          )
        ) {

          const id =
            event.target.dataset.id;


          const account =
            accounts.find(
              item =>
                item.id === id
            );


          if (!account) {

            return;

          }


          if (
            !confirm(
              "Delete this expense entry?"
            )
          ) {

            return;

          }


          accounts =
            accounts.filter(
              item =>
                item.id !== id
            );


          put(
            "mts-final-accounts",
            accounts
          );


          sendToGoogleSheets({

            type:
              "deleteAccount",

            id:
              account.id,

            recordId:
              account.recordId,

            date:
              account.date,

            vehicle:
              account.vehicle

          });


          jobs();

          report();

          return;

        }


        /* =============================================
           EDIT
        ============================================= */

        if (
          event.target.matches(
            ".edit-account"
          )
        ) {

          const id =
            event.target.dataset.id;


          const account =
            accounts.find(
              item =>
                item.id === id
            );


          if (!account) {

            return;

          }


          $("#accountDate").value =
            account.date;


          jobs();


          setTimeout(
            () => {

              const job =
                document.querySelector(
                  `.job[data-id="${account.recordId}"]`
                );


              if (!job) {

                return;

              }


              job.scrollIntoView({

                behavior:
                  "smooth",

                block:
                  "center"

              });


              job.style.outline =
                "2px solid #dc1d2f";


              setTimeout(
                () => {

                  job.style.outline =
                    "";

                },
                2500
              );


              if (
                $("#accountMessage")
              ) {

                $("#accountMessage")
                  .textContent =
                    "✎ Edit the values above and click Save Today's Entries.";

              }

            },
            100
          );

        }

      };

  }


  /* ===================================================
     EXPENSE PREVIOUS PAGE
  =================================================== */

  if (
    $("#prevExpenses")
  ) {

    $("#prevExpenses").onclick =
      () => {

        if (
          expenseCurrentPage > 1
        ) {

          expenseCurrentPage--;

          report();


          $("#expensesBody")
            ?.closest(".table-card")
            ?.scrollIntoView({

              behavior:
                "smooth",

              block:
                "start"

            });

        }

      };

  }


  /* ===================================================
     EXPENSE NEXT PAGE
  =================================================== */

  if (
    $("#nextExpenses")
  ) {

    $("#nextExpenses").onclick =
      () => {

        expenseCurrentPage++;

        report();


        $("#expensesBody")
          ?.closest(".table-card")
          ?.scrollIntoView({

            behavior:
              "smooth",

            block:
              "start"

          });

      };

  }


  /* ===================================================
     NO TOWING DAYS
  =================================================== */

  const idle = () => {

    if (
      !$("#monthPick")
    ) {

      return;

    }


    const month =
      $("#monthPick").value;


    if (!month) {

      return;

    }


    const year =
      Number(
        month.slice(0, 4)
      );


    const monthNumber =
      Number(
        month.slice(5, 7)
      );


    const lastDay =
      new Date(
        year,
        monthNumber,
        0
      )
        .getDate();


    const currentMonth =
      today.slice(0, 7);


    const lastDayToShow =
      currentMonth === month

        ?

        Number(
          today.slice(8, 10)
        )

        :

        lastDay;


    const days = [];


    for (
      let day = 1;
      day <= lastDayToShow;
      day++
    ) {

      const date =
        `${month}-${String(day).padStart(2, "0")}`;


      if (
        !records.some(
          record =>
            record.date === date
        )
      ) {

        days.push(day);

      }

    }


    const monthName =
      new Date(
        `${month}-01T00:00:00`
      )
        .toLocaleString(
          "en-IN",
          {
            month:
              "long",

            year:
              "numeric"
          }
        );


    if (
      $("#idleIntro")
    ) {

      $("#idleIntro").textContent =

        days.length

          ?

          `${days.length} day(s) with no towing job in ${monthName}.`

          :

          "Great work — every day has at least one towing job.";

    }


    if (
      $("#idleDays")
    ) {

      $("#idleDays").innerHTML =

        days

          .map(
            day => `

              <span
                class="idle-day"
              >

                ${day}

                ${new Date(
                  `${month}-01T00:00:00`
                )
                  .toLocaleString(
                    "en-IN",
                    {
                      month:
                        "short"
                    }
                  )}

              </span>

            `
          )
          .join("");

    }

  };


  /* ===================================================
     EVENT LISTENERS
  =================================================== */

  if (
    $("#accountDate")
  ) {

    $("#accountDate").onchange =
      jobs;

  }


  if (
    $("#jobsList")
  ) {

    $("#jobsList").oninput =
      live;

  }


  if (
    $("#calculate")
  ) {

    $("#calculate").onclick =
      () => {

        expenseCurrentPage = 1;

        report();

      };

  }


  if (
    $("#fromDate")
  ) {

    $("#fromDate").onchange =
      () => {

        expenseCurrentPage = 1;

        report();

      };

  }


  if (
    $("#toDate")
  ) {

    $("#toDate").onchange =
      () => {

        expenseCurrentPage = 1;

        report();

      };

  }


  if (
    $("#monthPick")
  ) {

    $("#monthPick").onchange =
      idle;

  }


  /* ===================================================
     INITIAL LOAD
  =================================================== */

  jobs();

  report();

}
