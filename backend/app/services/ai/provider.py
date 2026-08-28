from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AIResponse:
    content: str
    provider: str
    fallback_used: bool = False


class AIProvider(ABC):
    @abstractmethod
    async def generate(self, system_prompt: str, user_prompt: str) -> AIResponse:
        raise NotImplementedError
