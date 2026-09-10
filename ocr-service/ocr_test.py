from paddleocr import PaddleOCR
import cv2
import json
import sys


# --------------------------------
# Configuration
# --------------------------------

MIN_OCR_CONFIDENCE = 0.60
MIN_SHARPNESS = 500


# --------------------------------
# Get image path
# --------------------------------

if len(sys.argv) < 2:
    print("ERROR: Image path not provided", file=sys.stderr)
    sys.exit(1)

image_path = sys.argv[1]


# --------------------------------
# Initialize PaddleOCR
# --------------------------------

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False
)


# --------------------------------
# Read image
# --------------------------------

image = cv2.imread(image_path)

if image is None:
    print("ERROR: Could not read image", file=sys.stderr)
    sys.exit(1)


# --------------------------------
# Run OCR
# --------------------------------

result = ocr.predict(image_path)


final_data = []


# --------------------------------
# Process EVERY OCR region
# --------------------------------

for res in result:

    texts = res["rec_texts"]
    scores = res["rec_scores"]
    boxes = res["rec_boxes"]

    for text, score, box in zip(texts, scores, boxes):

        confidence = float(score)

        x1, y1, x2, y2 = map(int, box)

        # ----------------------------
        # Crop OCR region
        # ----------------------------

        crop = image[y1:y2, x1:x2]

        if crop.size == 0:

            sharpness = 0
            quality = "POOR"

        else:

            # ----------------------------
            # Convert to grayscale
            # ----------------------------

            gray = cv2.cvtColor(
                crop,
                cv2.COLOR_BGR2GRAY
            )

            # ----------------------------
            # Laplacian variance
            # ----------------------------

            laplacian = cv2.Laplacian(
                gray,
                cv2.CV_64F
            )

            sharpness = float(laplacian.var())

            # ----------------------------
            # Quality classification
            # ----------------------------

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


        # ----------------------------
        # Store enriched OCR result
        # ----------------------------

        final_data.append({

            "text": text,

            "confidence": round(
                confidence,
                3
            ),

            "box": [
                x1,
                y1,
                x2,
                y2
            ],

            "sharpness": round(
                sharpness,
                2
            ),

            "quality": quality

        })


# --------------------------------
# Return ONE JSON result
# --------------------------------

print(
    json.dumps(
        final_data,
        ensure_ascii=False
    )
)