import { CheckCircle2, LoaderCircle, ScanText } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useEffect, useState } from "react";

function Analysis() {

  const [progress, setProgress] = useState(0);

  useEffect(() => {

    const interval = setInterval(() => {

      setProgress((previous) => {

        if (previous >= 100) {
          clearInterval(interval);
          return 100;
        }

        return previous + 10;
      });

    }, 300);

    return () => clearInterval(interval);

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
            Analyzing Product
          </h1>

          <p>
            Extracting declarations and checking applicable compliance rules.
          </p>

        </div>

        <div className="analysis-card">

          <div className="analysis-icon">
            {progress < 100
              ? <LoaderCircle size={50} className="spin" />
              : <CheckCircle2 size={50} />
            }
          </div>

          <h2>
            {progress < 100
              ? "Processing Product..."
              : "Analysis Complete"}
          </h2>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />

          </div>

          <span>
            {progress}% complete
          </span>

          <div className="analysis-steps">

            <AnalysisStep
              title="Image Processing"
              complete={progress >= 20}
            />

            <AnalysisStep
              title="OCR Declaration Extraction"
              complete={progress >= 50}
            />

            <AnalysisStep
              title="Rule Applicability Check"
              complete={progress >= 80}
            />

            <AnalysisStep
              title="Compliance Evaluation"
              complete={progress >= 100}
            />

          </div>

        </div>

      </main>

    </div>
  );
}

function AnalysisStep({
  title,
  complete
}: {
  title: string;
  complete: boolean;
}) {

  return (
    <div className="analysis-step">

      {complete
        ? <CheckCircle2 size={20} />
        : <ScanText size={20} />
      }

      <span>{title}</span>

    </div>
  );
}

export default Analysis;