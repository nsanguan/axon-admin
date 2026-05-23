"""Research Agent — Pydantic AI."""
from __future__ import annotations

from dataclasses import dataclass
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext


@dataclass
class ResearchDeps:
    max_sources: int = 5
    language: str = "en"


class ResearchResult(BaseModel):
    title: str
    summary: str
    key_points: list[str]
    sources: list[dict]   # {"title": str, "url": str, "relevance": float}
    confidence: float     # 0.0 – 1.0


research_agent = Agent(
    "openai:gpt-4o",
    deps_type=ResearchDeps,
    result_type=ResearchResult,
    system_prompt=(
        "You are an expert researcher. Given a research question, you gather information "
        "from multiple sources, synthesise key points, and produce a structured report. "
        "Always cite sources and express a confidence score."
    ),
)


@research_agent.tool
async def search_knowledge_base(ctx: RunContext[ResearchDeps], query: str) -> dict:
    """Search internal knowledge base for relevant documents."""
    # In production, this would query a vector DB or search engine
    return {
        "query": query,
        "results": [
            {"title": f"Document on {query}", "content": f"Mock content about {query}", "score": 0.85},
            {"title": f"Overview of {query}", "content": f"Comprehensive overview of {query}", "score": 0.72},
        ],
        "max_sources": ctx.deps.max_sources,
    }


@research_agent.tool
async def get_related_topics(ctx: RunContext[ResearchDeps], topic: str) -> list[str]:
    """Get a list of topics closely related to the given topic."""
    # Mock implementation
    return [f"{topic} fundamentals", f"{topic} applications", f"{topic} case studies", f"future of {topic}"]


AGENT_META = {
    "name": "ResearchAgent",
    "description": "Conducts structured research and produces cited summaries with key points and confidence scores.",
    "outputType": "ResearchResult",
    "tools": [
        {"name": "search_knowledge_base", "description": "Search internal knowledge base"},
        {"name": "get_related_topics", "description": "Get related topics for broader research"},
    ],
    "instructions": "Research the given topic thoroughly and return a structured, cited report.",
}
