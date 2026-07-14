"""Generate Oswan brand assets (favicon + OG)."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "public"
OUT.mkdir(exist_ok=True)

ACCENT = (200, 245, 74)  # #C8F54A
BG = (10, 10, 10)
WHITE = (255, 255, 255)
MUTED = (161, 161, 161)


def try_font(size: int):
    for name in (
        "C:/Windows/Fonts/malgunbd.ttf",
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def draw_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int):
    # Rounded square plate
    box = [cx - r, cy - r, cx + r, cy + r]
    draw.rounded_rectangle(box, radius=r // 3, fill=(30, 30, 30), outline=ACCENT, width=max(2, r // 16))
    # Inner squat stance stick hint
    s = r * 0.55
    # head
    draw.ellipse([cx - s * 0.22, cy - s * 0.85, cx + s * 0.22, cy - s * 0.42], outline=ACCENT, width=max(2, r // 18))
    # body + legs (A stance)
    draw.line([(cx, cy - s * 0.42), (cx, cy + s * 0.15)], fill=ACCENT, width=max(2, r // 16))
    draw.line([(cx, cy + s * 0.15), (cx - s * 0.55, cy + s * 0.85)], fill=ACCENT, width=max(2, r // 16))
    draw.line([(cx, cy + s * 0.15), (cx + s * 0.55, cy + s * 0.85)], fill=ACCENT, width=max(2, r // 16))
    draw.line([(cx, cy - s * 0.15), (cx - s * 0.5, cy + s * 0.2)], fill=ACCENT, width=max(2, r // 16))
    draw.line([(cx, cy - s * 0.15), (cx + s * 0.5, cy + s * 0.2)], fill=ACCENT, width=max(2, r // 16))


def favicon():
    size = 512
    img = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(img)
    draw_mark(d, size // 2, size // 2, 210)
    img.save(OUT / "favicon.png", optimize=True)
    img.resize((192, 192)).save(OUT / "icon-192.png", optimize=True)
    img.resize((512, 512)).save(OUT / "icon-512.png", optimize=True)


def og():
    w, h = 1200, 630
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    # atmosphere
    for i in range(8):
        alpha = 18 - i
        y0 = 80 + i * 40
        d.ellipse([200 - i * 30, y0, 1000 + i * 30, y0 + 420], outline=(30, 40, 12))

    draw_mark(d, 220, 315, 110)

    title = try_font(92)
    sub = try_font(36)
    tag = try_font(28)
    d.text((380, 200), "오스완", font=title, fill=WHITE)
    d.text((380, 310), "오늘 스쿼트 완료", font=sub, fill=ACCENT)
    d.text((380, 380), "목표 개수 채우고 · 친구에게 도전", font=tag, fill=MUTED)

    # challenge ribbon
    d.rounded_rectangle([380, 450, 720, 510], radius=16, fill=(30, 30, 30))
    d.text((410, 464), "CHALLENGE · 도전장", font=tag, fill=ACCENT)

    img.save(OUT / "og.png", optimize=True)
    img.save(OUT / "og-challenge.png", optimize=True)


def challenge_thumb_template():
    """Base card used as share preview lookalike (static)."""
    w, h = 1080, 1350
    img = Image.new("RGB", (w, h), BG)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle([60, 60, w - 60, h - 60], radius=48, fill=(21, 21, 21))
    draw_mark(d, w // 2, 220, 90)
    t1 = try_font(64)
    t2 = try_font(120)
    t3 = try_font(40)
    d.text((w // 2, 360), "오스완 도전장", font=t1, fill=WHITE, anchor="mm")
    d.text((w // 2, 520), "오늘 스쿼트 완료", font=t3, fill=ACCENT, anchor="mm")
    d.text((w // 2, 720), "30", font=t2, fill=WHITE, anchor="mm")
    d.text((w // 2, 840), "목표 개수", font=t3, fill=MUTED, anchor="mm")
    d.text((w // 2, 1100), "너도 오스완 할 수 있어?", font=t3, fill=MUTED, anchor="mm")
    img.save(OUT / "challenge-card.png", optimize=True)


if __name__ == "__main__":
    favicon()
    og()
    challenge_thumb_template()
    print("wrote brand assets to", OUT)
