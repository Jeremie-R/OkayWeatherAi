#!/usr/bin/env python3
"""
Convert the app's weather icon SVGs into Android vector drawables.

The widget can't load SVGs, so every icon the widget may show has to exist as
a VectorDrawable. The three packs come from different tools and use different
subsets of SVG, so this handles all of it in one place:

  modern  - paths + linear gradients
  candy   - paths, circles, <use>, radial gradients with a gradientTransform
  classic - Illustrator output: <style> classes, <g>, circles, rects,
            polygons, and gradients that inherit via xlink:href

Run it again whenever the SVGs change:

    python3 tools/svg_to_vector.py

Known approximation: SVG radial gradients carry a full transform, so they can
be ellipses. Android's <gradient> only has centerX/centerY/gradientRadius — a
circle. The radius used here is r * sqrt(|det A|) of the transform's linear
part, which preserves the gradient's area. On a two-stop shade at icon size
the difference isn't visible.
"""

from __future__ import annotations

import math
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

SVG = "{http://www.w3.org/2000/svg}"
XLINK = "{http://www.w3.org/1999/xlink}"

ROOT = Path(__file__).resolve().parent.parent
PACKS = {
    "modern": ROOT / "src/assets/weather-icons-modern",
    "candy": ROOT / "src/assets/weather-icons-candy",
    "classic": ROOT / "src/assets/weather-icons-classic",
}
OUT_DIR = ROOT / "android/app/src/main/res/drawable"
ICON_DP = 24

# The few CSS colour names these files actually use.
NAMED = {
    "white": "#ffffff",
    "black": "#000000",
    "aqua": "#00ffff",
    "red": "#ff0000",
    "none": None,
}


# --------------------------------------------------------------------------
# colour helpers
# --------------------------------------------------------------------------
def to_argb(color: str | None, opacity: float = 1.0) -> str | None:
    """CSS colour -> #AARRGGBB, or None for 'none'."""
    if color is None:
        return None
    c = color.strip().lower()
    c = NAMED.get(c, c)
    if c is None:
        return None
    if c.startswith("#"):
        if len(c) == 4:
            c = "#" + "".join(ch * 2 for ch in c[1:])
        if len(c) != 7:
            raise ValueError(f"unsupported colour {color!r}")
    else:
        raise ValueError(f"unsupported colour {color!r}")
    alpha = round(max(0.0, min(1.0, opacity)) * 255)
    return f"#{alpha:02X}{c[1:].upper()}"


# --------------------------------------------------------------------------
# transforms
# --------------------------------------------------------------------------
def parse_transform(text: str | None) -> tuple[float, float, float, float, float, float]:
    """SVG transform list -> affine (a, b, c, d, e, f); x' = ax + cy + e."""
    m = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    if not text:
        return m
    for name, args in re.findall(r"(\w+)\s*\(([^)]*)\)", text):
        v = [float(x) for x in re.split(r"[\s,]+", args.strip()) if x]
        if name == "translate":
            t = (1, 0, 0, 1, v[0], v[1] if len(v) > 1 else 0)
        elif name == "scale":
            t = (v[0], 0, 0, v[1] if len(v) > 1 else v[0], 0, 0)
        elif name == "rotate":
            r = math.radians(v[0])
            t = (math.cos(r), math.sin(r), -math.sin(r), math.cos(r), 0, 0)
            if len(v) == 3:  # rotate about a point
                t = mul(mul((1, 0, 0, 1, v[1], v[2]), t), (1, 0, 0, 1, -v[1], -v[2]))
        elif name == "matrix":
            t = tuple(v[:6])
        else:
            raise ValueError(f"unsupported transform {name!r}")
        m = mul(m, t)
    return m


def mul(m: tuple, n: tuple) -> tuple:
    a, b, c, d, e, f = m
    a2, b2, c2, d2, e2, f2 = n
    return (
        a * a2 + c * b2,
        b * a2 + d * b2,
        a * c2 + c * d2,
        b * c2 + d * d2,
        a * e2 + c * f2 + e,
        b * e2 + d * f2 + f,
    )


