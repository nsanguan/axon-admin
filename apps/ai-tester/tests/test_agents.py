"""Pydantic AI agent tests — all use TestModel (no real LLM calls)."""
from __future__ import annotations

import pytest
from pydantic_ai import models
from pydantic_ai.models.test import TestModel

models.ALLOW_MODEL_REQUESTS = False


@pytest.mark.anyio
async def test_data_analysis_agent_test_model():
    from agents.data_analysis_agent import data_analysis_agent, DataDeps

    result = await data_analysis_agent.run(
        "Analyse sales data for Q4",
        deps=DataDeps(dataset_name="q4_sales"),
        model=TestModel(),
    )
    assert result.data is not None


@pytest.mark.anyio
async def test_code_review_agent_test_model():
    from agents.code_review_agent import code_review_agent, CodeReviewDeps

    result = await code_review_agent.run(
        "Review this Python function for issues",
        deps=CodeReviewDeps(language="python"),
        model=TestModel(),
    )
    assert result.data is not None


@pytest.mark.anyio
async def test_research_agent_test_model():
    from agents.research_agent import research_agent, ResearchDeps

    result = await research_agent.run(
        "Research the impact of LLMs on software engineering",
        deps=ResearchDeps(max_sources=3),
        model=TestModel(),
    )
    assert result.data is not None
