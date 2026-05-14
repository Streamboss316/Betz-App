"""One-shot: generate the BETZ AuthPage hero image via Gemini Nano Banana."""
import asyncio
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

OUT_PATH = Path("/app/frontend/public/auth-bg.png")

PROMPT = (
    "Ultra cinematic photograph of two top-fuel drag racing dragsters at the staging line "
    "of a dragstrip at night, dramatic low-angle wide shot from in front of the cars looking "
    "down the track, both dragsters firing massive tire smoke and brief exhaust flames, "
    "long parallel lanes vanishing into the distance with a faint dashed center line, "
    "a tall illuminated christmas-tree staging-light tower between the two lanes with "
    "amber and bright green bulbs glowing, motion blur in the smoke, deep blacks, "
    "subtle ambient purple and gold rim-lighting on the cars and smoke, moody atmospheric "
    "fog, professional automotive photography, very high detail, 16:9 widescreen. "
    "IMPORTANT: absolutely NO text, NO logos, NO brand names, NO sponsor decals, NO league "
    "or sanctioning-body markings, NO writing on cars or banners — every surface must be "
    "blank or generic."
)


async def main() -> int:
    api_key = os.getenv("EMERGENT_LLM_KEY")
    if not api_key:
        print("ERROR: EMERGENT_LLM_KEY missing from /app/backend/.env")
        return 1

    chat = LlmChat(
        api_key=api_key,
        session_id="betz-auth-hero-v1",
        system_message="You generate ultra-realistic, brand-clean cinematic images. Never include text or logos.",
    ).with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])

    msg = UserMessage(text=PROMPT)
    text, images = await chat.send_message_multimodal_response(msg)
    print("Text response (preview):", (text or "")[:120])

    if not images:
        print("ERROR: no images returned")
        return 2

    img = images[0]
    print(f"Got image mime={img.get('mime_type')} preview={(img.get('data','')[:10])}...")
    image_bytes = base64.b64decode(img["data"])
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_bytes(image_bytes)
    print(f"Saved {len(image_bytes)} bytes -> {OUT_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
