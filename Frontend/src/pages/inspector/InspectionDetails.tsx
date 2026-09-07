import { useEffect, useState } from "react";
import { ArrowLeft, Download, FileText } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import StatusBadge from "../../components/StatusBadge";

import {
  getInspectionById
} from "../../services/inspectionStorage";

import type { Inspection } from "../../types/inspection";

function InspectionDetails() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [inspection, setInspection] =
    useState<Inspection | undefined>();

  useEffect(() => {

    if (id) {
      const data = getInspectionById(id);
      setInspection(data);
    }

  }, [id]);

  if (!inspection) {

    return (
      <div className="dashboard-layout">

        <Sidebar />

        <main className="dashboard">

          <h1>Inspection Not Found</h1>

          <button
            className="secondary-btn"
            onClick={() => navigate("/inspector/history")}
          >
            <ArrowLeft size={18} />
            Back to History
          </button>

        </main>

      </div>
    );
  }

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <button
          className="back-button"
          onClick={() => navigate("/inspector/history")}
        >
          <ArrowLeft size={18} />
          Back to Inspection History
        </button>

        <div className="page-header">

          <p className="eyebrow">
            INSPECTION DETAILS
          </p>

          <h1>
            {inspection.productName}
          </h1>

          <p>
            Inspection ID: {inspection.id}
          </p>

        </div>

        {/* SUMMARY */}

        <section className="detail-card">

          <div className="detail-header">

            <div>

              <h2>
                Inspection Result
              </h2>

              <p>
                {inspection.date}
              </p>

            </div>

            <StatusBadge
              status={inspection.status}
            />

          </div>

          <div className="inspection-summary-grid">

            <div>
              <span>Brand</span>
              <strong>{inspection.brand}</strong>
            </div>

            <div>
              <span>Compliance Score</span>
              <strong>{inspection.score}%</strong>
            </div>

            <div>
              <span>Images Captured</span>
              <strong>{inspection.images.length}</strong>
            </div>

          </div>

        </section>

        {/* ALL IMAGES */}

        <section className="detail-card">

          <div className="section-header">

            <div>

              <h2>
                Inspection Images
              </h2>

              <p>
                All images captured during this inspection.
              </p>

            </div>

          </div>

          <div className="inspection-image-grid">

            {inspection.images.map(
              (image, index) => (

                <div
                  className="inspection-image"
                  key={index}
                >

                  <img
                    src={image}
                    alt={`Inspection image ${index + 1}`}
                  />

                  <span>
                    Image {index + 1}
                  </span>

                </div>

              )
            )}

          </div>

        </section>

        {/* REPORT */}

        <section className="detail-card">

          <div className="section-header">

            <div>

              <h2>
                Inspection Report
              </h2>

              <p>
                Review and edit the inspection report.
              </p>

            </div>

            <button
              className="primary-btn"
              onClick={() =>
                navigate(
                  `/inspector/report/${inspection.id}`
                )
              }
            >
              <FileText size={18} />
              Open Editable Report
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default InspectionDetails;