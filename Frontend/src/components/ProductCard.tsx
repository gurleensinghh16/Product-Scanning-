import { Package } from "lucide-react";

interface Props {
  name: string;
  brand: string;
  mrp: string;
  status: "Compliant" | "Violation" | "Review";
}

function ProductCard({ name, brand, mrp, status }: Props) {

  return (
    <div className="product-card">

      <div className="product-icon">
        <Package size={28} />
      </div>

      <div className="product-info">
        <h3>{name}</h3>
        <p>{brand}</p>
        <span>MRP: {mrp}</span>
      </div>

      <span className={`status ${status.toLowerCase()}`}>
        {status}
      </span>

    </div>
  );
}

export default ProductCard;