import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";

import {
  getInspections
} from "../../services/inspectionStorage";

import type { Inspection } from "../../types/inspection";

import { useNavigate } from "react-router-dom";

function InspectionHistory() {

  const navigate = useNavigate();

  const [inspections, setInspections] =
    useState<Inspection[]>([]);

  useEffect(() => {

    setInspections(getInspections());

  }, []);

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
            Showing the latest 10 inspections.
          </p>

        </div>

        {inspections.length === 0 ? (

          <div className="empty-state">

            <h2>
              No inspections yet
            </h2>

            <p>
              Completed inspections will appear here.
            </p>

          </div>

        ) : (

          <div className="history-table">

            <div className="history-row history-heading">

              <span>Image</span>
              <span>ID / Product</span>
              <span>Date</span>
              <span>Score</span>
              <span>Status</span>

            </div>

            {inspections.map(
              (inspection) => (

                <button
                  className="history-row history-clickable"
                  key={inspection.id}
                  onClick={() =>
                    navigate(
                      `/inspector/inspection/${inspection.id}`
                    )
                  }
                >

                  <div className="history-thumbnail">

                    {inspection.images[0] && (

                      <img
                        src={inspection.images[0]}
                        alt={inspection.productName}
                      />

                    )}

                  </div>

                  <div className="history-product">

                    <strong>
                      {inspection.productName}
                    </strong>

                    <small>
                      {inspection.id} • {inspection.brand}
                    </small>

                  </div>

                  <span>
                    {inspection.date}
                  </span>

                  <span>
                    {inspection.score}%
                  </span>

                  <StatusBadge
                    status={inspection.status}
                  />

                </button>

              )
            )}

          </div>

        )}

      </main>

    </div>
  );
}

export default InspectionHistory;