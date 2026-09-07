import json
import cv2


# -----------------------------
# Thresholds - temporary
# -----------------------------

MIN_OCR_CONFIDENCE = 0.60
MIN_SHARPNESS = 500


# -----------------------------
# Load OCR data
# -----------------------------

with open("ocr-service/ocr_data.json", "r") as file:
    ocr_data = json.load(file)


# -----------------------------
# Check each OCR region
# -----------------------------

for i, region in enumerate(ocr_data):

    text = region["text"]
    confidence = region["confidence"]
    crop_path = f"ocr-service/text_crops/crop_{i}.jpg"

    image = cv2.imread(crop_path)

    if image is None:
        print(f"Could not read crop: {crop_path}")
        continue

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Calculate sharpness
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = laplacian.var()


        # -----------------------------
    # Classify region
    # -----------------------------

    if confidence >= MIN_OCR_CONFIDENCE and sharpness >= MIN_SHARPNESS:
        quality = "GOOD"

    elif confidence >= MIN_OCR_CONFIDENCE or sharpness >= MIN_SHARPNESS:
        quality = "QUESTIONABLE"

    else:
        quality = "POOR"


    # -----------------------------
    # Display result
    # -----------------------------

    print("----------------------------------------")
    print(f"Region       : {i}")
    print(f"Text         : {text}")
    print(f"Confidence   : {confidence:.3f}")
    print(f"Sharpness    : {sharpness:.2f}")
    print(f"Quality      : {quality}")


print("----------------------------------------")
print("Region quality analysis completed.")