def apply(m: tuple, x: float, y: float) -> tuple[float, float]:
    a, b, c, d, e, f = m
    return (a * x + c * y + e, b * x + d * y + f)


def scale_of(m: tuple) -> float:
    """Area-preserving scalar for the linear part."""
    a, b, c, d = m[:4]
    return math.sqrt(abs(a * d - b * c)) or 1.0


# --------------------------------------------------------------------------
# shapes -> pathData
# --------------------------------------------------------------------------
def num(v: float) -> str:
    return f"{v:.4f}".rstrip("0").rstrip(".") or "0"


def circle_path(cx: float, cy: float, r: float) -> str:
    return (
        f"M{num(cx - r)},{num(cy)}"
        f"A{num(r)},{num(r)} 0 1,0 {num(cx + r)},{num(cy)}"
        f"A{num(r)},{num(r)} 0 1,0 {num(cx - r)},{num(cy)}Z"
    )


def rect_path(x: float, y: float, w: float, h: float, rx: float, ry: float) -> str:
    if rx <= 0 and ry <= 0:
        return f"M{num(x)},{num(y)}H{num(x + w)}V{num(y + h)}H{num(x)}Z"
    rx = rx or ry
    ry = ry or rx
    rx, ry = min(rx, w / 2), min(ry, h / 2)
    return (
        f"M{num(x + rx)},{num(y)}"
        f"H{num(x + w - rx)}A{num(rx)},{num(ry)} 0 0,1 {num(x + w)},{num(y + ry)}"
        f"V{num(y + h - ry)}A{num(rx)},{num(ry)} 0 0,1 {num(x + w - rx)},{num(y + h)}"
        f"H{num(x + rx)}A{num(rx)},{num(ry)} 0 0,1 {num(x)},{num(y + h - ry)}"
        f"V{num(y + ry)}A{num(rx)},{num(ry)} 0 0,1 {num(x + rx)},{num(y)}Z"
    )


def points_path(points: str) -> str:
    v = [float(x) for x in re.split(r"[\s,]+", points.strip()) if x]
    pairs = list(zip(v[0::2], v[1::2]))
    head = f"M{num(pairs[0][0])},{num(pairs[0][1])}"
    rest = "".join(f"L{num(x)},{num(y)}" for x, y in pairs[1:])
    return head + rest + "Z"


# --------------------------------------------------------------------------
# document
# --------------------------------------------------------------------------
class Doc:
    def __init__(self, path: Path):
        self.path = path
        self.root = ET.parse(path).getroot()
        self.gradients: dict[str, ET.Element] = {}
        self.by_id: dict[str, ET.Element] = {}
        self.classes: dict[str, dict[str, str]] = {}
        self._index(self.root)
        self._read_styles()

    def _index(self, el: ET.Element) -> None:
        for child in el:
            tag = child.tag.replace(SVG, "")
            ident = child.get("id")
            if ident:
                self.by_id[ident] = child
                if tag in ("linearGradient", "radialGradient"):
                    self.gradients[ident] = child
            self._index(child)

    def _read_styles(self) -> None:
        for style in self.root.iter(SVG + "style"):
            for sel, body in re.findall(r"\.([\w-]+)\s*\{([^}]*)\}", style.text or ""):
                decls = {}
                for decl in body.split(";"):
                    if ":" in decl:
                        k, v = decl.split(":", 1)
                        decls[k.strip()] = v.strip()
                self.classes[sel] = decls

    def viewbox(self) -> tuple[float, float]:
        vb = [float(v) for v in re.split(r"[\s,]+", self.root.get("viewBox").strip())]
        return vb[2], vb[3]

    def stops(self, grad: ET.Element) -> list[ET.Element]:
        """Stops, following xlink:href inheritance when a gradient has none."""
        own = grad.findall(SVG + "stop")
        if own:
            return own
        href = grad.get(XLINK + "href") or grad.get("href")
        if href and href.startswith("#") and href[1:] in self.gradients:
            return self.stops(self.gradients[href[1:]])
        return []

    def inherited(self, grad: ET.Element, attr: str) -> str | None:
        if grad.get(attr) is not None:
            return grad.get(attr)
        href = grad.get(XLINK + "href") or grad.get("href")
        if href and href.startswith("#") and href[1:] in self.gradients:
            return self.inherited(self.gradients[href[1:]], attr)
        return None


