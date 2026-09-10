const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const { checkImageQuality } = require("./image-quality");
const { runRuleEngine } = require("./rule-engine");

const app = express();

app.use(cors());
app.use(express.json());


// ============================================================
// FILE UPLOAD
// ============================================================

const upload = multer({
  storage: multer.memoryStorage()
});


// ============================================================
// TEMP DIRECTORY
// ============================================================

const tempDir = path.join(
  __dirname,
  "../temp"
);

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, {
    recursive: true
  });
}


// ============================================================
// OCR SAFETY LOCK
// ============================================================
//
// VERY IMPORTANT:
//
// Only ONE Python OCR process is allowed at a time.
//
// If another /api/ocr request arrives while OCR is already
// running, it will be rejected BEFORE spawn() is called.
//
// This prevents two PaddleOCR models from being loaded
// simultaneously and consuming huge amounts of RAM.
// ============================================================

let ocrProcessRunning = false;

let activeOcrProcess = null;


// ============================================================
// IMAGE QUALITY
// ============================================================

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


      console.log(
        "📷 Image quality request received"
      );


      const result =
        await checkImageQuality(req.file);


      console.log(
        "✅ Image quality completed"
      );


      res.json(result);

    } catch (error) {

      console.error(
        "❌ Image quality error:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Unable to process image"
      });

    }

  }
);


// ============================================================
// OCR
// ============================================================

app.post(
  "/api/ocr",
  upload.single("image"),
  async (req, res) => {

    // ========================================================
    // FIRST SAFETY CHECK
    // ========================================================
    //
    // If another OCR is already running, DO NOT spawn
    // another Python process.
    //
    // This check happens BEFORE spawn().
    // ========================================================

    if (ocrProcessRunning) {

      console.warn(
        "⚠️ OCR request rejected: another OCR process is already running"
      );

      return res.status(429).json({
        success: false,
        message:
          "OCR is already processing another image. Please wait."
      });

    }


    try {

      // ======================================================
      // CHECK IMAGE
      // ======================================================

      if (!req.file) {

        return res.status(400).json({
          success: false,
          message: "No image uploaded"
        });

      }


      // ======================================================
      // LOCK OCR
      // ======================================================
      //
      // Set this BEFORE spawn().
      //
      // This is critical because a second request arriving
      // immediately after the first one must see the lock.
      // ======================================================

      ocrProcessRunning = true;


      console.log("");
      console.log(
        "=========================================="
      );
      console.log(
        "🔥 OCR REQUEST ACCEPTED"
      );
      console.log(
        "=========================================="
      );


      // ======================================================
      // SAVE IMAGE TEMPORARILY
      // ======================================================

      const imagePath = path.join(
        tempDir,
        `ocr-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.jpg`
      );


      fs.writeFileSync(
        imagePath,
        req.file.buffer
      );


      console.log(
        "📁 Temporary image:",
        imagePath
      );


      // ======================================================
      // PYTHON PATH
      // ======================================================

      const pythonPath = path.join(
        __dirname,
        "../../ocr-env/bin/python"
      );


      // ======================================================
      // PYTHON OCR SCRIPT
      // ======================================================

      const scriptPath = path.join(
        __dirname,
        "../../ocr-service/ocr_test.py"
      );


      console.log(
        "🐍 Python:",
        pythonPath
      );

      console.log(
        "📜 Script:",
        scriptPath
      );


      // ======================================================
      // SPAWN EXACTLY ONE PYTHON PROCESS
      // ======================================================

      const pythonProcess = spawn(
        pythonPath,
        [
          scriptPath,
          imagePath
        ],
        {
          stdio: [
            "ignore",
            "pipe",
            "pipe"
          ]
        }
      );


      activeOcrProcess =
        pythonProcess;


      console.log(
        "🐍 Python OCR PID:",
        pythonProcess.pid
      );


      // ======================================================
      // COLLECT OUTPUT
      // ======================================================

      let output = "";

      let errorOutput = "";


      pythonProcess.stdout.on(
        "data",
        (data) => {

          output += data.toString();

        }
      );


      pythonProcess.stderr.on(
        "data",
        (data) => {

          errorOutput +=
            data.toString();

        }
      );


      // ======================================================
      // PYTHON PROCESS ERROR
      // ======================================================

      pythonProcess.on(
        "error",
        (error) => {

          console.error(
            "❌ Failed to start Python OCR:",
            error
          );


          // -----------------------------------------------
          // Remove temporary image
          // -----------------------------------------------

          if (
            fs.existsSync(imagePath)
          ) {

            fs.unlinkSync(
              imagePath
            );

          }


          // -----------------------------------------------
          // RELEASE OCR LOCK
          // -----------------------------------------------

          ocrProcessRunning = false;

          activeOcrProcess = null;


          // -----------------------------------------------
          // Send response only once
          // -----------------------------------------------

          if (!res.headersSent) {

            res.status(500).json({
              success: false,
              message:
                "Unable to start Python OCR"
            });

          }

        }
      );


      // ======================================================
      // PYTHON PROCESS FINISHED
      // ======================================================

      pythonProcess.on(
        "close",
        (code) => {

          console.log(
            "🐍 Python OCR finished"
          );

          console.log(
            "Exit code:",
            code
          );


          // -----------------------------------------------
          // ALWAYS RELEASE LOCK
          // -----------------------------------------------

          ocrProcessRunning = false;

          activeOcrProcess = null;


          // -----------------------------------------------
          // DELETE TEMP IMAGE
          // -----------------------------------------------

          if (
            fs.existsSync(imagePath)
          ) {

            fs.unlinkSync(
              imagePath
            );

            console.log(
              "🗑️ Temporary image deleted"
            );

          }


          // -----------------------------------------------
          // PYTHON FAILED
          // -----------------------------------------------

          if (code !== 0) {

            console.error(
              "❌ Python OCR failed:"
            );

            console.error(
              errorOutput
            );


            if (!res.headersSent) {

              return res.status(500).json({
                success: false,
                message:
                  "OCR processing failed"
              });

            }

            return;

          }


          // -----------------------------------------------
          // PARSE OCR JSON
          // -----------------------------------------------

          try {

            const trimmedOutput =
              output.trim();


            if (!trimmedOutput) {

              throw new Error(
                "Python returned empty output"
              );

            }


            const ocrData =
              JSON.parse(
                trimmedOutput
              );


            console.log(
              "✅ OCR JSON parsed successfully"
            );

            console.log(
              "🔎 Detected regions:",
              ocrData.length
            );


            // -------------------------------------------
            // SEND RESULT
            // -------------------------------------------

            if (!res.headersSent) {

              res.json({
                success: true,
                ocr: ocrData
              });

            }

          } catch (error) {

            console.error(
              "❌ Invalid OCR JSON:"
            );

            console.error(
              output
            );


            if (!res.headersSent) {

              res.status(500).json({
                success: false,
                message:
                  "Invalid OCR response"
              });

            }

          }

        }
      );

    } catch (error) {

      console.error(
        "❌ OCR route error:",
        error
      );


      // ====================================================
      // EMERGENCY CLEANUP
      // ====================================================

      ocrProcessRunning = false;

      activeOcrProcess = null;


      if (!res.headersSent) {

        res.status(500).json({
          success: false,
          message:
            "Unable to run OCR"
        });

      }

    }

  }
);


