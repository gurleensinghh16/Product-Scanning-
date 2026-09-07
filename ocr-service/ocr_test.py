from paddleocr import PaddleOCR
import cv2
import json

ocr = PaddleOCR(
    lang="en",
    use_doc_orientation_classify=False,
    use_doc_unwarping=False
)

image_path = "ocr-service/real-test.jpg"

result = ocr.predict(image_path)

image = cv2.imread(image_path)

ocr_data = []

for res in result:

    texts = res["rec_texts"]
    scores = res["rec_scores"]
    boxes = res["rec_boxes"]

    for text, score, box in zip(texts, scores, boxes):

        x1, y1, x2, y2 = map(int, box)

        # Save OCR information
        ocr_data.append({
            "text": text,
            "confidence": round(float(score), 3),
            "box": [x1, y1, x2, y2]
        })

        # Draw box on image
        cv2.rectangle(
            image,
            (x1, y1),
            (x2, y2),
            (0, 255, 0),
            3
        )

        # Draw detected text
        cv2.putText(
            image,
            text,
            (x1, max(y1 - 10, 20)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (0, 255, 0),
            2
        )


# Save annotated image
cv2.imwrite(
    "ocr-service/ocr_result.jpg",
    image
)


# Save OCR data as JSON
with open(
    "ocr-service/ocr_data.json",
    "w",
    encoding="utf-8"
) as file:

    json.dump(
        ocr_data,
        file,
        indent=4,
        ensure_ascii=False
    )


print("OCR completed.")
print("Result saved as: ocr-service/ocr_result.jpg")
print("OCR data saved as: ocr-service/ocr_data.json")
print(f"Detected text regions: {len(ocr_data)}")