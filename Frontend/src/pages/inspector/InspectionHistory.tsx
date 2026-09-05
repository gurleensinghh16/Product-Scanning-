import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";
import type { Inspection } from "../../types/inspection";

function InspectionHistory() {

  const inspections: Inspection[] = [
    {
      id: "INS-0248",
      productName: "Wheat Flour",
      brand: "Sample Brand",
      date: "05 Sep 2026",
      status: "Review",
      score: 82
    },
    {
      id: "INS-0247",
      productName: "Biscuits",
      brand: "Sample Foods",
      date: "04 Sep 2026",
      status: "Violation",
      score: 61
    },
    {
      id: "INS-0246",
      productName: "Cooking Oil",
      brand: "Sample Oils",
      date: "03 Sep 2026",
      status: "Compliant",
      score: 96
    }
  ];

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <div className="page-header">

          <p className="eyebrow">
            RECORDS
          </p>

          <h1>
            Inspection History
          </h1>

          <p>
            View previous product inspections and compliance results.
          </p>

        </div>

        <div className="history-table">

          <div className="history-row history-heading">

            <span>ID</span>
            <span>Product</span>
            <span>Date</span>
            <span>Score</span>
            <span>Status</span>

          </div>

          {inspections.map((inspection) => (

            <div
              className="history-row"
              key={inspection.id}
            >

              <span>{inspection.id}</span>

              <div>
                <strong>{inspection.productName}</strong>
                <small>{inspection.brand}</small>
              </div>

              <span>{inspection.date}</span>

              <span>
                {inspection.score}%
              </span>

              <StatusBadge status={inspection.status} />

            </div>

          ))}

        </div>

      </main>

    </div>
  );
}

export default InspectionHistory;