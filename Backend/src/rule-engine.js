const rules = require("./rules.json");

function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[₹,:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function findText(ocrData, keywords) {
  const results = [];

  for (const item of ocrData) {

    // Ignore poor-quality OCR regions
    if (item.quality === "POOR") {
      continue;
    }

    const text = normalize(item.text);

    for (const keyword of keywords) {

      if (text.includes(normalize(keyword))) {

        results.push({
          text: item.text,
          confidence: item.confidence,
          sharpness: item.sharpness,
          quality: item.quality,
          box: item.box
        });

        break;
      }
    }
  }

  return results;
}

function extractQuantity(ocrData) {
  const quantityRegex =
    /(\d+(?:\.\d+)?)\s*(kg|g|mg|l|litre|liter|ml)\b/i;

  // 1. Look for quantity directly inside Net Quantity/Weight/Volume text
  for (const item of ocrData) {
    if (item.quality === "POOR") {
      continue;
    }

    const isNetQuantityText =
      /net\s*(qty|quantity|weight|volume|wt|vol)\b/i.test(item.text);

    if (isNetQuantityText) {
      const match = item.text.match(quantityRegex);

      if (match) {
        return createQuantity(match, item);
      }
    }
  }

  // 2. Find the Net Quantity label
  //    and look at the following OCR regions for its value
  const netQuantityIndex = ocrData.findIndex(
    (item) =>
      item.quality !== "POOR" &&
      /net\s*(qty|quantity|weight|volume|wt|vol)\b/i.test(item.text)
  );

  if (netQuantityIndex !== -1) {
    for (
      let i = netQuantityIndex + 1;
      i < ocrData.length;
      i++
    ) {
      const item = ocrData[i];

      if (item.quality === "POOR") {
        continue;
      }

      const match = item.text.match(quantityRegex);

      if (match) {
        return createQuantity(match, item);
      }
    }
  }

  // 3. Fallback: search any good OCR region for a quantity
  for (const item of ocrData) {
    if (item.quality === "POOR") {
      continue;
    }

    const match = item.text.match(quantityRegex);

    if (match) {
      return createQuantity(match, item);
    }
  }

  return null;
}

function createQuantity(match, item) {
  let value = parseFloat(match[1]);
  let unit = match[2].toLowerCase();

  if (unit === "kilogram") {
    unit = "kg";
  }

  if (unit === "litre" || unit === "liter") {
    unit = "l";
  }

  return {
    value,
    unit,
    original: item.text,
    confidence: item.confidence
  };
}

function normalizeQuantity(value, unit) {
  if (unit === "kg") {
    return value * 1000;
  }

  if (unit === "l") {
    return value * 1000;
  }

  return value;
}

function checkStandardQuantity(quantity, standardRule) {
  if (!quantity || !standardRule) {
    return {
      status: "NEEDS_REVIEW",
      reason: "Net quantity could not be reliably determined."
    };
  }

  const unit = quantity.unit;

  const isWeight =
    unit === "g" ||
    unit === "kg";

  const isVolume =
    unit === "ml" ||
    unit === "l";

  if (!isWeight && !isVolume) {
    return {
      status: "NEEDS_REVIEW",
      reason: "Unsupported quantity unit."
    };
  }

  const normalizedValue = normalizeQuantity(
    quantity.value,
    unit
  );

  const normalizedStandard = standardRule.standard_quantities.map(
    (item) => {
      const match = item.match(
        /(\d+(?:\.\d+)?)(g|kg|ml|l)/i
      );

      if (!match) return null;

      return {
        value: normalizeQuantity(
          parseFloat(match[1]),
          match[2].toLowerCase()
        ),
        unit: match[2].toLowerCase()
      };
    }
  ).filter(Boolean);

  const matchingUnit = normalizedStandard.some(
    (item) => {
      if (isWeight) {
        return (
          item.unit === "g" ||
          item.unit === "kg"
        ) &&
        item.value === normalizedValue;
      }

      return (
        item.unit === "ml" ||
        item.unit === "l"
      ) &&
      item.value === normalizedValue;
    }
  );

  if (matchingUnit) {
    return {
      status: "PASS",
      reason: "Declared quantity matches a standard pack size."
    };
  }

  return {
    status: "POTENTIAL_NON_COMPLIANCE",
    reason:
      "Declared quantity does not match a listed standard pack size."
  };
}

function runRuleEngine({
  category,
  subcategory,
  imported = false,
  ocr = []
}) {
  const results = [];

  /*
   * -----------------------------------------
   * COMMON RULES
   * -----------------------------------------
   */

  for (const rule of rules.common_rules) {

    if (
      rule.condition === "imported" &&
      !imported
    ) {
      continue;
    }

    const matches = findText(
      ocr,
      rule.keywords
    );

    results.push({
      ruleId: rule.id,
      label: rule.label,
      status:
        matches.length > 0
          ? "PASS"
          : rule.required
            ? "POTENTIAL_NON_COMPLIANCE"
            : "NEEDS_REVIEW",
      found: matches.length > 0,
      matches
    });
  }

  /*
   * -----------------------------------------
   * CATEGORY RULES
   * -----------------------------------------
   */

  const categoryRules =
    rules.categories[category];

  if (!categoryRules) {
    return {
      success: false,
      message: `Unsupported category: ${category}`
    };
  }

  const subcategoryRules =
    categoryRules.subcategories?.[subcategory];

  if (!subcategoryRules) {
    return {
      success: false,
      message:
        `Unsupported subcategory: ${subcategory}`
    };
  }

  /*
   * -----------------------------------------
   * STANDARD PACK SIZE
   * -----------------------------------------
   */

  if (
    subcategoryRules.standard_quantities
  ) {
    const quantity =
      extractQuantity(ocr);

    const standardResult =
      checkStandardQuantity(
        quantity,
        subcategoryRules
      );

    results.push({
      ruleId: "standard_pack_size",
      label: "Standard Pack Size",
      status: standardResult.status,
      reason: standardResult.reason,
      detectedQuantity: quantity
    });
  }

  /*
   * -----------------------------------------
   * FINAL RESULT
   * -----------------------------------------
   */

  const hasPotentialViolation =
  results.some(
    (result) =>
      result.status === "POTENTIAL_NON_COMPLIANCE" &&
      result.ruleId !== "product_name"
  );

const needsReview =
  results.some(
    (result) =>
      result.status === "NEEDS_REVIEW"
  );

  let overallStatus = "PASS";

  if (hasPotentialViolation) {
    overallStatus =
      "POTENTIAL_NON_COMPLIANCE";
  } else if (needsReview) {
    overallStatus = "NEEDS_REVIEW";
  }

  return {
    success: true,

    category,
    subcategory,

    overallStatus,

    results
  };
}

module.exports = {
  runRuleEngine
};