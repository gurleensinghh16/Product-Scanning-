import {
  ShieldCheck,
  ScanLine,
  FileCheck,
  ArrowRight
} from "lucide-react";

import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

function Landing() {

  return (
    <div className="landing">

      <Navbar />

      <main className="hero">

        <div className="hero-content">

          <div className="hero-badge">
            <ShieldCheck size={18} />
            AI-Powered Legal Metrology Inspection
          </div>

          <h1>
            Smarter Product
            <span> Compliance Inspection</span>
          </h1>

          <p>
            NIRIKSHAK AI helps Legal Metrology inspectors
            analyze packaged commodities by scanning product
            images and labels, extracting declarations and
            identifying potential compliance violations.
          </p>

          <div className="hero-buttons">

            <Link to="/login" className="primary-btn">
              Inspector Login
              <ArrowRight size={18} />
            </Link>

            <Link to="/public-scan" className="secondary-btn">
              <ScanLine size={18} />
              Public Product Scan
            </Link>

          </div>

        </div>

        <div className="hero-visual">

          <div className="scan-card">

            <div className="scan-header">
              <ScanLine size={22} />
              <span>AI Inspection</span>
            </div>

            <div className="scan-box">
              <div className="scan-line"></div>
              <PackageIcon />
            </div>

            <div className="scan-result">

              <div>
                <small>Compliance Status</small>
                <strong>Compliant</strong>
              </div>

              <div className="score">
                94%
              </div>

            </div>

          </div>

        </div>

      </main>

      <section className="features">

        <Feature
          icon={<ScanLine />}
          title="Scan & Extract"
          text="Scan product labels and automatically extract important declarations using OCR."
        />

        <Feature
          icon={<ShieldCheck />}
          title="Rule-Based Verification"
          text="Compare detected declarations against applicable Legal Metrology requirements."
        />

        <Feature
          icon={<FileCheck />}
          title="Inspection Evidence"
          text="Generate explainable compliance results and inspection-ready reports."
        />

      </section>

    </div>
  );
}

function Feature({
  icon,
  title,
  text
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {

  return (
    <div className="feature-card">

      <div className="feature-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>

    </div>
  );
}

function PackageIcon() {
  return (
    <div className="package-placeholder">
      PRODUCT
    </div>
  );
}

export default Landing;