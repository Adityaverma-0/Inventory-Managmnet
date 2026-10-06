import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './features/auth/AuthContext';
import Login from './features/auth/Login';
import ApprovalDashboard from './features/admin/ApprovalDashboard';
import AuditLog from './features/admin/AuditLog';
import GodownsPage from './features/admin/GodownsPage';
import VehiclesPage from './features/admin/VehiclesPage';
import ProductsPage from './features/admin/ProductsPage';
import SalesmenPage from './features/admin/SalesmenPage';
import { Link } from 'react-router-dom';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminLayout({ children }: { children: React.ReactNode }) {
  const { logout, user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold dark:text-white">Admin Panel</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm dark:text-gray-300">Welcome, {user?.username}</span>
          <button onClick={logout} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded hover:bg-red-200">Logout</button>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm border-r dark:border-gray-700">
          <nav className="p-4 space-y-2">
            <Link to="/" className="block px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Approvals</Link>
            <Link to="/audit" className="block px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Audit Log</Link>
            <Link to="/godowns" className="block px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Godowns</Link>
            <Link to="/vehicles" className="block px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Vehicles</Link>
            <Link to="/products" className="block px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Products</Link>
            <Link to="/salesmen" className="block px-4 py-2 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Salesmen</Link>
          </nav>
        </aside>
        <main className="flex-1 p-6 overflow-auto">
        {children}
      </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<ApprovalDashboard />} />
                  <Route path="/audit" element={<AuditLog />} />
                  <Route path="/godowns" element={<GodownsPage />} />
                  <Route path="/vehicles" element={<VehiclesPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/salesmen" element={<SalesmenPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AdminLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
