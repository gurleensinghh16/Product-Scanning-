import Sidebar from "../../components/Sidebar";
import StatCard from "../../components/StatCard";
import ProductCard from "../../components/ProductCard";

function InspectorDashboard() {

  return (
    <div className="dashboard-layout">

      <Sidebar />

      <main className="dashboard">

        <div className="dashboard-header">

          <div>
            <p className="eyebrow">
              INSPECTOR PORTAL
            </p>

            <h1>
              Inspection Dashboard
            </h1>

            <p>
              Monitor product compliance inspections and scan new products.
            </p>
          </div>

          <button
            className="primary-btn"
            onClick={() => window.location.href = "/inspector/scan"}
          >
            + New Inspection
          </button>

        </div>

        <section className="stats-grid">

          <StatCard
            title="Products Inspected"
            value="248"
            description="Total inspections"
          />

          <StatCard
            title="Compliant"
            value="196"
            description="79% of inspections"
          />

          <StatCard
            title="Violations"
            value="37"
            description="Require attention"
          />

          <StatCard
            title="Manual Review"
            value="15"
            description="Pending verification"
          />

        </section>

        <section className="dashboard-section">

          <div className="section-header">

            <div>
              <h2>Recent Inspections</h2>
              <p>Latest product compliance checks</p>
            </div>

          </div>

          <div className="product-list">

            <ProductCard
              id="INS-0248"
              name="Packaged Wheat Flour"
              brand="Sample Brand"
              mrp="₹58"
              status="Compliant"
              image="/products/wheat-flour.jpg"
            />

            <ProductCard
              id="INS-0247"
              name="Packaged Biscuits"
              brand="Sample Foods"
              mrp="₹30"
              status="Violation"
              image="/products/biscuits.jpg"
            />

            <ProductCard
              id="INS-0246"
              name="Cooking Oil"
              brand="Sample Oils"
              mrp="₹145"
              status="Review"
              image="/products/cooking-oil.jpg"
            />
            
          </div>

        </section>

      </main>

    </div>
  );
}

export default InspectorDashboard;