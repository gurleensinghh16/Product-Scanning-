import cv2
import json
import sys


MIN_OCR_CONFIDENCE = 0.60
MIN_SHARPNESS = 500


# --------------------------------
# Check arguments
# --------------------------------

if len(sys.argv) < 3:
    print("ERROR: Image path and OCR data path are required")
    sys.exit(1)


IMAGE_PATH = sys.argv[1]
OCR_DATA_PATH = sys.argv[2]


# --------------------------------
# Read OCR data
# --------------------------------

try:

    with open(
        OCR_DATA_PATH,
        "r",
        encoding="utf-8"
    ) as file:

        ocr_data = json.load(file)

except Exception as error:

    print(f"ERROR: Could not read OCR data: {error}")
    sys.exit(1)


# --------------------------------
# Read image
# --------------------------------

image = cv2.imread(IMAGE_PATH)

if image is None:
    print("ERROR: Could not read image")
    sys.exit(1)


validated_data = []


# --------------------------------
# Check EVERY OCR region
# --------------------------------

for index, region in enumerate(ocr_data):

    text = region["text"]
    confidence = float(region["confidence"])

    x1, y1, x2, y2 = region["box"]

    # Crop OCR region
    crop = image[y1:y2, x1:x2]

    if crop.size == 0:

        quality = "POOR"
        sharpness = 0

    else:

        # Convert crop to grayscale
        gray = cv2.cvtColor(
            crop,
            cv2.COLOR_BGR2GRAY
        )

        # Calculate Laplacian variance
        laplacian = cv2.Laplacian(
            gray,
            cv2.CV_64F
        )

        sharpness = laplacian.var()

        # --------------------------------
        # Quality decision
        # --------------------------------

        if (
            confidence >= MIN_OCR_CONFIDENCE
            and sharpness >= MIN_SHARPNESS
        ):

            quality = "GOOD"

        elif (
            confidence >= MIN_OCR_CONFIDENCE
            or sharpness >= MIN_SHARPNESS
        ):

            quality = "QUESTIONABLE"

        else:

            quality = "POOR"


    # --------------------------------
    # Save region result
    # --------------------------------

    validated_data.append({

        "text": text,

        "confidence": round(
            confidence,
            3
        ),

        "sharpness": round(
            float(sharpness),
            2
        ),

        "quality": quality,

        "box": [
            x1,
            y1,
            x2,
            y2
        ]

    })


# --------------------------------
# Return JSON to Node
# --------------------------------

print(
    json.dumps(
        validated_data,
        ensure_ascii=False
    )
)