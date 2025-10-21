import { Outlet } from "react-router-dom";
import { Navbar } from "../components/Navbar";

export const MainLayout = () => {
  return (
    <div className="min-h screen bg-background">
      <Navbar />
      <main className="container max-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};
