'use client'

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Admin Dashboard — SEAPEDIA</h1>
        <p className="text-text-sub">Ringkasan marketplace</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {['Users', 'Stores', 'Products', 'Orders', 'Jobs'].map((label) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-text-sub">{label}</p>
            <p className="mt-1 text-xl font-bold text-text">—</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-sm text-text-sub">⚠️ Pesanan Overdue</p>
        <p className="mt-1 text-2xl font-bold text-text">—</p>
      </div>
    </div>
  )
}
