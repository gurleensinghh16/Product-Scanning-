import sys
import json
import re
from pathlib import Path


# ============================================================
# ITEM DETECTION RULES
# ============================================================

ITEM_PATTERNS = {
    "biscuits": {
        "category": "food",
        "subcategory": "biscuits",
        "display_name": "Biscuits",
        "keywords": {
            "biscuits": 5,
            "biscuit": 5,
            "cookies": 4,
            "cookie": 4
        }
    },

    "tea": {
        "category": "food",
        "subcategory": "tea",
        "display_name": "Tea",
        "keywords": {
            "tea": 5,
            "tea leaves": 6,
            "tea leaf": 6,
            "chai": 4
        }
    },

    "coffee": {
        "category": "food",
        "subcategory": "coffee",
        "display_name": "Coffee",
        "keywords": {
            "coffee": 6
        }
    },

    "cereals_pulses": {
        "category": "food",
        "subcategory": "cereals_pulses",
        "display_name": "Cereals / Pulses",
        "keywords": {
            "cereal": 5,
            "cereals": 5,
            "pulses": 5,
            "dal": 4,
            "rice": 4,
            "wheat": 4
        }
    },

    "salt": {
        "category": "food",
        "subcategory": "salt",
        "display_name": "Salt",
        "keywords": {
            "iodised salt": 7,
            "iodized salt": 7,
            "salt": 5
        }
    },

    "spices": {
        "category": "food",
        "subcategory": "spices",
        "display_name": "Spices / Masala",
        "keywords": {
            "kitchen king masala": 10,
            "mixed masala powder": 9,
            "masala powder": 7,
            "masala": 6,
            "spices": 5,
            "spice": 5
        }
    },

    "soft_drink": {
        "category": "beverages_water",
        "subcategory": "soft_drink",
        "display_name": "Soft Drink",
        "keywords": {
            "diet coke": 10,
            "dietcoke": 10,
            "coca cola": 9,
            "coca-cola": 9,
            "coke": 8,
            "cola": 6,
            "soft drink": 7,
            "carbonated soft drink": 8,
            "carbonated": 4
        }
    },

    "non_alcoholic_beverage": {
        "category": "beverages_water",
        "subcategory": "non_alcoholic_beverage",
        "display_name": "Non-Alcoholic Beverage",
        "keywords": {
            "non alcoholic beverage": 7,
            "non-alcoholic beverage": 7,
            "beverage": 4
        }
    },

    "drinking_water": {
        "category": "beverages_water",
        "subcategory": "drinking_water",
        "display_name": "Drinking Water",
        "keywords": {
            "drinking water": 8
        }
    },

    "mineral_water": {
        "category": "beverages_water",
        "subcategory": "mineral_water",
        "display_name": "Mineral Water",
        "keywords": {
            "mineral water": 8
        }
    },

    "shampoo": {
        "category": "personal_care",
        "subcategory": "shampoo",
        "display_name": "Shampoo",
        "keywords": {
            "shampoo": 7
        }
    },

    "cream": {
        "category": "personal_care",
        "subcategory": "cream",
        "display_name": "Cream",
        "keywords": {
            "cream": 6
        }
    },

    "lotion": {
        "category": "personal_care",
        "subcategory": "lotion",
        "display_name": "Lotion",
        "keywords": {
            "lotion": 7
        }
    },

    "perfume": {
        "category": "personal_care",
        "subcategory": "perfume",
        "display_name": "Perfume",
        "keywords": {
            "perfume": 7,
            "fragrance": 5
        }
    },

    "soap": {
        "category": "personal_care",
        "subcategory": "soap",
        "display_name": "Soap",
        "keywords": {
            "soap": 7
        }
    }
}


# ============================================================
# NORMALIZATION
# ============================================================

def normalize(text):
    text = str(text).lower()

    # Make things like "Coca-Cola" and "Coca Cola" comparable
    text = re.sub(r"[^a-z0-9]+", " ", text)

    return re.sub(r"\s+", " ", text).strip()


# ============================================================
# READ BATCH OCR RESULT
# ============================================================

def extract_ocr_from_batch(batch_data):
    """
    Reads the existing batch_ocr_result.json structure.

    Expected structure:

    {
        "product_folder": "...",
        "images_processed": 3,
        "images": [
            {
                "file": "pic_1.jpg",
                "ocr": [...]
            },
            {
                "file": "pic_2.jpg",
                "ocr": [...]
            }
        ]
    }
    """

    all_ocr = []

    images = batch_data.get("images", [])

    for image in images:

        image_name = image.get("file", "unknown")

        ocr_results = image.get("ocr", [])

        for item in ocr_results:

            # Ignore only POOR quality
            if item.get("quality") == "POOR":
                continue

            ocr_item = dict(item)

            # Keep track of which image produced the evidence
            ocr_item["source_image"] = image_name

            all_ocr.append(ocr_item)

    return all_ocr


