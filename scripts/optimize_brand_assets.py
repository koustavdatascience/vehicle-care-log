from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path("/home/ubuntu/webdev-static-assets/vehicle-care-log-icon.png")
ASSET_DIRECTORY = PROJECT_ROOT / "assets" / "images"
TARGETS = {
    "icon.png": 1024,
    "splash-icon.png": 1024,
    "favicon.png": 512,
    "android-icon-foreground.png": 1024,
}
MAX_BYTES = 950_000


def optimize_icon(target: Path, maximum_side: int) -> int:
    with Image.open(SOURCE) as source:
        image = source.convert("RGB")
        image.thumbnail((maximum_side, maximum_side), Image.Resampling.LANCZOS)
        optimized = image.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
        optimized.save(target, format="PNG", optimize=True, compress_level=9)

    size = target.stat().st_size
    if size > MAX_BYTES:
        raise RuntimeError(f"{target.name} is {size} bytes, above the {MAX_BYTES}-byte checkpoint threshold.")
    return size


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Generated source icon is missing: {SOURCE}")

    for filename, maximum_side in TARGETS.items():
        target = ASSET_DIRECTORY / filename
        size = optimize_icon(target, maximum_side)
        print(f"{filename}: {size} bytes")


if __name__ == "__main__":
    main()
