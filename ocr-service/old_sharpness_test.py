import cv2
import json
import os

# Original image
image_path = "ocr-service/ocr_result.jpg"

# OCR data containing text boxes
ocr_data_path = "ocr-service/ocr_data.json"

# Folder to save cropped text regions
crop_folder = "ocr-service/text_crops"

os.makedirs(crop_folder, exist_ok=True)


# Read original image
image = cv2.imread(image_path)

if image is None:
    print("Could not read image.")
    exit()


# Read OCR data
with open(ocr_data_path, "r", encoding="utf-8") as file:
    ocr_data = json.load(file)


print(f"Found {len(ocr_data)} OCR regions.")
print()


for index, item in enumerate(ocr_data):

    text = item["text"]
    confidence = item["confidence"]
    x1, y1, x2, y2 = item["box"]

    # Crop the text region from ORIGINAL image
    crop = image[y1:y2, x1:x2]

    if crop.size == 0:
        print(f"Region {index}: invalid crop")
        continue

    # Convert crop to grayscale
    gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)

    # Calculate Laplacian
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)

    # Calculate sharpness
    sharpness = laplacian.var()

    # Save crop
    crop_path = os.path.join(
        crop_folder,
        f"crop_{index}.jpg"
    )

    cv2.imwrite(crop_path, crop)

    print(f"Region {index}")
    print(f"Text       : {text}")
    print(f"Confidence: {confidence}")
    print(f"Sharpness  : {sharpness:.2f}")
    print(f"Crop      : {crop_path}")
    print("-" * 50)