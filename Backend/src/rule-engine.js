const rules = require("./rules.json");


/* ============================================================
   NORMALIZATION
   ============================================================ */

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[₹,:;()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


/* ============================================================
   TEXT MATCHING
   ============================================================ */

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
          box: item.box,
          source_image: item.source_image
        });

        break;
      }
    }
  }

  return results;
}


/* ============================================================
   QUANTITY EXTRACTION
   ============================================================ */

function extractQuantity(
  ocrData,
  category,
  subcategoryRules
) {
  const quantityRegex =
    /(\d+(?:\.\d+)?)\s*(kg|g|mg|l|litre|liter|ml)\b/i;

  const netLabelRegex =
    /\bnet\s*(qty|quantity|weight|volume|wt|vol|content)\b/i;

  const nutritionRegex =
    /\b(serving\s*size|nutrition|nutritional|energy|calories?|protein|carbohydrate|carbs?|fat|saturated|trans\s*fat|fibre|fiber|sugar|sodium|salt|cholesterol|%\s*rda|per\s*100)\b/i;


  /* ----------------------------------------------------------
     Determine preferred quantity family

     This is NOT a legal rule.

     It is only used to distinguish things such as:

       300ml  -> likely package quantity for beverage

       10mg   -> likely nutrition value
  ---------------------------------------------------------- */

  let preferredFamily = null;


  // First use existing standard quantities from rules.json
  if (
    subcategoryRules &&
    Array.isArray(subcategoryRules.standard_quantities)
  ) {
    const units =
      subcategoryRules.standard_quantities
        .map((item) => {
          const match = String(item).match(
            /(\d+(?:\.\d+)?)\s*(g|kg|mg|ml|l|litre|liter)/i
          );

          return match
            ? match[2].toLowerCase()
            : null;
        })
        .filter(Boolean);


    const hasVolume = units.some(
      (unit) =>
        unit === "ml" ||
        unit === "l" ||
        unit === "litre" ||
        unit === "liter"
    );


    const hasWeight = units.some(
      (unit) =>
        unit === "g" ||
        unit === "kg" ||
        unit === "mg"
    );


    if (hasVolume && !hasWeight) {
      preferredFamily = "volume";
    }


    if (hasWeight && !hasVolume) {
      preferredFamily = "weight";
    }
  }


  // Product-type fallback
  if (!preferredFamily) {
    if (category === "beverages_water") {
      preferredFamily = "volume";
    }

    if (category === "food") {
      preferredFamily = "weight";
    }
  }


  /* ----------------------------------------------------------
     Helpers
  ---------------------------------------------------------- */

  function getFamily(unit) {
    unit = String(unit || "").toLowerCase();

    if (
      unit === "ml" ||
      unit === "l" ||
      unit === "litre" ||
      unit === "liter"
    ) {
      return "volume";
    }

    return "weight";
  }


  function getBoxCenter(box) {
    if (
      !Array.isArray(box) ||
      box.length < 4
    ) {
      return null;
    }

    return {
      x: (box[0] + box[2]) / 2,
      y: (box[1] + box[3]) / 2
    };
  }


  function distanceBetween(first, second) {
    const a = getBoxCenter(first.box);
    const b = getBoxCenter(second.box);

    if (!a || !b) {
      return Infinity;
    }

    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2)
    );
  }


  function parseQuantity(item) {
    if (
      !item ||
      item.quality === "POOR"
    ) {
      return null;
    }

    const text =
      String(item.text || "").trim();

    if (!text) {
      return null;
    }


    const match =
      text.match(quantityRegex);

    if (!match) {
      return null;
    }


    const isNetLabel =
      netLabelRegex.test(text);


    /* --------------------------------------------------------
       Reject nutrition / serving text unless the SAME OCR
       region explicitly contains a Net Quantity declaration.
    -------------------------------------------------------- */

    if (
      nutritionRegex.test(text) &&
      !isNetLabel
    ) {
      return null;
    }


    /* --------------------------------------------------------
       Standalone quantity rule

       Accept:

         100g
         300ml
         1 kg
         500 g

       Reject:

         Se Se20g(ab4bus)
         Serving Size: 20g
         Calories 300 kcal
         10mg/100
    -------------------------------------------------------- */

    const standaloneRegex =
      /^\s*\d+(?:\.\d+)?\s*(kg|g|mg|ml|l|litre|liter)\s*[.,]?\s*$/i;


    if (
      !isNetLabel &&
      !standaloneRegex.test(text)
    ) {
      return null;
    }


    return createQuantity(
      match,
      item
    );
  }


  /* ----------------------------------------------------------
     1. Explicit Net Quantity + value
  ---------------------------------------------------------- */

  for (const item of ocrData) {
    if (item.quality === "POOR") {
      continue;
    }

    if (
      netLabelRegex.test(
        String(item.text || "")
      )
    ) {
      const quantity =
        parseQuantity(item);

      if (quantity) {
        return quantity;
      }
    }
  }


  /* ----------------------------------------------------------
     2. Find Net Quantity label and a nearby standalone
        quantity in the SAME image
  ---------------------------------------------------------- */

  const netLabels =
    ocrData.filter(
      (item) =>
        item.quality !== "POOR" &&
        netLabelRegex.test(
          String(item.text || "")
        )
    );


  const standaloneCandidates =
    ocrData
      .map((item) => {
        const quantity =
          parseQuantity(item);

        if (!quantity) {
          return null;
        }

        return {
          item,
          quantity
        };
      })
      .filter(Boolean);


  let bestNearby = null;


  for (const netLabel of netLabels) {
    for (const candidate of standaloneCandidates) {

      // Never compare quantities from another image
      if (
        netLabel.source_image &&
        candidate.item.source_image &&
        netLabel.source_image !==
          candidate.item.source_image
      ) {
        continue;
      }


      const distance =
        distanceBetween(
          netLabel,
          candidate.item
        );


      // Quantity must be reasonably close
      // to the Net Quantity label.
      if (distance > 500) {
        continue;
      }


      const family =
        getFamily(
          candidate.quantity.unit
        );


      let score =
        1000 - distance;


      // Prefer expected unit family
      if (
        preferredFamily &&
        family === preferredFamily
      ) {
        score += 500;
      }


      // Prefer higher OCR confidence
      score +=
        (candidate.item.confidence || 0) * 100;


      if (
        !bestNearby ||
        score > bestNearby.score
      ) {
        bestNearby = {
          score,
          quantity:
            candidate.quantity
        };
      }
    }
  }


  if (bestNearby) {
    return bestNearby.quantity;
  }


  /* ----------------------------------------------------------
     3. No explicit Net label found

     Use ONLY clean standalone quantities.

     Prefer the unit family expected for the product.
  ---------------------------------------------------------- */

  if (standaloneCandidates.length > 0) {

    const sorted =
      standaloneCandidates.sort(
        (a, b) => {

          const familyA =
            getFamily(
              a.quantity.unit
            );

          const familyB =
            getFamily(
              b.quantity.unit
            );


          const preferredA =
            preferredFamily &&
            familyA === preferredFamily
              ? 1
              : 0;


          const preferredB =
            preferredFamily &&
            familyB === preferredFamily
              ? 1
              : 0;


          if (
            preferredA !== preferredB
          ) {
            return preferredB - preferredA;
          }


          return (
            (b.item.confidence || 0) -
            (a.item.confidence || 0)
          );
        }
      );


    return sorted[0].quantity;
  }


  /* ----------------------------------------------------------
     Never guess quantity
  ---------------------------------------------------------- */

  return null;
}


