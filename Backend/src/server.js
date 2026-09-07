const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { checkImageQuality } = require("./image-quality");
const { runRuleEngine } = require("./rule-engine");

const app = express();

app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage()
});

app.post(
  "/api/image-quality",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded"
        });
      }

      const result = await checkImageQuality(req.file);

      res.json(result);

    } catch (error) {
      console.error(error);

      res.status(500).json({
        success: false,
        message: "Unable to process image"
      });
    }
  }
);

app.post("/api/rule-engine", async (req, res) => {
  try {
    const {
      category,
      subcategory,
      imported,
      ocr
    } = req.body;

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category is required"
      });
    }

    if (!subcategory) {
      return res.status(400).json({
        success: false,
        message: "Subcategory is required"
      });
    }

    if (!Array.isArray(ocr)) {
      return res.status(400).json({
        success: false,
        message: "OCR data must be an array"
      });
    }

    const result = runRuleEngine({
      category,
      subcategory,
      imported: imported || false,
      ocr
    });

    res.json(result);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Rule engine failed"
    });
  }
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});