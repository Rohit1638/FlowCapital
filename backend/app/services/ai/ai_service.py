from __future__ import annotations

import json
from typing import Any

from app.services.ai.gemini_provider import GeminiProvider
from app.services.ai.provider import AIProvider, AIResponse

SYSTEM_MANUFACTURER = """You are Flow Assistant for FlowCapital AI — a supply-chain financing platform.
You explain funding readiness, confidence, risks, and recommended actions for manufacturers.
NEVER invent financial numbers. Use ONLY the authoritative values provided in context.
You do not approve financing or authorize money movement.
Respond with concise structured sections when helpful: SUMMARY, KEY FACTORS, FINANCIAL IMPACT, RECOMMENDATION, NEXT ACTION."""

SYSTEM_LENDER = """You are the FlowCapital AI underwriting assistant for lenders.
You explain confidence, risk, evidence gaps, and financing recommendations.
NEVER invent financial numbers. Use ONLY authoritative deterministic values in context.
You do not approve financing — humans and deterministic engines do."""


def _fallback_manufacturer(context: dict[str, Any], question: str) -> str:
    score = context.get("confidence_score", 0)
    if score < 60:
        band = "Your current confidence is low because production evidence and document verification are incomplete."
    elif score <= 80:
        band = "Your confidence is moderate. The main improvement area is verification of production evidence."
    else:
        band = "Your production and financing evidence currently indicate a strong financing position."

    rec = context.get("financing_recommendation", {})
    return (
        f"CONFIDENCE REVIEW\n\n"
        f"Current confidence\n{score} / 100\n\n"
        f"Primary factor\n{band}\n\n"
        f"Financial impact\n"
        f"Financeable value ₹{context.get('financeable_value', 0):,.0f}; "
        f"outstanding exposure ₹{context.get('outstanding_exposure', 0):,.0f}.\n\n"
        f"Recommended action\n"
        f"Upload missing verification documents and resolve open conflicts ({context.get('open_conflicts', 0)}).\n\n"
        f"Question: {question}"
    )


def _fallback_lender_brief(context: dict[str, Any]) -> str:
    return (
        "AI UNDERWRITING BRIEF (deterministic fallback)\n\n"
        f"Executive Summary: Confidence {context.get('confidence_score')}%, risk {context.get('risk_level')}. "
        f"Financeable value ₹{context.get('financeable_value', 0):,.0f}; outstanding exposure "
        f"₹{context.get('outstanding_exposure', 0):,.0f}; unclaimed ₹{context.get('unclaimed_value', 0):,.0f}.\n\n"
        f"Open conflicts: {context.get('open_conflicts', 0)}. "
        f"Document completeness: {context.get('document_completeness_pct', 0)}%.\n\n"
        f"Recommendation: {context.get('eligibility_status', 'REVIEW')} — "
        f"{context.get('recommendation_reason', 'Review deterministic metrics before deciding.')}"
    )


class AIService:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self._provider = provider or GeminiProvider()

    async def _safe_generate(self, system: str, user: str, fallback: str) -> AIResponse:
        try:
            return await self._provider.generate(system, user)
        except Exception:
            return AIResponse(content=fallback, provider="deterministic-fallback", fallback_used=True)

    async def manufacturer_guidance(self, context: dict[str, Any], question: str) -> AIResponse:
        user_prompt = (
            f"Structured context (authoritative):\n{json.dumps(context, indent=2)}\n\n"
            f"Manufacturer question: {question}\n\n"
            "Answer with concise structured financial insights. Use sections where appropriate."
        )
        fallback = _fallback_manufacturer(context, question)
        return await self._safe_generate(SYSTEM_MANUFACTURER, user_prompt, fallback)

    async def lender_underwriting_brief(self, context: dict[str, Any]) -> AIResponse:
        user_prompt = (
            f"Structured context (authoritative):\n{json.dumps(context, indent=2)}\n\n"
            "Produce an AI UNDERWRITING BRIEF with sections: Executive Summary, Confidence Analysis, "
            "Risk Drivers, Positive Signals, Warning Signals, Evidence Gaps, Financing Recommendation, "
            "Recommended Amount Range, Recommended Conditions, Key Events to Monitor."
        )
        fallback = _fallback_lender_brief(context)
        return await self._safe_generate(SYSTEM_LENDER, user_prompt, fallback)

    async def explain_confidence_change(self, context: dict[str, Any]) -> AIResponse:
        user_prompt = f"Explain the confidence change using this context:\n{json.dumps(context, indent=2)}"
        fallback = (
            f"Confidence moved from {context.get('confidence_before')}% to {context.get('confidence_after')}% "
            f"after {context.get('trigger_event', 'an event')}. {context.get('reason', '')}"
        )
        return await self._safe_generate(SYSTEM_MANUFACTURER, user_prompt, fallback)

    async def chat(self, role: str, context: dict[str, Any], message: str) -> AIResponse:
        system = SYSTEM_LENDER if role == "LENDER" else SYSTEM_MANUFACTURER
        user_prompt = f"Context:\n{json.dumps(context, indent=2)}\n\nUser: {message}"
        fallback = _fallback_manufacturer(context, message) if role != "LENDER" else _fallback_lender_brief(context)
        return await self._safe_generate(system, user_prompt, fallback)

    def health(self) -> dict[str, object]:
        from app.core.config import get_settings

        settings = get_settings()
        return {
            "available": bool(settings.gemini_api_key),
            "provider": "gemini" if settings.gemini_api_key else "deterministic-fallback",
        }
