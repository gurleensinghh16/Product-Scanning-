const { PDFDocument } = require("pdfkit");
const fs = require("fs");


// ============================================================
// GENERATE PDF
// ============================================================

function generatePDF(reportData, outputPath) {

  return new Promise((resolve, reject) => {

    try {

      const doc = new PDFDocument({
        margin: 50,
        size: "A4"
      });


      const stream = fs.createWriteStream(
        outputPath
      );


      stream.on("finish", () => {
        resolve(outputPath);
      });


      stream.on("error", reject);


      doc.pipe(stream);


      // ======================================================
      // HEADER
      // ======================================================

      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .text(
          "NIRIKSHAK AI",
          {
            align: "center"
          }
        );


      doc
        .moveDown(0.3)
        .fontSize(14)
        .font("Helvetica")
        .text(
          "Legal Metrology Inspection Report",
          {
            align: "center"
          }
        );


      doc.moveDown(1);


      // ======================================================
      // PRODUCT INFORMATION
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "Product Information"
        );


      doc.moveDown(0.4);


      doc
        .fontSize(11)
        .font("Helvetica")
        .text(
          `Product: ${
            reportData.product?.name ||
            "Not available"
          }`
        )
        .text(
          `Category: ${
            reportData.product?.category ||
            "Not available"
          }`
        )
        .text(
          `Subcategory: ${
            reportData.product?.subcategory ||
            "Not available"
          }`
        )
        .text(
          `Images Inspected: ${
            reportData.product?.images ??
            "Not available"
          }`
        );


      if (
        reportData.product?.confidence !== null &&
        reportData.product?.confidence !== undefined
      ) {

        doc.text(
          `Detection Confidence: ${
            (
              reportData.product.confidence * 100
            ).toFixed(1)
          }%`
        );

      }


      doc.text(
        `Detection Evidence: ${
          reportData.product?.evidenceCount ??
          0
        } regions`
      );


      if (
        reportData.product?.supportingImages &&
        reportData.product.supportingImages.length
      ) {

        doc.text(
          `Supporting Images: ${
            reportData.product.supportingImages.join(
              ", "
            )
          }`
        );

      }


      doc.moveDown(1);


      // ======================================================
      // OVERALL RESULT
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "Overall Result"
        );


      doc.moveDown(0.4);


      const overallStatus =
        reportData.ruleEngine?.overallStatus ||
        reportData.overall_assessment ||
        "NEEDS_REVIEW";


      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .text(
          overallStatus
        );


      doc.moveDown(1);


      // ======================================================
      // RULE ENGINE RESULTS
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "Rule Engine Results"
        );


      doc.moveDown(0.4);


      const ruleResults =
        reportData.ruleEngine?.results || [];


      if (!ruleResults.length) {

        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            "No Rule Engine results available."
          );

      }


      for (const result of ruleResults) {

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            `${result.status}: ${
              result.label ||
              result.ruleId ||
              "Rule"
            }`
          );


        if (result.reason) {

          doc
            .font("Helvetica")
            .text(
              `Reason: ${result.reason}`
            );

        }


        // ----------------------------------------------------
        // Display OCR evidence when available
        // ----------------------------------------------------

        if (
          result.matches &&
          result.matches.length
        ) {

          const evidence =
            result.matches[0];


          if (evidence.text) {

            doc
              .font("Helvetica")
              .text(
                `Evidence: ${evidence.text}`
              );

          }

        }


        // ----------------------------------------------------
        // Display detected quantity
        // ----------------------------------------------------

        if (
          result.detectedQuantity
        ) {

          const quantity =
            result.detectedQuantity;


          doc
            .font("Helvetica")
            .text(
              `Detected Quantity: ${
                quantity.value
              } ${
                quantity.unit
              }`
            );

        }


        doc.moveDown(0.5);

      }


      doc.moveDown(0.5);


      // ======================================================
      // AI INSPECTION SUMMARY
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "AI Inspection Summary"
        );


      doc.moveDown(0.4);


      doc
        .fontSize(11)
        .font("Helvetica")
        .text(
          reportData.inspection_summary ||
          "No AI summary available."
        );


      doc.moveDown(1);


      // ======================================================
      // KEY FINDINGS
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "Key Findings"
        );


      doc.moveDown(0.4);


      const keyFindings =
        reportData.key_findings || [];


      if (!keyFindings.length) {

        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            "No key findings available."
          );

      }


      for (
        const finding of keyFindings
      ) {

        doc
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(
            `${finding.type || "FINDING"}: ${
              finding.title ||
              "Untitled finding"
            }`
          );


        doc
          .font("Helvetica")
          .text(
            finding.description ||
            ""
          );


        doc.moveDown(0.5);

      }


      // ======================================================
      // OFFICER ATTENTION
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "Officer Attention"
        );


      doc.moveDown(0.4);


      const officerAttention =
        reportData.officer_attention || [];


      if (!officerAttention.length) {

        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            "No additional officer attention items."
          );

      }


      for (
        const item of officerAttention
      ) {

        doc
          .fontSize(11)
          .font("Helvetica")
          .text(
            `- ${item}`
          );


        doc.moveDown(0.3);

      }


      doc.moveDown(0.7);


      // ======================================================
      // LIMITATIONS
      // ======================================================

      doc
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(
          "Limitations"
        );


      doc.moveDown(0.4);


      const limitations =
        reportData.limitations || [];


      if (!limitations.length) {

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            "No limitations specified."
          );

      }


      for (
        const item of limitations
      ) {

        doc
          .fontSize(10)
          .font("Helvetica")
          .text(
            `- ${item}`
          );


        doc.moveDown(0.3);

      }


      doc.moveDown(1);


      // ======================================================
      // FOOTER
      // ======================================================

      doc
        .fontSize(9)
        .font("Helvetica")
        .text(
          "NIRIKSHAK AI - Automated inspection assistance system",
          {
            align: "center"
          }
        );


      // ======================================================
      // FINISH PDF
      // ======================================================

      doc.end();

    } catch (error) {

      reject(error);

    }

  });

}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  generatePDF
};