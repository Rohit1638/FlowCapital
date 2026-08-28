from __future__ import annotations

import httpx

from app.core.config import get_settings
from app.services.ai.provider import AIProvider, AIResponse


class GeminiProvider(AIProvider):
    async def generate(self, system_prompt: str, user_prompt: str) -> AIResponse:
        settings = get_settings()
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY not configured")

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent?key={settings.gemini_api_key}"
        )
        payload = {
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
            "generationConfig": {"temperature": 0.35, "maxOutputTokens": 1200},
        }
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            return AIResponse(content=text.strip(), provider="gemini")
