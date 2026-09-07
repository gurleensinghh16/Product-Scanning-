import cv2
import json
import os

MIN_OCR_CONFIDENCE = 0.60
MIN_SHARPNESS = 500

IMAGE_PATH = "ocr-service/real-test.jpg"
OCR_DATA_PATH = "ocr-service/ocr_data.json"
OUTPUT_PATH = "ocr-service/validated_ocr.json"

with open(OCR_DATA_PATH, "r", encoding="utf-8") as file:
    ocr_data = json.load(file)

image = cv2.imread(IMAGE_PATH)

if image is None:
    print("Could not read image.")
    exit()

validated_data = []

for index, region in enumerate(ocr_data):

    text = region["text"]
    confidence = region["confidence"]

    x1, y1, x2, y2 = region["box"]

    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        quality = "POOR"
        sharpness = 0

    else:
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

        laplacian = cv2.Laplacian(
            gray,
            cv2.CV_64F
        )

        sharpness = laplacian.var()

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

    validated_data.append({
        "text": text,
        "confidence": round(float(confidence), 3),
        "sharpness": round(float(sharpness), 2),
        "quality": quality,
        "box": [x1, y1, x2, y2]
    })

    print("----------------------------------------")
    print(f"Region     : {index}")
    print(f"Text       : {text}")
    print(f"Confidence : {confidence:.3f}")
    print(f"Sharpness  : {sharpness:.2f}")
    print(f"Quality    : {quality}")

with open(
    OUTPUT_PATH,
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        validated_data,
        file,
        indent=4,
        ensure_ascii=False
    )

print("----------------------------------------")
print("Region quality analysis completed.")
print(f"Validated OCR saved to: {OUTPUT_PATH}")