/* ============================================================
   CREATE QUANTITY OBJECT
   ============================================================ */

function createQuantity(match, item) {
  let value =
    parseFloat(match[1]);

  let unit =
    match[2].toLowerCase();


  if (unit === "kilogram") {
    unit = "kg";
  }


  if (
    unit === "litre" ||
    unit === "liter"
  ) {
    unit = "l";
  }


  return {
    value,
    unit,
    original: item.text,
    confidence: item.confidence
  };
}


/* ============================================================
   NORMALIZE QUANTITY
   ============================================================ */

function normalizeQuantity(value, unit) {
  if (unit === "kg") {
    return value * 1000;
  }

  if (unit === "l") {
    return value * 1000;
  }

  return value;
}


/* ============================================================
   STANDARD PACK SIZE CHECK
   ============================================================ */

function checkStandardQuantity(
  quantity,
  standardRule
) {
  if (!quantity || !standardRule) {
    return {
      status: "NEEDS_REVIEW",
      reason:
        "Net quantity could not be reliably determined."
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
      reason:
        "Unsupported quantity unit."
    };
  }


  const normalizedValue =
    normalizeQuantity(
      quantity.value,
      unit
    );


  const normalizedStandard =
    standardRule.standard_quantities
      .map((item) => {

        const match =
          String(item).match(
            /(\d+(?:\.\d+)?)\s*(g|kg|ml|l|litre|liter)/i
          );


        if (!match) {
          return null;
        }


        let standardUnit =
          match[2].toLowerCase();


        if (
          standardUnit === "litre" ||
          standardUnit === "liter"
        ) {
          standardUnit = "l";
        }


        if (
          standardUnit === "kilogram"
        ) {
          standardUnit = "kg";
        }


        return {
          value:
            normalizeQuantity(
              parseFloat(match[1]),
              standardUnit
            ),
          unit: standardUnit
        };
      })
      .filter(Boolean);


  const matchingUnit =
    normalizedStandard.some(
      (item) => {

        if (isWeight) {
          return (
            (item.unit === "g" ||
              item.unit === "kg") &&
            item.value ===
              normalizedValue
          );
        }


        return (
          (item.unit === "ml" ||
            item.unit === "l") &&
          item.value ===
            normalizedValue
        );
      }
    );


  if (matchingUnit) {
    return {
      status: "PASS",
      reason:
        "Declared quantity matches a standard pack size."
    };
  }


  return {
    status:
      "POTENTIAL_NON_COMPLIANCE",
    reason:
      "Declared quantity does not match a listed standard pack size."
  };
}


