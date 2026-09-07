const fs = require("fs");
const path = require("path");

const { runRuleEngine } = require("./rule-engine");

// Path to validated OCR
const ocrPath = path.join(
  __dirname,
  "../../ocr-service/validated_ocr.json"
);

// Load validated OCR
const ocrData = JSON.parse(
  fs.readFileSync(ocrPath, "utf8")
);

// Run Rule Engine
const result = runRuleEngine({
  category: "beverages_water",
  subcategory: "soft_drink",
  imported: false,
  ocr: ocrData
});

// Show result
console.log(JSON.stringify(result, null, 2));