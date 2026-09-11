const fs = require("fs");

const {
  generateSummary
} = require("./ai-summary");

const {
  generatePDF
} = require("./pdf-generator");


// ============================================================
// GENERATE COMPLETE REPORT
// ============================================================

async function generateReport(
  ruleEngineResult,
  detection,
  productFolder,
  imagesProcessed
) {

  console.log();
  console.log("=".repeat(60));
  console.log("GEMINI ANALYSIS");
  console.log("=".repeat(60));

  console.log(
    "Sending actual Rule Engine result to Gemini..."
  );


  // ----------------------------------------------------------
  // STEP 1 — GEMINI ANALYSIS
  // ----------------------------------------------------------

  const aiReport = await generateSummary(
    ruleEngineResult
  );


  console.log();
  console.log(
    "Gemini analysis completed."
  );


  // ----------------------------------------------------------
  // STEP 2 — PREPARE FINAL REPORT DATA
  // ----------------------------------------------------------

  const reportData = {

    product: {

      name:
        detection?.product ||
        "Unknown",

      category:
        detection?.category ||
        ruleEngineResult?.category ||
        "Unknown",

      subcategory:
        detection?.subcategory ||
        ruleEngineResult?.subcategory ||
        "Unknown",

      confidence:
        detection?.confidence ?? null,

      evidenceCount:
        detection?.evidence_count ?? 0,

      supportingImages:
        detection?.supporting_images || [],

      images:
        imagesProcessed
    },


    // Keep the original deterministic
    // Rule Engine result inside the report.
    ruleEngine:
      ruleEngineResult,


    // Gemini-generated explanation.
    ...aiReport
  };


  // ----------------------------------------------------------
  // STEP 3 — GENERATE PDF
  // ----------------------------------------------------------

  const pdfPath =
    `${productFolder}/NIRIKSHAK_AI_Inspection_Report.pdf`;


  console.log();
  console.log(
    "Generating PDF using PDFKit..."
  );


  await generatePDF(
    reportData,
    pdfPath
  );


  console.log();
  console.log("=".repeat(60));
  console.log("PDF GENERATED");
  console.log("=".repeat(60));

  console.log(
    `PDF saved to: ${pdfPath}`
  );

  console.log("=".repeat(60));


  return {
    reportData,
    pdfPath
  };
}


// ============================================================
// COMMAND-LINE ENTRY
// ============================================================

async function main() {

  try {

    // --------------------------------------------------------
    // Read complete input from Python stdin
    // --------------------------------------------------------

    const input =
      fs.readFileSync(
        0,
        "utf-8"
      );


    if (!input.trim()) {

      throw new Error(
        "No report input received."
      );

    }


    const data =
      JSON.parse(input);


    // --------------------------------------------------------
    // Extract data sent by batch_ocr.py
    // --------------------------------------------------------

    const ruleEngineResult =
      data.ruleEngineResult;

    const detection =
      data.detection;

    const productFolder =
      data.productFolder;

    const imagesProcessed =
      Number(
        data.imagesProcessed || 0
      );


    // --------------------------------------------------------
    // Validate required data
    // --------------------------------------------------------

    if (!ruleEngineResult) {

      throw new Error(
        "Rule Engine result is missing."
      );

    }


    if (!productFolder) {

      throw new Error(
        "Product folder is missing."
      );

    }


    // --------------------------------------------------------
    // Generate complete report
    // --------------------------------------------------------

    await generateReport(
      ruleEngineResult,
      detection,
      productFolder,
      imagesProcessed
    );


  } catch (error) {

    console.error();
    console.error(
      "Report generation error:"
    );

    console.error(error);

    process.exit(1);
  }
}


// ============================================================
// RUN ONLY WHEN FILE IS EXECUTED DIRECTLY
// ============================================================

if (require.main === module) {

  main();

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generateReport
};