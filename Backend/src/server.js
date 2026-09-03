const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { checkImageQuality } = require("./image-quality");

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

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});