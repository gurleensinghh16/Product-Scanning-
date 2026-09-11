import os
import sys
import json
import subprocess
from pathlib import Path


# ============================================================
# SUPPORTED IMAGE FORMATS
# ============================================================

IMAGE_EXTENSIONS = {
    ".jpg",
    ".jpeg",
    ".png",
    ".webp"
}


# ============================================================
# RUN OCR
# ============================================================

def run_ocr(image_path):
    """
    Run the existing ocr_test.py on one image
    and return its JSON result.
    """

    script_path = Path(__file__).parent / "ocr_test.py"

    result = subprocess.run(
        [
            sys.executable,
            str(script_path),
            str(image_path)
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:

        print(f"OCR failed for: {image_path.name}")

        if result.stderr.strip():
            print(result.stderr)

        return None

    output = result.stdout.strip()

    # OCR script may print logs before JSON.
    # Find the beginning of the JSON array.
    json_start = output.find("[")

    if json_start == -1:

        print(
            f"No JSON OCR result found for: "
            f"{image_path.name}"
        )

        return None

    json_output = output[json_start:]

    try:

        return json.loads(json_output)

    except json.JSONDecodeError:

        print(
            f"Could not parse JSON OCR result for: "
            f"{image_path.name}"
        )

        return None


# ============================================================
# RUN ITEM DETECTOR
# ============================================================

def run_item_detector(batch_result_path):
    """
    Run item_detector.py using the existing
    batch_ocr_result.json.
    """

    script_path = (
        Path(__file__).parent /
        "item_detector.py"
    )

    result = subprocess.run(
        [
            sys.executable,
            str(script_path),
            str(batch_result_path)
        ],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:

        print("Item Detector failed.")

        if result.stderr.strip():
            print(result.stderr)

        return None

    output = result.stdout.strip()

    try:

        return json.loads(output)

    except json.JSONDecodeError:

        print("Could not parse Item Detector result.")

        print(output)

        return None


# ============================================================
# FLATTEN OCR
# ============================================================

def flatten_ocr(batch_data):
    """
    Flatten OCR from all images in batch_ocr_result.json.

    This happens only in memory.

    No combined JSON file is created.
    """

    all_ocr = []

    for image in batch_data.get("images", []):

        image_name = image.get(
            "file",
            "unknown"
        )

        for item in image.get("ocr", []):

            ocr_item = dict(item)

            # Keep source image information
            ocr_item["source_image"] = image_name

            all_ocr.append(ocr_item)

    return all_ocr


# ============================================================
# RUN RULE ENGINE
# ============================================================

def run_rule_engine(
    detection,
    batch_data
):
    """
    Run the existing Backend/src/rule-engine.js directly.

    Item Detector provides:
    - category
    - subcategory

    Batch OCR provides:
    - OCR data from all images

    No extra JSON file is created.
    """

    # --------------------------------------------------------
    # Locate the EXISTING rule-engine.js
    # --------------------------------------------------------

    project_root = Path(__file__).parent.parent

    rule_engine_script = (
        project_root /
        "Backend" /
        "src" /
        "rule-engine.js"
    )

    if not rule_engine_script.exists():

        print("Rule Engine not found:")
        print(rule_engine_script)

        return None

    # --------------------------------------------------------
    # Prepare Rule Engine input
    # --------------------------------------------------------

    rule_engine_input = {
        "category": detection.get("category"),
        "subcategory": detection.get("subcategory"),
        "imported": False,
        "ocr": flatten_ocr(batch_data)
    }

    # --------------------------------------------------------
    # Node code
    #
    # Directly imports the existing
    # Backend/src/rule-engine.js
    # --------------------------------------------------------

    node_code = """
const fs = require("fs");

const ruleEnginePath = process.argv[1];

const {
    runRuleEngine
} = require(ruleEnginePath);

const input = JSON.parse(
    fs.readFileSync(0, "utf-8")
);

const result = runRuleEngine(input);

console.log(
    JSON.stringify(result, null, 2)
);

if (!result.success) {
    process.exit(1);
}
"""

    # --------------------------------------------------------
    # Run existing Rule Engine
    # --------------------------------------------------------

    print()
    print("Running Rule Engine...")

    print(
        f"Using: {rule_engine_script}"
    )

    result = subprocess.run(
        [
            "node",
            "-e",
            node_code,
            str(rule_engine_script)
        ],
        input=json.dumps(
            rule_engine_input,
            ensure_ascii=False
        ),
        capture_output=True,
        text=True
    )

    # --------------------------------------------------------
    # Handle Rule Engine result
    # --------------------------------------------------------

    if result.returncode != 0:

        print()
        print("Rule Engine failed.")

        if result.stderr.strip():
            print(result.stderr)

        return None

    print()
    print("=" * 60)
    print("RULE ENGINE")
    print("=" * 60)

    print(result.stdout)

    print("=" * 60)

    # --------------------------------------------------------
    # Convert Node JSON string into Python dictionary
    #
    # This is important because the next stage
    # (Gemini + PDF generation) needs the actual object.
    # --------------------------------------------------------

    try:

        return json.loads(
            result.stdout
        )

    except json.JSONDecodeError:

        print(
            "Could not parse Rule Engine result."
        )

        return None


# ============================================================
# RUN GEMINI + PDF REPORT GENERATION
# ============================================================

def run_report_generation(
    rule_engine_result,
    detection,
    product_folder,
    images_processed
):
    """
    Send the actual Rule Engine result and Item Detector result
    to generate-report.js.

    generate-report.js will:
    1. Send the Rule Engine result to Gemini.
    2. Generate the final PDF using PDFKit.

    No intermediate JSON input file is created.
    """

    project_root = Path(__file__).parent.parent

    report_script = (
        project_root /
        "Backend" /
        "src" /
        "generate-report.js"
    )

    if not report_script.exists():

        print()
        print(
            "Report generator not found:"
        )

        print(report_script)

        return None

    print()
    print("=" * 60)
    print("GEMINI + PDF GENERATION")
    print("=" * 60)

    # --------------------------------------------------------
    # Prepare report input
    #
    # This is kept in memory and sent through stdin.
    #
    # NO rule_engine_input.json is created.
    # --------------------------------------------------------

    report_input = {
        "ruleEngineResult": rule_engine_result,
        "detection": detection,
        "productFolder": str(product_folder),
        "imagesProcessed": images_processed
    }

    # --------------------------------------------------------
    # Run generate-report.js
    # --------------------------------------------------------

    result = subprocess.run(
        [
            "node",
            str(report_script)
        ],
        input=json.dumps(
            report_input,
            ensure_ascii=False
        ),
        capture_output=True,
        text=True
    )

    # --------------------------------------------------------
    # Handle report generation result
    # --------------------------------------------------------

    if result.returncode != 0:

        print()
        print(
            "Gemini / PDF generation failed."
        )

        if result.stderr.strip():
            print(result.stderr)

        return None

    print()

    if result.stdout.strip():
        print(result.stdout)

    print("=" * 60)

    return True


# ============================================================
# DISPLAY ITEM DETECTION
# ============================================================

def display_item_detection(detection):
    """
    Display Item Detector result.
    """

    print()
    print("=" * 60)
    print("ITEM DETECTION")
    print("=" * 60)

    if not detection:

        print(
            "No Item Detector result available."
        )

        print("=" * 60)

        return

    if not detection.get(
        "detected",
        False
    ):

        print(
            "Product       : Not detected"
        )

        print(
            "Message       : "
            + detection.get(
                "message",
                "Unknown error"
            )
        )

        print("=" * 60)

        return

    product = detection.get(
        "product",
        "Unknown"
    )

    category = detection.get(
        "category",
        "Unknown"
    )

    subcategory = detection.get(
        "subcategory",
        "Unknown"
    )

    confidence = detection.get(
        "confidence",
        0
    )

    evidence_count = detection.get(
        "evidence_count",
        0
    )

    supporting_images = detection.get(
        "supporting_images",
        []
    )

    print(
        f"Product       : {product}"
    )

    print(
        f"Category      : {category}"
    )

    print(
        f"Subcategory   : {subcategory}"
    )

    print(
        f"Confidence    : "
        f"{confidence * 100:.1f}%"
    )

    print(
        f"Evidence      : "
        f"{evidence_count} regions"
    )

    if supporting_images:

        print(
            "Images        : "
            + ", ".join(
                supporting_images
            )
        )

    print("=" * 60)


# ============================================================
# PROCESS PRODUCT FOLDER
# ============================================================

def process_folder(folder_path):

    folder = Path(folder_path)

    # --------------------------------------------------------
    # Validate folder
    # --------------------------------------------------------

    if not folder.exists():

        print(
            f"Folder not found: {folder}"
        )

        return

    if not folder.is_dir():

        print(
            f"Not a folder: {folder}"
        )

        return

    # --------------------------------------------------------
    # Find supported images
    # --------------------------------------------------------

    image_files = sorted(
        [
            file
            for file in folder.iterdir()
            if file.suffix.lower()
            in IMAGE_EXTENSIONS
        ]
    )

    if not image_files:

        print(
            "No supported images found "
            "in the folder."
        )

        return

    # --------------------------------------------------------
    # BATCH OCR
    # --------------------------------------------------------

    print("=" * 60)
    print("BATCH OCR")
    print("=" * 60)

    print(
        f"Product folder : "
        f"{folder.name}"
    )

    print(
        f"Images found   : "
        f"{len(image_files)}"
    )

    print()

    all_results = []

    # --------------------------------------------------------
    # Process every image
    # --------------------------------------------------------

    for index, image_path in enumerate(
        image_files,
        start=1
    ):

        print(
            f"[{index}/{len(image_files)}] "
            f"Processing: "
            f"{image_path.name}"
        )

        ocr_result = run_ocr(
            image_path
        )

        if ocr_result is None:

            continue

        all_results.append(
            {
                "file": image_path.name,
                "ocr": ocr_result
            }
        )

        print(
            f"    Detected text regions: "
            f"{len(ocr_result)}"
        )

    # --------------------------------------------------------
    # Check whether OCR processed anything
    # --------------------------------------------------------

    if not all_results:

        print()
        print(
            "No images were successfully "
            "processed by OCR."
        )

        return

    # --------------------------------------------------------
    # SAVE BATCH OCR RESULT
    # --------------------------------------------------------

    output_data = {
        "product_folder": folder.name,
        "images_processed": len(
            all_results
        ),
        "images": all_results
    }

    output_path = (
        folder /
        "batch_ocr_result.json"
    )

    with open(
        output_path,
        "w",
        encoding="utf-8"
    ) as file:

        json.dump(
            output_data,
            file,
            indent=2,
            ensure_ascii=False
        )

    print()
    print("=" * 60)
    print("BATCH OCR COMPLETE")
    print("=" * 60)

    print(
        f"Images processed : "
        f"{len(all_results)}"
    )

    print(
        f"Result saved to  : "
        f"{output_path}"
    )

    print("=" * 60)

    # --------------------------------------------------------
    # ITEM DETECTOR
    # --------------------------------------------------------

    print()
    print("Running Item Detector...")

    detection = run_item_detector(
        output_path
    )

    display_item_detection(
        detection
    )

    # --------------------------------------------------------
    # Stop if Item Detector failed
    # --------------------------------------------------------

    if not detection:

        return

    # --------------------------------------------------------
    # Stop if product was not detected
    # --------------------------------------------------------

    if not detection.get(
        "detected",
        False
    ):

        print(
            "Rule Engine skipped because "
            "the product could not be detected."
        )

        return

    # --------------------------------------------------------
    # RULE ENGINE
    # --------------------------------------------------------

    rule_engine_result = run_rule_engine(
        detection,
        output_data
    )

    # --------------------------------------------------------
    # Stop if Rule Engine failed
    # --------------------------------------------------------

    if not rule_engine_result:

        print(
            "Report generation skipped because "
            "Rule Engine did not return a valid result."
        )

        return

    # --------------------------------------------------------
    # GEMINI + PDF REPORT
    # --------------------------------------------------------

    run_report_generation(
        rule_engine_result,
        detection,
        folder,
        len(all_results)
    )


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    if len(sys.argv) != 2:

        print(
            "Usage:\n"
            "python ocr-service/batch_ocr.py "
            "ocr-service/test-products/product-1"
        )

        sys.exit(1)

    process_folder(
        sys.argv[1]
    )