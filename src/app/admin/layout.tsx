import { Sidebar } from "@/components/Sidebar";
import { Navbar } from "@/components/Navbar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen bg-[#060911] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Background ambient lighting */}
      <div className="pointer-events-none fixed -top-40 right-1/4 h-[500px] w-[600px] rounded-full bg-indigo-600/10 blur-[140px]" />
      <div className="pointer-events-none fixed bottom-10 left-1/3 h-[400px] w-[500px] rounded-full bg-cyan-600/10 blur-[140px]" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Container */}
      <div className="relative flex flex-1 flex-col pl-64">
        <Navbar />
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