/* ============================================================
   RULE ENGINE
   ============================================================ */

function runRuleEngine({
  category,
  subcategory,
  imported = false,
  ocr = []
}) {

  const results = [];


  /* ----------------------------------------------------------
     CATEGORY VALIDATION
  ---------------------------------------------------------- */

  const categoryRules =
    rules.categories[category];


  if (!categoryRules) {
    return {
      success: false,
      message:
        `Unsupported category: ${category}`
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


  /* ----------------------------------------------------------
     COMMON RULES
  ---------------------------------------------------------- */

  for (const rule of rules.common_rules) {

    if (
      rule.condition === "imported" &&
      !imported
    ) {
      continue;
    }


    let matches =
      findText(
        ocr,
        rule.keywords
      );


    /* --------------------------------------------------------
       NET QUANTITY

       Use the same context-aware quantity extractor that is
       also used by Standard Pack Size.

       This prevents:

         net_quantity = 10mg

       while:

         standard_pack_size = 300ml
    -------------------------------------------------------- */

    let detectedQuantity = null;


    if (rule.id === "net_quantity") {

      detectedQuantity =
        extractQuantity(
          ocr,
          category,
          subcategoryRules
        );


      if (detectedQuantity) {

        matches = [
          {
            text:
              detectedQuantity.original,

            confidence:
              detectedQuantity.confidence,

            quality:
              "DETECTED",

            box: null
          }
        ];

      } else {

        matches = [];
      }
    }


    results.push({
      ruleId:
        rule.id,

      label:
        rule.label,

      status:
        matches.length > 0
          ? "PASS"
          : "NEEDS_REVIEW",

      found:
        matches.length > 0,

      matches
    });
  }


  /* ----------------------------------------------------------
     STANDARD PACK SIZE
  ---------------------------------------------------------- */

  if (
    Array.isArray(
      subcategoryRules.standard_quantities
    )
  ) {

    const quantity =
      extractQuantity(
        ocr,
        category,
        subcategoryRules
      );


    const standardResult =
      checkStandardQuantity(
        quantity,
        subcategoryRules
      );


    results.push({
      ruleId:
        "standard_pack_size",

      label:
        "Standard Pack Size",

      status:
        standardResult.status,

      reason:
        standardResult.reason,

      detectedQuantity:
        quantity
    });
  }


  /* ----------------------------------------------------------
     FINAL RESULT
  ---------------------------------------------------------- */

  const hasPotentialViolation =
    results.some(
      (result) =>
        result.status ===
          "POTENTIAL_NON_COMPLIANCE" &&
        result.ruleId !==
          "product_name"
    );


  const needsReview =
    results.some(
      (result) =>
        result.status ===
        "NEEDS_REVIEW"
    );


  let overallStatus =
    "PASS";


  if (hasPotentialViolation) {

    overallStatus =
      "POTENTIAL_NON_COMPLIANCE";

  } else if (needsReview) {

    overallStatus =
      "NEEDS_REVIEW";
  }


  return {
    success: true,

    category,

    subcategory,

    overallStatus,

    results
  };
}


/* ============================================================
   EXPORT
   ============================================================ */

module.exports = {
  runRuleEngine
};