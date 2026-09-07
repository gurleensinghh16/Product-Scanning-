import { Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "./StatusBadge";

interface Props {
  id: string;
  name: string;
  brand: string;
  mrp: string;
  status: "Compliant" | "Violation" | "Review";
  image?: string;
}

function ProductCard({
  id,
  name,
  brand,
  mrp,
  status,
  image
}: Props) {

  const navigate = useNavigate();

  return (
    <button
      className="product-card"
      onClick={() => navigate(`/inspector/inspection/${id}`)}
    >

      <div className="product-image">

        {image ? (
          <img
            src={image}
            alt={name}
          />
        ) : (
          <div className="image-placeholder">
            <ImageIcon size={26} />
          </div>
        )}

      </div>

      <div className="product-info">

        <h3>{name}</h3>

        <p>{brand}</p>

        <span>MRP: {mrp}</span>

      </div>

      <StatusBadge status={status} />

    </button>
  );
}

export default ProductCard;