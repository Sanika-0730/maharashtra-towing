/* =====================================================
   MAHARASHTRA TOWING SERVICE
   FINAL APP.JS
   MAINTENANCE DETAILS FIXED
===================================================== */

const GOOGLE_SHEET_API =
"https://script.google.com/macros/s/AKfycbzk39uUOIYynCJcrwqNlkTzlpsTeottcUhQooeh5hitSVc3box_9MWfT2o8J6Wkx3Bv/exec";


/* =====================================================
   COMMON FUNCTIONS
===================================================== */

const $ = s => document.querySelector(s);

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
  new Date(`${date}T00:00:00`)
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });


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
    ).catch(error => {

      console.error(
        "Google Sheets error:",
        error
      );

    });

  } catch (error) {

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
  Number(account?.toll || 0);


const getRepair = account =>
  Number(
    account?.repair ??
    account?.repairing ??
    0
  );


/*
   TOTAL MAINTENANCE

   Toll + Repair
*/

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


/*
   SELECTED DATE PROFIT

   Charges
   - Diesel
   - Toll

   IMPORTANT:
   Repairing NOT deducted.
*/

const correctProfit = account => {

  const charges =
    Number(account?.charges || 0);

  const diesel =
    Number(account?.diesel || 0);

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


  if ($("#date")) {

    $("#date").value =
      today;

  }


  /* ===================================================
     RENDER VEHICLES
  =================================================== */

  const render = () => {

    const dateSearch =
      $("#dateSearch")?.value || "";


    const vehicleSearch =
      $("#vehicleSearch")
        ?.value
        .trim()
        .toLowerCase() || "";


    const list =
      records

        .filter(record =>

          (!dateSearch ||
            record.date === dateSearch)

          &&

          (!vehicleSearch ||

            String(
              record.vehicle || ""
            )
              .toLowerCase()
              .includes(
                vehicleSearch
              )

          )

        )

        .sort(
          (a, b) =>
            b.date.localeCompare(a.date)
        );


    if (!$("#recordsBody")) {

      return;

    }


    $("#recordsBody").innerHTML =

      list.length

        ?

        list
          .map(record => `

            <tr>

              <td>
                ${fmt(record.date)}
              </td>

              <td>
                <b>
                  ${esc(record.vehicle)}
                </b>
              </td>

              <td>
                ${esc(record.contact)}
              </td>

              <td>
                ${esc(record.pickup)}
              </td>

              <td>
                ${esc(record.drop)}
              </td>

              <td>
                ${money(record.charges)}
              </td>

              <td>

                <button
                  class="delete"
                  data-id="${record.id}"
                >
                  Delete
                </button>

              </td>

            </tr>

          `)
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

  };


  /* ===================================================
     SAVE VEHICLE
  =================================================== */

  $("#recordForm").onsubmit =
    event => {

      event.preventDefault();


      const form =
        new FormData(event.target);


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

        contact:
          String(
            form.get("contact") || ""
          )
            .trim(),

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


      $("#date").value =
        today;


      render();


      $("#recordMessage")
        .textContent =
          "✓ Vehicle record saved.";


      sendToGoogleSheets(
        vehicleData
      );


      setTimeout(() => {

        $("#recordMessage")
          .textContent = "";

      }, 2500);

    };


  /* ===================================================
     SEARCH
  =================================================== */

  $("#dateSearch").onchange =
    render;

  $("#vehicleSearch").oninput =
    render;


  /* ===================================================
     CLEAR SEARCH
  =================================================== */

  $("#clearSearch").onclick =
    () => {

      $("#dateSearch").value =
        "";

      $("#vehicleSearch").value =
        "";

      render();

    };


  /* ===================================================
     DELETE VEHICLE
  =================================================== */

  $("#recordsBody").onclick =
    event => {

      if (
        !event.target.matches(".delete")
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
     DEFAULT DATES
  =================================================== */

  $("#accountDate").value =
    today;


  const currentYear =
    new Date().getFullYear();


  $("#fromDate").value =
    `${currentYear}-01-01`;


  $("#toDate").value =
    today;


  $("#monthPick").value =
    today.slice(0, 7);


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
        charges: 0,
        diesel: 0,
        toll: 0,
        repair: 0,
        maintenance: 0,
        profit: 0
      }

    );

  };


  /* ===================================================
     DAILY VEHICLE JOBS
  =================================================== */

  const jobs = () => {

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
            account =>
              [
                account.recordId,
                account
              ]
          )

      );


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
                      ${esc(record.vehicle)}
                    </b>

                    <small>
                      ${esc(record.pickup)}
                      →
                      ${esc(record.drop)}
                    </small>

                  </div>


                  <div class="charge">

                    Charges

                    <br>

                    <b>
                      ${money(record.charges)}
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

            <br><br>

            Add it first from Vehicle Records.

          </div>

        `;


    live();

  };


  /* ===================================================
     LIVE DAILY PROFIT
  =================================================== */

  const live = () => {

    const current =

      [
        ...document.querySelectorAll(".job")
      ]

        .map(job => {

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
              job.querySelector(".diesel")
                ?.value || 0
            );


          const toll =
            Number(
              job.querySelector(".toll")
                ?.value || 0
            );


          const repair =
            Number(
              job.querySelector(".repair")
                ?.value || 0
            );


          /*
             SELECTED DATE PROFIT

             Charges
             - Diesel
             - Toll

             Repair NOT deducted.
          */

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

        });


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
          charges: 0,
          diesel: 0,
          toll: 0,
          repair: 0,
          maintenance: 0,
          profit: 0
        }

      );


    $("#dailyProfitLabel").innerHTML = `

      Profit for selected date

      <b>
        ${money(total.profit)}
      </b>

    `;

  };


  /* ===================================================
     SAVE DAILY ACCOUNTS
  =================================================== */

  $("#saveAccounts").onclick =
    () => {

      const date =
        $("#accountDate").value;


      const jobElements =
        [
          ...document.querySelectorAll(".job")
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

          .map(job => {

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
                job.querySelector(".diesel")
                  ?.value || 0
              );


            const toll =
              Number(
                job.querySelector(".toll")
                  ?.value || 0
              );


            const repair =
              Number(
                job.querySelector(".repair")
                  ?.value || 0
              );


            const details =
              job.querySelector(".details")
                ?.value
                .trim() || "";


            /*
               SELECTED DATE PROFIT

               Charges
               - Diesel
               - Toll

               Repair NOT deducted.
            */

            const profit =
              Number(
                record.charges || 0
              ) -
              diesel -
              toll;


            /*
               MAINTENANCE

               Toll + Repair
            */

            const maintenance =
              toll + repair;


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

          })

          .filter(Boolean);


      /* =================================================
         LOCAL SAVE
      ================================================= */

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


      /* =================================================
         GOOGLE SHEETS
      ================================================= */

      newRows.forEach(row => {

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

      });


      jobs();

      report();


      setTimeout(() => {

        $("#accountMessage")
          .textContent = "";

      }, 2500);

    };


  /* ===================================================
     REPORT
  =================================================== */

  const report = () => {

    const from =
      $("#fromDate").value;


    const to =
      $("#toDate").value;


    accounts =
      get("mts-final-accounts");


    const filtered =
      accounts.filter(
        account =>

          (!from ||
            account.date >= from)

          &&

          (!to ||
            account.date <= to)

      );


    const totals =
      sum(filtered);


    $("#totalCharges").textContent =
      money(
        totals.charges
      );


    $("#totalDiesel").textContent =
      money(
        totals.diesel
      );


    $("#totalMaintenance").textContent =
      money(
        totals.maintenance
      );


    /*
       PERIOD PROFIT

       Total Charges
       - Total Diesel
       - Total Maintenance

       Maintenance =
       Toll + Repair
    */

    $("#totalProfit").textContent =
      money(
        totals.charges -
        totals.diesel -
        totals.maintenance
      );


    /* =================================================
       MONTHLY PERFORMANCE
    ================================================= */

    const groups = {};


    accounts.forEach(account => {

      const month =
        String(
          account.date || ""
        )
          .slice(0, 7);


      if (!month) {

        return;

      }


      if (!groups[month]) {

        groups[month] = [];

      }


      groups[month].push(
        account
      );

    });


    const monthlyRows =

      Object.entries(groups)

        .sort(
          (a, b) =>
            b[0].localeCompare(a[0])
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
                  ${money(profit)}
                </td>

              </tr>

            `;

          }
        )
        .join("");


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


    /* =================================================
       EXPENSE HISTORY
       
       IMPORTANT:
       Maintenance Total REMOVED.

       New columns:

       Date
       Vehicle
       Route
       Charges
       Diesel
       Toll
       Repairing
       Maintenance Details
       Profit
       Action
    ================================================= */

    const expenseRows =

      accounts

        .slice()

        .sort(
          (a, b) =>
            b.date.localeCompare(
              a.date
            )
        )

        .map(
          account => {

            const toll =
              getToll(account);


            const repair =
              getRepair(account);


            /*
               PERIOD PROFIT

               Charges
               - Diesel
               - Total Maintenance

               Total Maintenance =
               Toll + Repair
            */

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


                <!-- REPAIRING -->

                <td>
                  ${money(
                    repair
                  )}
                </td>


                <!-- MAINTENANCE DETAILS -->

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
                      ? "color:#dc1d2f;font-weight:800;"
                      : "color:#109b66;font-weight:700;"
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
                  >
                    Edit
                  </button>

                  <button
                    class="delete-account"
                    data-id="${account.id}"
                  >
                    Delete
                  </button>

                </td>

              </tr>

            `;

          }

        )

        .join("");


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


    idle();

  };


  /* ===================================================
     EDIT / DELETE ACCOUNT
  =================================================== */

  $("#expensesBody").onclick =
    event => {


      /* -----------------------------------------------
         DELETE
      ------------------------------------------------ */

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


      /* -----------------------------------------------
         EDIT
      ------------------------------------------------ */

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


        setTimeout(() => {

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


          setTimeout(() => {

            job.style.outline =
              "";

          }, 2500);


          $("#accountMessage")
            .textContent =
              "✎ Edit the values above and click Save Today's Entries.";

        }, 100);

      }

    };


  /* ===================================================
     NO TOWING DAYS
  =================================================== */

  const idle = () => {

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


    $("#idleIntro").textContent =

      days.length

        ?

        `${days.length} day(s) with no towing job in ${monthName}.`

        :

        "Great work — every day has at least one towing job.";


    $("#idleDays").innerHTML =

      days

        .map(
          day => `

            <span class="idle-day">

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

  };


  /* ===================================================
     EVENT LISTENERS
  =================================================== */

  $("#accountDate").onchange =
    jobs;


  $("#jobsList").oninput =
    live;


  $("#calculate").onclick =
    report;


  $("#fromDate").onchange =
    report;


  $("#toDate").onchange =
    report;


  $("#monthPick").onchange =
    idle;


  /* ===================================================
     INITIAL LOAD
  =================================================== */

  jobs();

  report();

}
