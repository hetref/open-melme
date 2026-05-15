import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <main className="flex-1 lg:pl-0">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}