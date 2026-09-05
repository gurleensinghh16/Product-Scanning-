import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";

import InspectorDashboard from "./pages/inspector/InspectorDashboard";
import ScanProduct from "./pages/inspector/ScanProduct";
import Analysis from "./pages/inspector/Analysis";
import Evidence from "./pages/inspector/Evidence";
import InspectionReport from "./pages/inspector/InspectionReport";
import InspectionHistory from "./pages/inspector/InspectionHistory";

import PublicScanner from "./pages/public/PublicScanner";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/public-scan" element={<PublicScanner />} />

        {/* Inspector */}
        <Route path="/inspector" element={<InspectorDashboard />} />
        <Route path="/inspector/scan" element={<ScanProduct />} />
        <Route path="/inspector/analysis" element={<Analysis />} />
        <Route path="/inspector/evidence" element={<Evidence />} />
        <Route path="/inspector/report" element={<InspectionReport />} />
        <Route path="/inspector/history" element={<InspectionHistory />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;