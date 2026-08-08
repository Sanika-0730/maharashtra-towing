const GOOGLE_SHEET_API = "https://script.google.com/macros/s/AKfycbyL3EnY4Gy0PyiD7THtKztE5M-Ay6kysDHgcq7xE-7GdlIf779x3r4juYpE57QlT40m/exec";
/* =====================================================
   COMMON FUNCTIONS
===================================================== */

const $ = s => document.querySelector(s);

const today = new Date()
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
  String(value || "").replace(
    /[&<>"']/g,
    character => ({
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

/*
   Google Apps Script ला data पाठवतो.

   text/plain वापरल्यामुळे browser कडून
   unnecessary CORS preflight टाळण्यास मदत होते.
*/

const sendToGoogleSheets = data => {

  return fetch(
    GOOGLE_SHEET_API,
    {
      method: "POST",

      mode: "no-cors",

      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },

      body: JSON.stringify(data)
    }
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


  /*
     Default date
  */

  $("#date").value = today;



  /* -----------------------------------------------
     RENDER VEHICLE RECORDS
  ------------------------------------------------ */

  const render = () => {

    const dateSearch =
      $("#dateSearch").value;


    const vehicleSearch =
      $("#vehicleSearch")
        .value
        .trim()
        .toLowerCase();


    const list =
      records

        .filter(record =>
          (!dateSearch ||
            record.date === dateSearch) &&

          (!vehicleSearch ||
            record.vehicle
              .toLowerCase()
              .includes(vehicleSearch))
        )

        .sort(
          (a, b) =>
            b.date.localeCompare(a.date)
        );


    $("#recordsBody").innerHTML =
      list.length

        ? list
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

        : `
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



  /* -----------------------------------------------
     SAVE VEHICLE RECORD
  ------------------------------------------------ */

  $("#recordForm").onsubmit =
    async event => {

      event.preventDefault();


      const form =
        new FormData(event.target);


      const vehicleData = {

        type: "vehicle",

        date:
          form.get("date"),

        vehicle:
          form
            .get("vehicle")
            .trim()
            .toUpperCase(),

        contact:
          form
            .get("contact")
            .trim(),

        pickup:
          form
            .get("pickup")
            .trim(),

        drop:
          form
            .get("drop")
            .trim(),

        charges:
          Number(
            form.get("charges") || 0
          )

      };


      /*
         Local record
      */

      const localRecord = {

        id:
          crypto.randomUUID(),

        date:
          vehicleData.date,

        vehicle:
          vehicleData.vehicle,

        contact:
          vehicleData.contact,

        pickup:
          vehicleData.pickup,

        drop:
          vehicleData.drop,

        charges:
          vehicleData.charges

      };


      records.push(localRecord);


      put(
        "mts-final-records",
        records
      );


      /*
         Google Sheets
      */

      try {

        await sendToGoogleSheets(
          vehicleData
        );


        $("#recordMessage").textContent =
          "✓ Vehicle record saved to Google Sheets.";

      }

      catch (error) {

        console.error(
          "Google Sheets error:",
          error
        );


        $("#recordMessage").textContent =
          "✓ Saved locally. Google Sheets connection failed.";

      }


      /*
         Reset form
      */

      event.target.reset();

      $("#date").value = today;


      setTimeout(() => {

        $("#recordMessage").textContent = "";

      }, 3000);


      render();

    };



  /* -----------------------------------------------
     SEARCH
  ------------------------------------------------ */

  $("#dateSearch").onchange =
    render;


  $("#vehicleSearch").oninput =
    render;



  /* -----------------------------------------------
     CLEAR SEARCH
  ------------------------------------------------ */

  $("#clearSearch").onclick =
    () => {

      $("#dateSearch").value = "";

      $("#vehicleSearch").value = "";

      render();

    };



  /* -----------------------------------------------
     DELETE RECORD
  ------------------------------------------------ */

  $("#recordsBody").onclick =
    event => {

      if (
        event.target.matches(".delete")
      ) {

        const id =
          event.target.dataset.id;


        if (
          confirm(
            "Delete this vehicle record?"
          )
        ) {

          records =
            records.filter(
              record =>
                record.id !== id
            );


          put(
            "mts-final-records",
            records
          );


          render();

        }

      }

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


  /*
     Default dates
  */

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
     SUM FUNCTION
  =================================================== */

  const sum = list => {

    return list.reduce(
      (total, item) => {

        total.charges +=
          Number(item.charges || 0);

        total.diesel +=
          Number(item.diesel || 0);

        total.maintenance +=
          Number(item.maintenance || 0);

        total.profit +=
          Number(item.profit || 0);

        return total;

      },
      {
        charges: 0,
        diesel: 0,
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


    /*
       Existing account entries for selected date
    */

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

        ? list
            .map(
              (record, index) => {

                const account =
                  old[record.id] || {};


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
                        value="${account.diesel || ""}"
                        placeholder="0"
                      >

                    </label>


                    <label>

                      Maintenance (₹) &amp; details

                      <input
                        class="maintenance"
                        type="number"
                        min="0"
                        step="1"
                        value="${account.maintenance || ""}"
                        placeholder="Amount"
                      >

                      <textarea
                        class="details"
                        placeholder="e.g. Tyre repair"
                      >${esc(account.details || "")}</textarea>

                    </label>

                  </article>

                `;

              }
            )
            .join("")

        : `

          <div
            class="empty"
            style="padding:25px;"
          >
            No towing vehicle record exists
            for this date.
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
              item.id === job.dataset.id
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


        const maintenance =
          Number(
            job.querySelector(".maintenance")
              ?.value || 0
          );


        const profit =
          charges -
          diesel -
          maintenance;


        return {

          charges,
          diesel,
          maintenance,
          profit

        };

      });


    const total =
      sum(current);


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
    async () => {

      const date =
        $("#accountDate").value;


      const jobElements =
        [
          ...document.querySelectorAll(".job")
        ];


      if (!jobElements.length) {

        $("#accountMessage").textContent =
          "⚠️ No vehicle records for this date.";

        return;

      }



      const newRows =
        jobElements.map(job => {

          const record =
            records.find(
              item =>
                item.id === job.dataset.id
            );


          const diesel =
            Number(
              job.querySelector(".diesel")
                ?.value || 0
            );


          const maintenance =
            Number(
              job.querySelector(".maintenance")
                ?.value || 0
            );


          const details =
            job.querySelector(".details")
              ?.value
              .trim() || "";


          const profit =
            Number(record?.charges || 0) -
            diesel -
            maintenance;


          return {

            id:
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
              Number(record.charges || 0),

            diesel,

            maintenance,

            details,

            profit

          };

        });



      /*
         Save locally
      */

      accounts =
        accounts
          .filter(
            account =>
              account.date !== date
          )
          .concat(newRows);


      put(
        "mts-final-accounts",
        accounts
      );



      /*
         Send every account row to Google Sheets
      */

      try {

        for (
          const row of newRows
        ) {

          await sendToGoogleSheets({

            type: "account",

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

            maintenance:
              row.maintenance,

            details:
              row.details,

            profit:
              row.profit

          });

        }


        $("#accountMessage").textContent =
          "✓ Daily entries saved to Google Sheets.";

      }

      catch (error) {

        console.error(
          "Google Sheets error:",
          error
        );


        $("#accountMessage").textContent =
          "✓ Saved locally. Google Sheets connection failed.";

      }



      setTimeout(() => {

        $("#accountMessage").textContent = "";

      }, 3000);


      jobs();

      report();

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
            account.date >= from) &&

          (!to ||
            account.date <= to)
      );


    const totals =
      sum(filtered);


    $("#totalCharges").textContent =
      money(totals.charges);


    $("#totalDiesel").textContent =
      money(totals.diesel);


    $("#totalMaintenance").textContent =
      money(totals.maintenance);


    $("#totalProfit").textContent =
      money(totals.profit);



    /* -----------------------------------------------
       MONTHLY PERFORMANCE
    ------------------------------------------------ */

    const groups = {};


    accounts.forEach(account => {

      const month =
        account.date.slice(0, 7);


      if (!groups[month]) {
        groups[month] = [];
      }


      groups[month].push(account);

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
                  month: "long",
                  year: "numeric"
                }
              );


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
                  ${money(total.charges)}
                </td>

                <td>
                  ${money(total.diesel)}
                </td>

                <td>
                  ${money(total.maintenance)}
                </td>

                <td class="good">
                  ${money(total.profit)}
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



    /* -----------------------------------------------
       EXPENSE HISTORY
    ------------------------------------------------ */

    const expenseRows =
      accounts

        .slice()

        .sort(
          (a, b) =>
            b.date.localeCompare(a.date)
        )

        .map(
          account => `

            <tr>

              <td>
                ${fmt(account.date)}
              </td>

              <td>
                <b>
                  ${esc(account.vehicle)}
                </b>
              </td>

              <td>
                ${esc(account.pickup)}
                →
                ${esc(account.drop)}
              </td>

              <td>
                ${money(account.charges)}
              </td>

              <td>
                ${money(account.diesel)}
              </td>

              <td>
                ${money(account.maintenance)}
              </td>

              <td>
                ${esc(account.details || "—")}
              </td>

              <td class="good">
                ${money(account.profit)}
              </td>

            </tr>

          `
        )
        .join("");


    $("#expensesBody").innerHTML =
      expenseRows ||

      `

        <tr>

          <td
            colspan="8"
            class="empty"
          >
            No expense entries yet.
          </td>

        </tr>

      `;



    idle();

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
      ).getDate();


    const currentMonth =
      today.slice(0, 7);


    const lastDayToShow =
      currentMonth === month

        ? Number(
            today.slice(8, 10)
          )

        : lastDay;


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
          month: "long",
          year: "numeric"
        }
      );


    $("#idleIntro").textContent =

      days.length

        ? `${days.length} day(s) with no towing job in ${monthName}.`

        : "Great work — every day has at least one towing job.";



    $("#idleDays").innerHTML =

      days

        .map(
          day => `

            <span class="idle-day">

              ${day}
              ${new Date(
                `${month}-01T00:00:00`
              ).toLocaleString(
                "en-IN",
                {
                  month: "short"
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


  $("#monthPick").onchange =
    idle;



  /* ===================================================
     INITIAL LOAD
  =================================================== */

  jobs();

  report();

}