# ============================================================
# SCORE ONE OCR ITEM
# ============================================================

def calculate_match(keyword, text, confidence):

    keyword_normalized = normalize(keyword)
    text_normalized = normalize(text)

    if not keyword_normalized or not text_normalized:
        return 0

    # Exact match is strongest
    if keyword_normalized == text_normalized:
        return confidence * 1.5

    # Phrase contained inside OCR text
    if keyword_normalized in text_normalized:
        return confidence

    return 0


# ============================================================
# DETECT ITEM
# ============================================================

def detect(ocr_data):

    scores = {}
    evidence = {}

    for item in ocr_data:

        text = item.get("text", "").strip()

        if not text:
            continue

        confidence = float(item.get("confidence", 0))

        for item_type, config in ITEM_PATTERNS.items():

            for keyword, weight in config["keywords"].items():

                match_score = calculate_match(
                    keyword,
                    text,
                    confidence
                )

                if match_score <= 0:
                    continue

                score = match_score * weight

                if item_type not in scores:
                    scores[item_type] = 0
                    evidence[item_type] = []

                scores[item_type] += score

                evidence[item_type].append({
                    "text": text,
                    "keyword": keyword,
                    "confidence": confidence,
                    "sharpness": item.get("sharpness"),
                    "quality": item.get("quality"),
                    "source_image": item.get("source_image"),
                    "score": round(score, 3)
                })

    # --------------------------------------------------------
    # No item detected
    # --------------------------------------------------------

    if not scores:

        return {
            "success": True,
            "detected": False,
            "message": "Unable to confidently detect the product."
        }

    # --------------------------------------------------------
    # Highest scoring item
    # --------------------------------------------------------

    sorted_scores = sorted(
        scores.items(),
        key=lambda x: x[1],
        reverse=True
    )

    detected_item = sorted_scores[0][0]
    top_score = sorted_scores[0][1]

    config = ITEM_PATTERNS[detected_item]

    # --------------------------------------------------------
    # Calculate heuristic detection confidence
    # --------------------------------------------------------

    if len(sorted_scores) > 1:

        second_score = sorted_scores[1][1]

        score_ratio = (
            top_score /
            (top_score + second_score)
        )

        detection_confidence = (
            0.60 +
            (score_ratio * 0.35)
        )

    else:

        detection_confidence = 0.90

    detection_confidence = min(
        0.99,
        detection_confidence
    )

    # --------------------------------------------------------
    # Images supporting this detection
    # --------------------------------------------------------

    supporting_images = sorted(
        set(
            item["source_image"]
            for item in evidence[detected_item]
        )
    )

    # --------------------------------------------------------
    # Return result
    # --------------------------------------------------------

    return {
        "success": True,
        "detected": True,

        "product": config["display_name"],

        "category": config["category"],

        "subcategory": config["subcategory"],

        "confidence": round(
            detection_confidence,
            3
        ),

        "supporting_images": supporting_images,

        "evidence_count": len(
            evidence[detected_item]
        ),

        "evidence": evidence[detected_item],

        "all_scores": {
            key: round(value, 3)
            for key, value in sorted_scores
        }
    }


# ============================================================
# MAIN
# ============================================================

def main():

    if len(sys.argv) != 2:

        print(
            "Usage:\n"
            "python ocr-service/item_detector.py "
            "path/to/batch_ocr_result.json"
        )

        sys.exit(1)

    input_path = Path(sys.argv[1])

    if not input_path.exists():

        print(
            json.dumps(
                {
                    "success": False,
                    "message": f"File not found: {input_path}"
                },
                indent=2
            )
        )

        sys.exit(1)

    # --------------------------------------------------------
    # Load batch OCR JSON
    # --------------------------------------------------------

    with open(
        input_path,
        "r",
        encoding="utf-8"
    ) as file:

        batch_data = json.load(file)

    # --------------------------------------------------------
    # Extract OCR from all images
    # --------------------------------------------------------

    ocr_data = extract_ocr_from_batch(
        batch_data
    )

    # --------------------------------------------------------
    # Detect item
    # --------------------------------------------------------

    result = detect(
        ocr_data
    )

    # Add folder information
    result["product_folder"] = batch_data.get(
        "product_folder"
    )

    result["images_processed"] = batch_data.get(
        "images_processed",
        0
    )

    # --------------------------------------------------------
    # Print result
    # --------------------------------------------------------

    print(
        json.dumps(
            result,
            indent=2,
            ensure_ascii=False
        )
    )


if __name__ == "__main__":
    main()