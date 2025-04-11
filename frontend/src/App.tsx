// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import UserFormWithDocs from "@/components/UserFormWithDocs.tsx";
import AdminLogin from "../src/pages/AdminLogin.tsx";
import AdminDashboard from "../src/pages/AdminDashboard.tsx";
import { Toaster } from "@/components/ui/toaster.tsx";
import PrivateRoute from "@/components/PrivateRoute.tsx";

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight text-grey-600">
            Form Submission Portal
          </h1>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto p-4">
        <Routes>
          <Route
            path="/"
            element={
              <div className="min-h-screen bg-gray-50 flex justify-center items-start py-10">
                <div className="w-full max-w-screen-lg">
                  <UserFormWithDocs />
                </div>
              </div>
            }
          />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>

      <footer className="bg-gray-100 text-center py-4 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Form System • All Rights Reserved
      </footer>

      <Toaster />
    </div>
  );
}

export default App;