def fill_of(doc: Doc, el: ET.Element, inherited: str | None) -> str | None:
    """Resolve an element's fill: attribute, then CSS class, then inherited."""
    fill = el.get("fill")
    if fill is None:
        for cls in (el.get("class") or "").split():
            decls = doc.classes.get(cls, {})
            if "fill" in decls:
                fill = decls["fill"]
                break
    return fill if fill is not None else inherited


def gradient_xml(doc: Doc, grad: ET.Element, indent: str) -> list[str]:
    kind = grad.tag.replace(SVG, "")
    stops = dedupe(doc.stops(grad))
    if len(stops) < 2:
        # Android needs at least two stops; duplicate a lone one.
        stops = stops * 2
    tx = parse_transform(doc.inherited(grad, "gradientTransform"))

    out = [f'{indent}<aapt:attr name="android:fillColor">']
    if kind == "linearGradient":
        x1 = float(doc.inherited(grad, "x1") or 0)
        y1 = float(doc.inherited(grad, "y1") or 0)
        x2 = float(doc.inherited(grad, "x2") or 1)
        y2 = float(doc.inherited(grad, "y2") or 0)
        sx, sy = apply(tx, x1, y1)
        ex, ey = apply(tx, x2, y2)
        out.append(
            f'{indent}  <gradient android:type="linear" android:startX="{num(sx)}" '
            f'android:startY="{num(sy)}" android:endX="{num(ex)}" android:endY="{num(ey)}">'
        )
    else:
        cx = float(doc.inherited(grad, "cx") or 0)
        cy = float(doc.inherited(grad, "cy") or 0)
        r = float(doc.inherited(grad, "r") or 0.5)
        ccx, ccy = apply(tx, cx, cy)
        radius = r * scale_of(tx)
        out.append(
            f'{indent}  <gradient android:type="radial" android:centerX="{num(ccx)}" '
            f'android:centerY="{num(ccy)}" android:gradientRadius="{num(radius)}">'
        )
    for i, stop in enumerate(stops):
        raw = stop.get("offset", "0" if i == 0 else "1")
        offset = float(raw[:-1]) / 100 if raw.endswith("%") else float(raw)
        color = to_argb(stop.get("stop-color", "#000000"), float(stop.get("stop-opacity", 1)))
        out.append(f'{indent}    <item android:offset="{num(offset)}" android:color="{color}" />')
    out.append(f"{indent}  </gradient>")
    out.append(f"{indent}</aapt:attr>")
    return out


def dedupe(stops: list[ET.Element]) -> list[ET.Element]:
    """
    Drop stops that repeat an offset. Illustrator and Figma both emit a
    trailing <stop offset="1"/> with no stop-color, which SVG treats as black
    but which only applies at the single end point, so it is invisible on the
    web. Android would blend into it, turning the ramp's end black.
    """
    seen: set[str] = set()
    kept = []
    for i, stop in enumerate(stops):
        offset = stop.get("offset", "0" if i == 0 else "1")
        if offset in seen:
            continue
        seen.add(offset)
        kept.append(stop)
    return kept


