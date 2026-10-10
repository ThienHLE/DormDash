import { useState } from "react";


function TipChart({ deliveries }) {
  const [range, setRange] = useState("7");


  function getDayKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }


  function getMonthKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");

    return `${year}-${month}`;
  }


  function buildDailyData(days) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const data = [];


    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);

      date.setDate(today.getDate() - i);

      const dayKey = getDayKey(date);


      const total = deliveries
        .filter((delivery) => {
          if (!delivery.updatedAt) {
            return false;
          }

          const deliveryDate = new Date(delivery.updatedAt);

          return getDayKey(deliveryDate) === dayKey;
        })
        .reduce(
          (sum, delivery) => sum + delivery.tip,
          0
        );


      let label;

      if (days === 7) {
        label = date.toLocaleDateString(
          undefined,
          {
            weekday: "short"
          }
        );

      } else {
        label = date.toLocaleDateString(
          undefined,
          {
            month: "numeric",
            day: "numeric"
          }
        );
      }


      data.push({
        key: dayKey,
        label,
        total
      });
    }


    return data;
  }


  function buildAllTimeData() {
    const months = {};


    deliveries.forEach((delivery) => {
      if (!delivery.updatedAt) {
        return;
      }

      const date = new Date(delivery.updatedAt);
      const monthKey = getMonthKey(date);


      if (!months[monthKey]) {
        months[monthKey] = {
          date,
          total: 0
        };
      }


      months[monthKey].total += delivery.tip;
    });


    return Object.entries(months)
      .sort(([first], [second]) =>
        first.localeCompare(second)
      )
      .map(([key, month]) => ({
        key,

        label: month.date.toLocaleDateString(
          undefined,
          {
            month: "short",
            year: "2-digit"
          }
        ),

        total: month.total
      }));
  }


  let chartData = [];


  if (range === "7") {
    chartData = buildDailyData(7);
  }


  if (range === "30") {
    chartData = buildDailyData(30);
  }


  if (range === "all") {
    chartData = buildAllTimeData();
  }


  const maxTip = Math.max(
    ...chartData.map((item) => item.total),
    0
  );


  const rangeTotal = chartData.reduce(
    (sum, item) => sum + item.total,
    0
  );


  const chartWidth =
    chartData.length > 14
      ? `${chartData.length * 38}px`
      : "100%";


  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">


      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h3 className="text-xl font-semibold text-ink">
            Tips Earned
          </h3>

          <p className="mt-1 text-sm text-muted">
            Track tips from completed deliveries over time.
          </p>

        </div>


        <div className="text-left sm:text-right">

          <p className="text-sm text-muted">
            Selected period
          </p>

          <p className="text-xl font-bold text-ink">
            ${(rangeTotal / 100).toFixed(2)}
          </p>

        </div>

      </div>



      <div className="mt-5 flex gap-2">

        <button
          type="button"
          onClick={() => setRange("7")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
            range === "7"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-ink hover:bg-gray-50"
          }`}
        >
          7 Days
        </button>


        <button
          type="button"
          onClick={() => setRange("30")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
            range === "30"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-ink hover:bg-gray-50"
          }`}
        >
          30 Days
        </button>


        <button
          type="button"
          onClick={() => setRange("all")}
          className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold ${
            range === "all"
              ? "bg-primary text-white"
              : "border border-border bg-surface text-ink hover:bg-gray-50"
          }`}
        >
          All Time
        </button>

      </div>



      {chartData.length === 0 ? (

        <div className="py-14 text-center">

          <p className="text-lg font-semibold text-ink">
            No tip data yet
          </p>

          <p className="mt-2 text-sm text-muted">
            Tips from completed deliveries will appear here.
          </p>

        </div>

      ) : (

        <div className="mt-8 flex gap-4">


          {/* Y Axis */}
          <div className="flex h-52 flex-col justify-between pb-6 text-right text-xs text-muted">

            <span>
              ${(maxTip / 100).toFixed(2)}
            </span>

            <span>
              ${(maxTip / 200).toFixed(2)}
            </span>

            <span>
              $0.00
            </span>

          </div>



          {/* Chart */}
          <div className="min-w-0 flex-1 overflow-x-auto">

            <div
              style={{
                minWidth: chartWidth
              }}
            >

              <div className="flex h-52 items-end border-b border-border">

                {chartData.map((item) => {

                  let height = 0;


                  if (maxTip > 0) {
                    height =
                      (item.total / maxTip) * 160;
                  }


                  if (item.total > 0 && height < 8) {
                    height = 8;
                  }


                  return (
                    <div
                      key={item.key}
                      className="flex h-full flex-1 flex-col items-center justify-end px-1"
                    >

                      {item.total > 0 && (

                        <span className="mb-2 text-xs font-semibold text-ink">
                          ${(item.total / 100).toFixed(2)}
                        </span>

                      )}


                      <div
                        title={`$${(item.total / 100).toFixed(2)}`}
                        className="w-full max-w-8 rounded-t-md bg-primary transition-all"
                        style={{
                          height: `${height}px`
                        }}
                      />

                    </div>
                  );
                })}

              </div>



              {/* X Axis */}
              <div className="flex">

                {chartData.map((item) => (

                  <div
                    key={item.key}
                    className="flex-1 px-1 pt-2 text-center text-xs text-muted"
                  >
                    {item.label}
                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}


export default TipChart;