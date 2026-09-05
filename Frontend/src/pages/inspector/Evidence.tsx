import { AlertTriangle, CheckCircle2, FileSearch } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";

function Evidence() {

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <div className="page-header">

          <p className="eyebrow">
            INSPECTION RESULT
          </p>

          <h1>
            Compliance Analysis
          </h1>

          <p>
            Review detected declarations and identified compliance issues.
          </p>

        </div>

        <div className="result-summary">

          <div>

            <span className="result-label">
              Overall Status
            </span>

            <h2>
              Requires Review
            </h2>

            <p>
              One declaration requires manual verification.
            </p>

          </div>

          <div className="result-score">
            82%
          </div>

        </div>

        <section className="evidence-section">

          <h2>
            Detected Declarations
          </h2>

          <div className="compliance-table">

            <div className="table-row table-heading">
              <span>Declaration</span>
              <span>Detected</span>
              <span>Status</span>
            </div>

            <div className="table-row">
              <span>Product Name</span>
              <span>Wheat Flour</span>
              <StatusBadge status="Compliant" />
            </div>

            <div className="table-row">
              <span>Net Quantity</span>
              <span>1 kg</span>
              <StatusBadge status="Compliant" />
            </div>

            <div className="table-row">
              <span>MRP</span>
              <span>₹58</span>
              <StatusBadge status="Review" />
            </div>

            <div className="table-row">
              <span>Consumer Care</span>
              <span>Detected</span>
              <StatusBadge status="Compliant" />
            </div>

          </div>

        </section>

        <section className="violation-card">

          <AlertTriangle size={28} />

          <div>

            <h3>
              MRP requires verification
            </h3>

            <p>
              The printed MRP was extracted successfully. The system
              recommends verification against trusted reference data
              before making an enforcement decision.
            </p>

          </div>

        </section>

        <section className="evidence-card">

          <FileSearch size={28} />

          <div>

            <h3>
              Visual Evidence
            </h3>

            <p>
              The relevant label region used for this finding can be
              reviewed by the inspector.
            </p>

          </div>

          <CheckCircle2 size={22} />

        </section>

      </main>

    </div>
  );
}

export default Evidence;