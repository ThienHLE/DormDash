function ReportsDisputes() {
  return (
    <div className="space-y-8">

      <div>
        <h2 className="text-2xl font-bold text-ink">
          Reports & Disputes
        </h2>

        <p className="mt-2 text-muted">
          Review delivery reports and resolve disputes.
        </p>
      </div>


      <div className="flex flex-col gap-3 sm:flex-row">

        <select
          disabled
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option>All Statuses</option>
        </select>


        <select
          disabled
          className="rounded-lg border border-border bg-surface px-4 py-2 text-sm text-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option>Newest First</option>
        </select>

      </div>


      <div className="rounded-2xl border border-border bg-surface shadow-sm">

        <div className="border-b border-border px-6 py-4">
          <h3 className="text-lg font-semibold text-ink">
            Reports
          </h3>

          <p className="text-sm text-muted">
            Delivery reports and disputes will appear here.
          </p>
        </div>


        <div className="px-6 py-16 text-center">

          <p className="text-lg font-semibold text-ink">
            No reports available
          </p>

          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Reports and disputes will appear here once the backend
            reporting system is available.
          </p>

        </div>

      </div>

    </div>
  );
}


export default ReportsDisputes;