def emit(doc: Doc, el: ET.Element, inherited_fill: str | None, out: list[str]) -> None:
    """Walk the tree in document order, appending <path> entries."""
    tag = el.tag.replace(SVG, "")

    if tag == "use":
        href = el.get(XLINK + "href") or el.get("href") or ""
        target = doc.by_id.get(href.lstrip("#"))
        if target is None:
            raise ValueError(f"{doc.path.name}: <use> target {href!r} not found")
        # The <use>'s own fill wins over the referenced element's.
        emit(doc, target, fill_of(doc, el, inherited_fill), out)
        return

    if tag in ("defs", "style", "title", "desc"):
        return

    if tag in ("svg", "g"):
        if el.get("transform"):
            raise ValueError(f"{doc.path.name}: transform on <{tag}> is not supported")
        fill = fill_of(doc, el, inherited_fill)
        for child in el:
            emit(doc, child, fill, out)
        return

    if tag == "path":
        data = re.sub(r"\s+", " ", (el.get("d") or "").strip())
    elif tag == "circle":
        data = circle_path(float(el.get("cx", 0)), float(el.get("cy", 0)), float(el.get("r", 0)))
    elif tag == "rect":
        data = rect_path(
            float(el.get("x", 0)), float(el.get("y", 0)),
            float(el.get("width", 0)), float(el.get("height", 0)),
            float(el.get("rx", 0) or 0), float(el.get("ry", 0) or 0),
        )
    elif tag in ("polygon", "polyline"):
        data = points_path(el.get("points", ""))
    else:
        raise ValueError(f"{doc.path.name}: unsupported element <{tag}>")

    if not data:
        return

    fill = fill_of(doc, el, inherited_fill)
    if fill is None or fill.strip().lower() == "none":
        return

    fill_type = ' android:fillType="evenOdd"' if el.get("fill-rule") == "evenodd" else ""
    ref = re.match(r"url\(#(.+)\)", fill.strip())
    if ref:
        grad = doc.gradients.get(ref.group(1))
        if grad is None:
            raise ValueError(f"{doc.path.name}: gradient {ref.group(1)!r} not found")
        out.append(f'    <path android:pathData="{data}"{fill_type}>')
        out.extend(gradient_xml(doc, grad, "        "))
        out.append("    </path>")
    else:
        out.append(
            f'    <path android:pathData="{data}" '
            f'android:fillColor="{to_argb(fill)}"{fill_type} />'
        )


def convert(path: Path, pack: str) -> str:
    doc = Doc(path)
    w, h = doc.viewbox()
    body: list[str] = []
    emit(doc, doc.root, None, body)
    # Intrinsic size is fixed rather than taken from the viewBox: the packs
    # are authored at 24, 40 and 200 units, and the widget sizes every icon
    # explicitly anyway. The viewport keeps each file's own coordinate space.
    header = [
        '<?xml version="1.0" encoding="utf-8"?>',
        "<!-- Generated by tools/svg_to_vector.py from",
        f"     src/assets/weather-icons-{pack}/{path.name}. Do not edit by hand. -->",
        '<vector xmlns:android="http://schemas.android.com/apk/res/android"',
        '    xmlns:aapt="http://schemas.android.com/aapt"',
        f'    android:width="{ICON_DP}dp"',
        f'    android:height="{ICON_DP}dp"',
        f'    android:viewportWidth="{num(w)}"',
        f'    android:viewportHeight="{num(h)}">',
    ]
    return "\n".join(header + body + ["</vector>", ""])


def main() -> int:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for stale in OUT_DIR.glob("wi_*.xml"):
        stale.unlink()

    total = 0
    for pack, src in PACKS.items():
        files = sorted(src.glob("*.svg"))
        if not files:
            print(f"!! no SVGs in {src}", file=sys.stderr)
            return 1
        for svg in files:
            out = OUT_DIR / f"wi_{pack}_{svg.stem}.xml"
            out.write_text(convert(svg, pack))
            total += 1
        print(f"{pack}: {len(files)} icons")
    print(f"wrote {total} drawables to {OUT_DIR.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
