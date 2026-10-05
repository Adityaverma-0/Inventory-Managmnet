import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ApprovalDashboard from './features/admin/ApprovalDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ApprovalDashboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
