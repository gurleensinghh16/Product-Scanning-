import { useState } from "react";
import { ScanLine, Upload, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";

function PublicScanner() {

  const [file, setFile] = useState("");

  return (
    <div>

      <Navbar />

      <main className="public-scanner">

        <Link to="/" className="back-link">
          <ArrowLeft size={18} />
          Back
        </Link>

        <div className="public-header">

          <ScanLine size={42} />

          <h1>
            Check a Packaged Product
          </h1>

          <p>
            Upload a product label to see the declarations
            detected by NIRIKSHAK AI.
          </p>

        </div>

        <label className="public-upload">

          <Upload size={36} />

          <h3>
            {file || "Upload Product Image"}
          </h3>

          <p>
            JPG, JPEG or PNG
          </p>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const selected = e.target.files?.[0];

              if (selected) {
                setFile(selected.name);
              }
            }}
          />

        </label>

        {file && (

          <button className="primary-btn">
            Analyze Product
          </button>

        )}

        <p className="public-disclaimer">
          This public scanner provides informational results
          and does not constitute an official regulatory determination.
        </p>

      </main>

    </div>
  );
}

export default PublicScanner;