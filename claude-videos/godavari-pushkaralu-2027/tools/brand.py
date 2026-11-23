"""Make the channel branding from assets/the-ramu-swift-facts-logo.webp:

  build/brand/watermark.png  rounded corner badge for the top-right of every scene
  build/brand/endcard.png    1080x1920 end card with the logo centred
"""
import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "build", "brand")
os.makedirs(OUT, exist_ok=True)

img = Image.open(os.path.join(ROOT, "assets", "the-ramu-swift-facts-logo.webp")).convert("RGB")
a = np.asarray(img).astype(np.int32)
border = np.concatenate([a[:8].reshape(-1, 3), a[-8:].reshape(-1, 3), a[:, :8].reshape(-1, 3), a[:, -8:].reshape(-1, 3)])
bg = tuple(int(v) for v in np.median(border, axis=0))
diff = np.abs(a - np.array(bg)).sum(axis=2) > 60
ys, xs = np.where(diff)
x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
pad = int(0.09 * (x1 - x0))
crop = img.crop((max(0, x0 - pad), max(0, y0 - pad), min(img.width, x1 + pad), min(img.height, y1 + pad)))
print("background", bg, "logo box", (x0, y0, x1, y1), "crop", crop.size)


def rounded(im, radius, alpha=255):
    mask = Image.new("L", im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius=radius, fill=alpha)
    out = im.convert("RGBA")
    out.putalpha(mask)
    return out


# watermark badge
WM_W = 200
wm = crop.resize((WM_W, round(WM_W * crop.height / crop.width)), Image.LANCZOS)
badge = rounded(wm, 18, 235)
edge = Image.new("RGBA", badge.size, (0, 0, 0, 0))
ImageDraw.Draw(edge).rounded_rectangle([1, 1, badge.width - 2, badge.height - 2], radius=17, outline=(255, 255, 255, 60), width=2)
badge = Image.alpha_composite(badge, edge)
shadow = Image.new("RGBA", (badge.width + 24, badge.height + 24), (0, 0, 0, 0))
ImageDraw.Draw(shadow).rounded_rectangle([12, 14, badge.width + 12, badge.height + 14], radius=18, fill=(0, 0, 0, 110))
shadow = shadow.filter(ImageFilter.GaussianBlur(7))
shadow.alpha_composite(badge, (12, 12))
shadow.save(os.path.join(OUT, "watermark.png"))
print("watermark", shadow.size)

# end card: logo centred on its own background colour with a soft glow
W, H = 1080, 1920
card = Image.new("RGB", (W, H), bg)
yy, xx = np.mgrid[0:H, 0:W]
glow = np.exp(-(((xx - W / 2) / 520) ** 2 + ((yy - 900) / 620) ** 2))
arr = np.asarray(card).astype(np.float32) + glow[..., None] * np.array([18, 40, 38], dtype=np.float32)
card = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
LW = 920
logo = crop.resize((LW, round(LW * crop.height / crop.width)), Image.LANCZOS)
lm = np.asarray(logo).astype(np.int32)
alpha = np.clip((np.abs(lm - np.array(bg)).sum(axis=2) - 25) * 4, 0, 255).astype(np.uint8)
logo_rgba = logo.convert("RGBA")
logo_rgba.putalpha(Image.fromarray(alpha))
card = card.convert("RGBA")
card.alpha_composite(logo_rgba, ((W - LW) // 2, 900 - logo.height // 2))
card.convert("RGB").save(os.path.join(OUT, "endcard.png"))
print("endcard", card.size)
