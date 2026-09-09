import { CheckCircle2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useEffect, useState } from "react";

function Analysis() {
  const [imageQuality, setImageQuality] = useState<any>(null);

  useEffect(() => {
  const storedResult = sessionStorage.getItem("imageQualityResult");

  if (storedResult) {
    setImageQuality(JSON.parse(storedResult));
  }
}, []);

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <div className="page-header">

          <p className="eyebrow">
            AI ANALYSIS
          </p>

          <h1>
  Image Quality Check
</h1>

<p>
  Checking image resolution and brightness before inspection.
</p>

        </div>

        <div className="analysis-card">

  <div className="analysis-icon">
    <CheckCircle2 size={50} />
  </div>

  <h2>
    Image Quality Check Complete
  </h2>

  {imageQuality && (
    <div className="image-quality-results">

      <div className="quality-result">

        <h3>Resolution</h3>

        <p>
          {imageQuality.image.width} × {imageQuality.image.height}
        </p>

        <strong>
          {imageQuality.checks.resolution
            ? "PASS"
            : "NEEDS REVIEW"}
        </strong>

      </div>

      <div className="quality-result">

        <h3>Brightness</h3>

        <p>
          {imageQuality.scores.brightness}
        </p>

        <strong>
          {imageQuality.checks.brightness
            ? "PASS"
            : "NEEDS REVIEW"}
        </strong>

      </div>

    </div>
  )}

</div>

      </main>

    </div>
  );
}

export default Analysis;