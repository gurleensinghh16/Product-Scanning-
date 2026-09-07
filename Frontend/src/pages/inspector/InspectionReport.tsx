import { useEffect, useState } from "react";
import { ArrowLeft, Download, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import Sidebar from "../../components/Sidebar";

import {
  getInspectionById
} from "../../services/inspectionStorage";

import type { Inspection } from "../../types/inspection";

function InspectionReport() {

  const navigate = useNavigate();
  const { id } = useParams();

  const [inspection, setInspection] =
    useState<Inspection | undefined>();

  const [observations, setObservations] =
    useState("");

  const [recommendations, setRecommendations] =
    useState("");

  useEffect(() => {

    if (id) {

      const data = getInspectionById(id);

      setInspection(data);

      if (data) {
        setObservations(
          data.observations || ""
        );

        setRecommendations(
          data.recommendations || ""
        );
      }

    }

  }, [id]);

  if (!inspection) {

    return (
      <div className="dashboard-layout">

        <Sidebar />

        <main className="dashboard">

          <h1>
            Report Not Found
          </h1>

        </main>

      </div>
    );
  }

  const saveReport = () => {

    const all =
      JSON.parse(
        localStorage.getItem(
          "nirikshak_inspections"
        ) || "[]"
      ) as Inspection[];

    const updated = all.map(
      (item) => {

        if (item.id === inspection.id) {

          return {
            ...item,
            observations,
            recommendations
          };

        }

        return item;

      }
    );

    localStorage.setItem(
      "nirikshak_inspections",
      JSON.stringify(updated)
    );

    alert("Report saved successfully.");

  };

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <button
          className="back-button"
          onClick={() =>
            navigate(
              `/inspector/inspection/${inspection.id}`
            )
          }
        >
          <ArrowLeft size={18} />
          Back to Inspection
        </button>

        <div className="report-editor">

          <div className="report-header">

            <div>

              <p className="eyebrow">
                INSPECTION REPORT
              </p>

              <h1>
                Legal Metrology Inspection Report
              </h1>

              <p>
                Inspection ID: {inspection.id}
              </p>

            </div>

            <div className="report-actions">

              <button
                className="secondary-btn"
                onClick={saveReport}
              >
                <Save size={18} />
                Save Changes
              </button>

              <button
                className="primary-btn"
                onClick={() =>
                  window.print()
                }
              >
                <Download size={18} />
                Export PDF
              </button>

            </div>

          </div>

          {/* PRODUCT INFORMATION */}

          <section className="report-section">

            <h2>
              Product Information
            </h2>

            <div className="report-grid">

              <div>
                <label>Product</label>
                <input
                  value={inspection.productName}
                  readOnly
                />
              </div>

              <div>
                <label>Brand</label>
                <input
                  value={inspection.brand}
                  readOnly
                />
              </div>

              <div>
                <label>Inspection ID</label>
                <input
                  value={inspection.id}
                  readOnly
                />
              </div>

              <div>
                <label>Date</label>
                <input
                  value={inspection.date}
                  readOnly
                />
              </div>

            </div>

          </section>

          {/* RESULT */}

          <section className="report-section">

            <h2>
              Compliance Result
            </h2>

            <div className="report-result">

              <strong>
                {inspection.status}
              </strong>

              <span>
                Compliance Score: {inspection.score}%
              </span>

            </div>

          </section>

          {/* EDITABLE SECTION */}

          <section className="report-section">

            <h2>
              Inspector Observations
            </h2>

            <textarea
              value={observations}
              onChange={(e) =>
                setObservations(e.target.value)
              }
              placeholder="Enter inspection observations..."
              rows={6}
            />

          </section>

          <section className="report-section">

            <h2>
              Recommendations / Action Required
            </h2>

            <textarea
              value={recommendations}
              onChange={(e) =>
                setRecommendations(e.target.value)
              }
              placeholder="Enter recommended action..."
              rows={6}
            />

          </section>

          <div className="report-footer">

            <p>
              This report is an AI-assisted inspection
              record. Final regulatory determination
              remains with the authorized authority.
            </p>

          </div>

        </div>

      </main>

    </div>
  );
}

export default InspectionReport;