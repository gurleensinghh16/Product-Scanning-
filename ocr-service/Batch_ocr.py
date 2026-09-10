import sys
import json
import subprocess
from pathlib import Path


# Supported image formats
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def run_ocr(image_path):
    """
    Run the existing ocr_test.py on one image
    and return its JSON result.
    """

    script_path = Path(__file__).parent / "ocr_test.py"

    result = subprocess.run(
        [sys.executable, str(script_path), str(image_path)],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"OCR failed for: {image_path.name}")
        print(result.stderr)
        return None

    output = result.stdout.strip()

    # ocr_test.py prints JSON as the final output.
    # Find the JSON array in the output.
    json_start = output.find("[")

    if json_start == -1:
        print(f"No JSON OCR result found for: {image_path.name}")
        return None

    json_output = output[json_start:]

    try:
        return json.loads(json_output)
    except json.JSONDecodeError:
        print(f"Could not parse OCR JSON for: {image_path.name}")
        return None


def process_folder(folder_path):
    folder = Path(folder_path)

    if not folder.exists():
        print(f"Folder not found: {folder}")
        return

    if not folder.is_dir():
        print(f"Not a folder: {folder}")
        return

    image_files = sorted(
        [
            file
            for file in folder.iterdir()
            if file.suffix.lower() in IMAGE_EXTENSIONS
        ]
    )

    if not image_files:
        print("No supported images found in the folder.")
        return

    print("=" * 60)
    print("BATCH OCR")
    print("=" * 60)
    print(f"Product folder : {folder.name}")
    print(f"Images found   : {len(image_files)}")
    print()

    all_results = []

    for index, image_path in enumerate(image_files, start=1):

        print(
            f"[{index}/{len(image_files)}] "
            f"Processing: {image_path.name}"
        )

        ocr_result = run_ocr(image_path)

        if ocr_result is None:
            continue

        all_results.append(
            {
                "file": image_path.name,
                "ocr": ocr_result
            }
        )

        print(
            f"    Detected text regions: {len(ocr_result)}"
        )

    output_data = {
        "product_folder": folder.name,
        "images_processed": len(all_results),
        "images": all_results
    }

    output_path = folder / "batch_ocr_result.json"

    with open(output_path, "w", encoding="utf-8") as file:
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
    print(f"Images processed : {len(all_results)}")
    print(f"Result saved to  : {output_path}")
    print("=" * 60)


if __name__ == "__main__":

    if len(sys.argv) != 2:
        print(
            "Usage:\n"
            "python ocr-service/batch_ocr.py "
            "ocr-service/test-products/product-1"
        )
        sys.exit(1)

    process_folder(sys.argv[1])