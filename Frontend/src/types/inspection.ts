export interface Product {
  name: string;
  brand: string;
  category: string;
  mrp: string;
  netQuantity: string;
  manufacturer: string;
  countryOfOrigin: string;
  batchNumber?: string;
}

export interface ComplianceCheck {
  item: string;
  detected: string;
  required: string;
  status: "Compliant" | "Violation" | "Review";
}

export interface Inspection {
  id: string;
  productName: string;
  brand: string;
  date: string;
  status: "Compliant" | "Violation" | "Review";
  score: number;

  // All images captured/uploaded for this inspection
  images: string[];

  // Extracted product information
  product?: Product;

  // Compliance checks
  checks?: ComplianceCheck[];

  // Editable report information
  inspectorName?: string;
  observations?: string;
  recommendations?: string;
}