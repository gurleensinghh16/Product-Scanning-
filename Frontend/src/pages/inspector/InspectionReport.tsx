import { Download, FileText } from "lucide-react";
import Sidebar from "../../components/Sidebar";

function InspectionReport() {

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <div className="page-header report-header">

          <div>

            <p className="eyebrow">
              INSPECTION REPORT
            </p>

            <h1>
              Product Inspection Report
            </h1>

          </div>

          <button className="primary-btn">
            <Download size={18} />
            Download Report
          </button>

        </div>

        <div className="report-card">

          <div className="report-title">

            <FileText size={32} />

            <div>
              <h2>
                NIRIKSHAK AI
              </h2>

              <p>
                Legal Metrology Compliance Inspection Report
              </p>
            </div>

          </div>

          <div className="report-details">

            <div>
              <span>Inspection ID</span>
              <strong>INS-2026-0248</strong>
            </div>

            <div>
              <span>Date</span>
              <strong>05 September 2026</strong>
            </div>

            <div>
              <span>Inspector</span>
              <strong>Authorized Inspector</strong>
            </div>

          </div>

          <hr />

          <h3>
            Product Information
          </h3>

          <div className="report-grid">

            <p>
              <span>Product</span>
              Wheat Flour
            </p>

            <p>
              <span>Net Quantity</span>
              1 kg
            </p>

            <p>
              <span>MRP</span>
              ₹58
            </p>

            <p>
              <span>Category</span>
              Packaged Commodity
            </p>

          </div>

          <h3>
            Compliance Summary
          </h3>

          <div className="report-status">
            Requires Manual Review
          </div>

          <p className="report-note">
            This report is an AI-assisted inspection record.
            Final regulatory determination remains with the
            authorized Legal Metrology authority.
          </p>

        </div>

      </main>

    </div>
  );
}

export default InspectionReport;