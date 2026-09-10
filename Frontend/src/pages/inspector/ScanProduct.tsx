import { useRef, useState } from "react";
import {
  ScanLine,
  Upload,
  Camera,
  ArrowRight,
  X,
  Image as ImageIcon
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useNavigate } from "react-router-dom";

function ScanProduct() {
  const navigate = useNavigate();

  const [files, setFiles] = useState<File[]>([]);
  const [cameraOpen, setCameraOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // -------------------------------
  // Upload multiple images
  // -------------------------------
  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);

    setFiles((prev) => [...prev, ...selectedFiles]);

    // Allows selecting the same file again later
    e.target.value = "";
  };

  // -------------------------------
  // Remove image
  // -------------------------------
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // -------------------------------
  // Open camera
  // -------------------------------
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      });

      streamRef.current = stream;
      setCameraOpen(true);

      // Wait until camera element exists
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error("Camera error:", error);
      alert("Unable to access camera. Please allow camera permission.");
    }
  };

  // -------------------------------
  // Capture image from camera
  // -------------------------------
  const captureImage = () => {
    const video = videoRef.current;

    if (!video) return;

    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) return;

    context.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File(
        [blob],
        `camera-image-${Date.now()}.jpg`,
        {
          type: "image/jpeg"
        }
      );

      setFiles((prev) => [...prev, file]);
    }, "image/jpeg");
  };

  // -------------------------------
  // Close camera
  // -------------------------------
  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setCameraOpen(false);
  };

  // -------------------------------
  // Send images to OCR backend
  // -------------------------------
  const startAnalysis = async () => {

  if (files.length === 0) {
    alert("Please upload or capture at least one image.");
    return;
  }

  // For now we process the first image.
  // Later we will process all uploaded sides.
  const image = files[0];

  try {

    // ==========================================
    // STEP 1 — IMAGE QUALITY
    // ==========================================

    const qualityFormData = new FormData();

    qualityFormData.append(
      "image",
      image
    );

    const qualityResponse = await fetch(
      "http://localhost:5001/api/image-quality",
      {
        method: "POST",
        body: qualityFormData
      }
    );

    if (!qualityResponse.ok) {
      throw new Error(
        "Image quality request failed"
      );
    }

    const imageQuality =
      await qualityResponse.json();

    console.log(
      "IMAGE QUALITY:",
      imageQuality
    );


    // Save image quality result
    sessionStorage.setItem(
      "imageQualityResult",
      JSON.stringify(imageQuality)
    );


    // ==========================================
    // STEP 2 — CHECK IMAGE QUALITY
    // ==========================================

    const resolutionPassed =
      imageQuality.checks?.resolution;

    const brightnessPassed =
      imageQuality.checks?.brightness;


    if (
      !resolutionPassed ||
      !brightnessPassed
    ) {

      alert(
        "Image quality is insufficient. Please capture or upload a clearer image."
      );

      return;
    }


    // ==========================================
    // STEP 3 — OCR + SHARPNESS
    // ==========================================

    const ocrFormData = new FormData();

    ocrFormData.append(
      "image",
      image
    );

    const ocrResponse = await fetch(
      "http://localhost:5001/api/ocr",
      {
        method: "POST",
        body: ocrFormData
      }
    );


    if (!ocrResponse.ok) {
      throw new Error(
        "OCR request failed"
      );
    }


    const ocrResult =
      await ocrResponse.json();


    console.log(
      "OCR + REGION QUALITY:",
      ocrResult
    );


    // ==========================================
    // STEP 4 — SAVE OCR RESULT
    // ==========================================

    sessionStorage.setItem(
      "ocrResult",
      JSON.stringify(ocrResult)
    );


    // ==========================================
    // STEP 5 — GO TO ANALYSIS
    // ==========================================

    navigate(
      "/inspector/analysis"
    );


  } catch (error) {

    console.error(
      "Inspection analysis error:",
      error
    );

    alert(
      "Unable to analyze the product. Please check that the backend is running."
    );

  }
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
            Upload or capture product images containing the package
            declarations and label information.
          </p>

        </div>

        <div className="scan-page">

          <div className="upload-card">

            <div className="scan-icon">
              <ScanLine size={42} />
            </div>

            <h2>
              Upload Product Images
            </h2>

            <p>
              Upload multiple images of the packaged commodity.
              Capture different sides of the package when required.
            </p>

            {/* Upload */}
            <label className="upload-area">

              <Upload size={32} />

              <strong>
                Choose multiple images
              </strong>

              <span>
                JPG, JPEG or PNG
              </span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFiles}
              />

            </label>

            <div className="or">
              OR
            </div>

            {/* Camera */}
            <button
              className="camera-btn"
              onClick={openCamera}
              type="button"
            >
              <Camera size={20} />
              Use Camera
            </button>

            {/* Image previews */}
            {files.length > 0 && (

              <div className="selected-images">

                <h3>
                  Selected Images ({files.length})
                </h3>

                <div className="image-grid">

                  {files.map((file, index) => (

                    <div
                      className="image-preview"
                      key={`${file.name}-${index}`}
                    >

                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Product ${index + 1}`}
                      />

                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeFile(index)}
                      >
                        <X size={16} />
                      </button>

                    </div>

                  ))}

                </div>

              </div>

            )}

            {/* Analyze */}
            {files.length > 0 && (

              <button
                className="primary-btn analyze-btn"
                onClick={startAnalysis}
              >

                Analyze Product

                <ArrowRight size={18} />

              </button>

            )}

          </div>

          {/* Instructions */}

          <div className="scan-instructions">

            <h3>
              For better detection
            </h3>

            <ul>

              <li>
                Capture the complete package label.
              </li>

              <li>
                Keep the image clear and well-lit.
              </li>

              <li>
                Avoid glare or heavy reflections.
              </li>

              <li>
                Ensure MRP and quantity declarations are visible.
              </li>

              <li>
                Capture multiple sides if required.
              </li>

              <li>
                Use separate images for different package sides.
              </li>

            </ul>

          </div>

        </div>

      </main>

      {/* CAMERA MODAL */}

      {cameraOpen && (

        <div className="camera-modal">

          <div className="camera-container">

            <div className="camera-header">

              <h2>
                Capture Product Image
              </h2>

              <button
                type="button"
                onClick={closeCamera}
              >
                <X size={22} />
              </button>

            </div>

            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-video"
            />

            <button
              type="button"
              className="primary-btn capture-btn"
              onClick={captureImage}
            >

              <Camera size={20} />

              Capture Image

            </button>

            <button
              type="button"
              className="secondary-btn"
              onClick={closeCamera}
            >
              Done
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default ScanProduct;