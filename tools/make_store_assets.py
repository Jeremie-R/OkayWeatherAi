#!/usr/bin/env python3
"""
Build the Google Play listing graphics from the raw device captures.

    python3 tools/make_store_assets.py          # needs Pillow with FreeType

Inputs  : store/raw/*.png  - straight screencaps from a Pixel (1280x2856)
Outputs : store/*.png      - everything the Play Console asks for

Play's rules this script exists to satisfy (support.google.com/googleplay/
android-developer/answer/9866151):

  icon             512x512, 32-bit PNG *with* alpha
  feature graphic  1024x500, 24-bit PNG, no alpha
  screenshots      24-bit PNG, no alpha, 320..3840px a side, and the long
                   side at most twice the short side

That last rule is why the raw captures can't be uploaded as they are: a
Pixel screen is 1280x2856, which is 2.23:1. Each one is composed onto a
1080x1920 canvas (9:16) instead, which also meets the bar for Play's
"recommended" listing formats.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "store/raw"
OUT = ROOT / "store"
# gplay syncs the Play listing from this tree (see WORK.md). The Play-spec
# assets are written straight into it so there is exactly one copy of each;
# store/ keeps the raw captures and the README thumbnails.
META = ROOT / "metadata/en-US/images"

FONT = "/System/Library/Fonts/Avenir Next.ttc"
FACE_BOLD, FACE_DEMI, FACE_MEDIUM = 0, 2, 5

# Brand gradient, from the app icon.
BRAND_TOP = (185, 155, 201)
BRAND_BOTTOM = (131, 139, 197)

SHOT_W, SHOT_H = 1080, 1920
FEATURE_W, FEATURE_H = 1024, 500
THUMB_W = 420

# caption, and how much of the tall capture to keep.
# The widget shots are cropped to the top of the home screen: left whole, the
# widget is a speck at listing-thumbnail size.
SCREENSHOTS = [
    ("01-today.png", "Today, at a glance", None),
    ("02-widget-rain.png", "The widget knows\nwhen rain is coming", (0, 0, 1280, 1560)),
    ("03-day.png", "Hour by hour, any day", None),
    ("04-map.png", "Live rain radar", None),
    ("05-settings.png", "Three styles.\nThree icon sets.", None),
    ("06-widget-pill.png", "A quiet pill\nwhen it's dry", (0, 0, 1280, 1560)),
]


def font(size: int, face: int = FACE_DEMI) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(FONT, size, index=face)


def gradient(size: tuple[int, int], top: tuple, bottom: tuple, diagonal: bool = False) -> Image.Image:
    """Linear brand gradient, vertical or corner-to-corner."""
    w, h = size
    base = Image.new("RGB", size, top)
    overlay = Image.new("RGB", size, bottom)
    mask = Image.new("L", size)
    px = mask.load()
    for y in range(h):
        for x in range(0, w, 4):
            t = ((x / w) + (y / h)) / 2 if diagonal else y / h
            v = int(t * 255)
            for dx in range(4):
                if x + dx < w:
                    px[x + dx, y] = v
    base.paste(overlay, (0, 0), mask)
    return base


def rounded(img: Image.Image, radius: int) -> Image.Image:
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, img.width - 1, img.height - 1], radius, fill=255)
    out = img.convert("RGBA")
    out.putalpha(mask)
    return out


def drop_shadow(canvas: Image.Image, box: tuple[int, int, int, int], radius: int) -> None:
    """Soft shadow under a rounded rect, composited in place."""
    x, y, w, h = box
    pad = 60
    layer = Image.new("RGBA", (w + pad * 2, h + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(layer).rounded_rectangle(
        [pad, pad, pad + w, pad + h], radius, fill=(23, 20, 40, 150)
    )
    layer = layer.filter(ImageFilter.GaussianBlur(26))
    canvas.alpha_composite(layer, (x - pad, y - pad + 14))


def wrap(draw: ImageDraw.ImageDraw, text: str, f, max_w: int) -> list[str]:
    """Greedy word wrap to a pixel width, so copy can't run under the artwork."""
    lines: list[str] = []
    words = text.split()
    line = ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textbbox((0, 0), trial, font=f)[2] <= max_w or not line:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def centered_text(
    draw: ImageDraw.ImageDraw, text: str, cx: int, top: int, f, fill, spacing: int
) -> int:
    """Draw centred, possibly multi-line text. Returns the bottom y."""
    y = top
    for line in text.split("\n"):
        w = draw.textbbox((0, 0), line, font=f)[2]
        draw.text((cx - w // 2, y), line, font=f, fill=fill)
        y += spacing
    return y


def build_screenshot(index: int, name: str, caption: str, crop: tuple | None) -> Path:
    shot = Image.open(RAW / name).convert("RGB")
    if crop:
        shot = shot.crop(crop)

    canvas = gradient((SHOT_W, SHOT_H), BRAND_TOP, BRAND_BOTTOM).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    lines = caption.count("\n") + 1
    f = font(62, FACE_DEMI)
    cap_bottom = centered_text(draw, caption, SHOT_W // 2, 96, f, (255, 255, 255), 78)

    # Fit the capture into what's left, leaving a margin all round.
    top = cap_bottom + (70 if lines > 1 else 56)
    avail_h = SHOT_H - top - 90
    avail_w = SHOT_W - 160
    scale = min(avail_w / shot.width, avail_h / shot.height)
    size = (round(shot.width * scale), round(shot.height * scale))
    shot = shot.resize(size, Image.LANCZOS)

    x = (SHOT_W - size[0]) // 2
    radius = 44
    drop_shadow(canvas, (x, top, size[0], size[1]), radius)
    canvas.alpha_composite(rounded(shot, radius), (x, top))

    out = META / "phoneScreenshots" / f"{index}.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, optimize=True)
    return out


def build_feature_graphic() -> Path:
    canvas = gradient((FEATURE_W, FEATURE_H), BRAND_TOP, BRAND_BOTTOM, diagonal=True).convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    pill_size = 320
    pill_x = FEATURE_W - pill_size - 44
    left = 72
    text_w = pill_x - left - 40  # keep clear of the artwork

    title_f = font(74, FACE_BOLD)
    body_f = font(28, FACE_MEDIUM)
    body = wrap(
        draw,
        "Honest forecasts, and a home-screen widget that reshapes when rain is coming.",
        body_f,
        text_w,
    )

    block_h = 92 + 14 + len(body) * 40
    y = (FEATURE_H - block_h) // 2
    draw.text((left, y), "Okay Weather", font=title_f, fill=(255, 255, 255))
    y += 92 + 14
    for line in body:
        draw.text((left + 2, y), line, font=body_f, fill=(255, 255, 255, 225))
        y += 40

    pill = Image.open(ROOT / "android/app/src/main/res/drawable-nodpi/widget_preview.png")
    pill = pill.convert("RGBA").resize((pill_size, pill_size), Image.LANCZOS)
    canvas.alpha_composite(pill, (pill_x, (FEATURE_H - pill_size) // 2))

    out = META / "featureGraphic.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(out, optimize=True)
    return out


def build_readme_thumbs() -> list[Path]:
    """Small versions for the README — the raw captures are megabytes each."""
    out_dir = OUT / "readme"
    out_dir.mkdir(parents=True, exist_ok=True)
    made = []
    for name, _, crop in SCREENSHOTS:
        img = Image.open(RAW / name).convert("RGB")
        if crop:
            img = img.crop(crop)
        scale = THUMB_W / img.width
        img = img.resize((THUMB_W, round(img.height * scale)), Image.LANCZOS)
        out = out_dir / name
        img.save(out, optimize=True)
        made.append(out)
    return made


def build_icon() -> Path:
    # Play wants 32-bit with an alpha channel, even though ours is opaque.
    icon = Image.open(ROOT / "public/icon-512.png").convert("RGBA")
    if icon.size != (512, 512):
        icon = icon.resize((512, 512), Image.LANCZOS)
    out = META / "icon.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    icon.save(out, optimize=True)
    return out


def main() -> int:
    if not RAW.exists():
        print(f"missing {RAW}", file=sys.stderr)
        return 1
    OUT.mkdir(parents=True, exist_ok=True)

    made = [build_icon(), build_feature_graphic()]
    thumbs = build_readme_thumbs()
    for i, (name, caption, crop) in enumerate(SCREENSHOTS, start=1):
        if not (RAW / name).exists():
            print(f"!! missing capture {name}", file=sys.stderr)
            return 1
        made.append(build_screenshot(i, name, caption, crop))

    for path in made:
        w, h = Image.open(path).size
        # The 2:1 rule is a screenshot rule; the feature graphic is pinned at
        # 1024x500 by Play itself, which is wider than 2:1.
        flag = ""
        if "phoneScreenshots" in str(path) and max(w, h) > min(w, h) * 2:
            flag = "  <-- EXCEEDS PLAY'S 2:1 SCREENSHOT LIMIT"
        print(f"{path.relative_to(ROOT)}  {w}x{h}{flag}")
    print(f"store/readme/  {len(thumbs)} thumbnails at {THUMB_W}px wide")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
