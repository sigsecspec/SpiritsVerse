from pathlib import Path

from PIL import Image

public_dir = Path(__file__).resolve().parent.parent / "public"
sizes = (16, 32, 48)
images = [Image.open(public_dir / f"favicon-{size}.png") for size in sizes]
images[0].save(
    public_dir / "favicon.ico",
    format="ICO",
    sizes=[(size, size) for size in sizes],
    append_images=images[1:],
)
