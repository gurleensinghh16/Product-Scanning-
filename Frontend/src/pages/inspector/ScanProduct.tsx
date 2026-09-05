import { useState } from "react";
import {
  ScanLine,
  Upload,
  Camera,
  ArrowRight
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

function ScanProduct() {

  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (file) {
      setFileName(file.name);
    }
  };

  const startAnalysis = () => {
    navigate("/inspector/analysis");
  };

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <div className="page-header">

          <p className="eyebrow">
            NEW INSPECTION
          </p>

          <h1>
            Scan Product
          </h1>

          <p>
            Upload or capture a clear image of the packaged commodity label.
          </p>

        </div>

        <div className="scan-page">

          <div className="upload-card">

            <div className="scan-icon">
              <ScanLine size={42} />
            </div>

            <h2>
              Upload Product Image
            </h2>

            <p>
              Upload a product image containing the package
              declarations and label information.
            </p>

            <label className="upload-area">

              <Upload size={32} />

              <strong>
                {fileName || "Choose an image"}
              </strong>

              <span>
                JPG, JPEG or PNG
              </span>

              <input
                type="file"
                accept="image/*"
                onChange={handleFile}
              />

            </label>

            <div className="or">
              OR
            </div>

            <button className="camera-btn">
              <Camera size={20} />
              Use Camera
            </button>

            {fileName && (

              <button
                className="primary-btn analyze-btn"
                onClick={startAnalysis}
              >
                Analyze Product
                <ArrowRight size={18} />
              </button>

            )}

          </div>

          <div className="scan-instructions">

            <h3>For better detection</h3>

            <ul>
              <li>Capture the complete package label.</li>
              <li>Keep the image clear and well-lit.</li>
              <li>Avoid glare or heavy reflections.</li>
              <li>Ensure MRP and quantity declarations are visible.</li>
              <li>Capture multiple sides if required.</li>
            </ul>

          </div>

        </div>

      </main>

    </div>
  );
}

export default ScanProduct;