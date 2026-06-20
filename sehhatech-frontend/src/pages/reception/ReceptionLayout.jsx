import { useState } from "react";
import { Outlet } from "react-router-dom";
import ReceptionSidebar from "../../components/ReceptionSidebar";

export default function ReceptionLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-[#f8f9ff]">
      <ReceptionSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="w-full lg:ml-[260px] flex-1 min-w-0">
        <Outlet context={{ openSidebar: () => setSidebarOpen(true) }} />
      </main>
    </div>
  );
}