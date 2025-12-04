import { Outlet } from "react-router-dom";
import Sidebar from "../components/CMSSidebar";
import "../styles/CMSLayout.css";

function CMSLayout() {
  return (
    <div className="cms-layout">
      <Sidebar />
      <main className="cms-content">
        <Outlet /> {/* CMS pages */}
      </main>
    </div>
  );
}

export default CMSLayout;