// ============================================================
// RULE ENGINE
// ============================================================

app.post(
  "/api/rule-engine",
  async (req, res) => {

    try {

      const {
        category,
        subcategory,
        imported,
        ocr
      } = req.body;


      // ------------------------------------------------------
      // CATEGORY
      // ------------------------------------------------------

      if (!category) {

        return res.status(400).json({
          success: false,
          message:
            "Category is required"
        });

      }


      // ------------------------------------------------------
      // SUBCATEGORY
      // ------------------------------------------------------

      if (!subcategory) {

        return res.status(400).json({
          success: false,
          message:
            "Subcategory is required"
        });

      }


      // ------------------------------------------------------
      // OCR
      // ------------------------------------------------------

      if (!Array.isArray(ocr)) {

        return res.status(400).json({
          success: false,
          message:
            "OCR data must be an array"
        });

      }


      // ------------------------------------------------------
      // RUN RULE ENGINE
      // ------------------------------------------------------

      const result =
        runRuleEngine({
          category,
          subcategory,
          imported: imported || false,
          ocr
        });


      res.json(result);

    } catch (error) {

      console.error(
        "❌ Rule engine error:",
        error
      );


      res.status(500).json({
        success: false,
        message:
          "Rule engine failed"
      });

    }

  }
);


// ============================================================
// SERVER
// ============================================================

const PORT =
  process.env.PORT || 5001;


app.listen(
  PORT,
  () => {

    console.log("");
    console.log(
      "=========================================="
    );
    console.log(
      `🚀 Backend running on port ${PORT}`
    );
    console.log(
      "🛡️ OCR single-process protection ENABLED"
    );
    console.log(
      "=========================================="
    );
    console.log("");

  }
);