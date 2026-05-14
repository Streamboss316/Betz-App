"""Generate BETZ PWA app icons via Gemini Nano Banana, then resize to 192/512/favicon."""
import asyncio
import base64
import io
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

OUT_DIR = Path("/app/frontend/public")

PROMPT = (
    "Premium fintech-grade app icon for a P2P sports-betting app called BETZ. "
    "Square 1:1, centered composition, dark obsidian background (#0a0a0c). "
    "Bold stylized monogram 'B' rendered as a sleek geometric badge, "
    "filled with a rich purple-to-gold gradient (#a855f7 -> #c084fc -> #fbbf24 -> #f59e0b), "
    "subtle outer glow in soft purple, very thin gold rim. "
    "Behind the B, a faint silhouette of two parallel drag-strip lanes vanishing to the "
    "center with a tiny glowing christmas-tree staging-light tower in the middle — "
    "barely visible, abstract, geometric. Minimal, modern, ultra-clean, app-icon style. "
    "No text, no letters except the single 'B' monogram, no logos, no watermark. "
    "Should read clearly at 48x48."
)


async def main() -> int:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("ERROR: EMERGENT_LLM_KEY missing")
        return 1

    chat = (
        LlmChat(
            api_key=api_key,
            session_id="betz-pwa-icon-v1",
            system_message="You generate ultra-clean app icons. Never include text or words.",
        )
        .with_model("gemini", "gemini-3.1-flash-image-preview")
        .with_params(modalities=["image", "text"])
    )

    msg = UserMessage(text=PROMPT)
    _text, images = await chat.send_message_multimodal_response(msg)
    if not images:
        print("ERROR: no images returned")
        return 2

    img_bytes = base64.b64decode(images[0]["data"])
    img = Image.open(io.BytesIO(img_bytes)).convert("RGBA")
    # Center-crop to square
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = [
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("favicon.png", 64),
        ("apple-touch-icon.png", 180),
    ]
    for name, size in targets:
        resized = img.resize((size, size), Image.LANCZOS)
        out = OUT_DIR / name
        resized.save(out, "PNG", optimize=True)
        print(f"  wrote {out} ({size}x{size}, {out.stat().st_size} bytes)")

    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
