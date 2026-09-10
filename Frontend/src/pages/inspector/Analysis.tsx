import { CheckCircle2 } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useEffect, useState } from "react";

function Analysis() {
  const [imageQuality, setImageQuality] = useState<any>(null);
  const [ocrResult, setOcrResult] = useState<any>(null);

  useEffect(() => {
    const storedImageQuality =
      sessionStorage.getItem("imageQualityResult");

    const storedOCR =
      sessionStorage.getItem("ocrResult");

    if (storedImageQuality) {
      setImageQuality(
        JSON.parse(storedImageQuality)
      );
    }

    if (storedOCR) {
      setOcrResult(
        JSON.parse(storedOCR)
      );
    }
  }, []);

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        {/* ============================= */}
        {/* PAGE HEADER */}
        {/* ============================= */}

        <div className="page-header">

          <p className="eyebrow">
            AI ANALYSIS
          </p>

          <h1>
            Image & OCR Analysis
          </h1>

          <p>
            Checking image quality and extracting
            product declarations.
          </p>

        </div>


        {/* ============================= */}
        {/* IMAGE QUALITY */}
        {/* ============================= */}

        <div className="analysis-card">

          <div className="analysis-icon">
            <CheckCircle2 size={50} />
          </div>

          <h2>
            Image Quality Check Complete
          </h2>

          {imageQuality && (

            <div className="image-quality-results">

              {/* Resolution */}

              <div className="quality-result">

                <h3>
                  Resolution
                </h3>

                <p>
                  {imageQuality.image.width}
                  {" × "}
                  {imageQuality.image.height}
                </p>

                <strong>
                  {imageQuality.checks.resolution
                    ? "PASS"
                    : "NEEDS REVIEW"}
                </strong>

              </div>


              {/* Brightness */}

              <div className="quality-result">

                <h3>
                  Brightness
                </h3>

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


        {/* ============================= */}
        {/* OCR + REGION QUALITY */}
        {/* ============================= */}

        {ocrResult && (

          <div className="analysis-card ocr-results">

            <div className="analysis-icon">
              <CheckCircle2 size={40} />
            </div>

            <h2>
              OCR & Region Quality
            </h2>

            <p>
              Detected regions:{" "}
              <strong>
                {ocrResult.ocr.length}
              </strong>
            </p>


            {/* OCR REGIONS */}

            <div className="ocr-list">

              {ocrResult.ocr.map(
                (region: any, index: number) => (

                  <div
                    className="ocr-result"
                    key={index}
                  >

                    {/* Detected text */}

                    <h3>
                      {region.text ||
                        "No text detected"}
                    </h3>


                    <div className="ocr-details">

                      {/* Confidence */}

                      <div>

                        <span>
                          Confidence
                        </span>

                        <strong>
                          {(
                            region.confidence * 100
                          ).toFixed(1)}
                          %
                        </strong>

                      </div>


                      {/* Sharpness */}

                      <div>

                        <span>
                          Sharpness
                        </span>

                        <strong>
                          {region.sharpness}
                        </strong>

                      </div>


                      {/* Quality */}

                      <div>

                        <span>
                          Quality
                        </span>

                        <strong>
                          {region.quality}
                        </strong>

                      </div>

                    </div>


                    {/* Bounding Box */}

                    <div className="ocr-box">

                      <span>
                        Bounding Box
                      </span>

                      <p>
                        [
                        {region.box.join(", ")}
                        ]
                      </p>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        )}

      </main>

    </div>
  );
}

export default Analysis;