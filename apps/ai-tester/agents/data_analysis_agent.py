"""Data Analysis Agent — Pydantic AI."""
from __future__ import annotations

from dataclasses import dataclass
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext


@dataclass
class DataDeps:
    dataset_name: str = "default"
    max_rows: int = 1000


class AnalysisResult(BaseModel):
    summary: str
    key_findings: list[str]
    recommendations: list[str]
    row_count: int


data_analysis_agent = Agent(
    "openai:gpt-4o",
    deps_type=DataDeps,
    result_type=AnalysisResult,
    system_prompt=(
        "You are a data analysis expert. Analyse datasets and return structured insights. "
        "Always provide at least 3 key findings and 2 recommendations."
    ),
)


@data_analysis_agent.tool
async def get_dataset_info(ctx: RunContext[DataDeps]) -> dict:
    """Return metadata about the dataset being analysed."""
    return {
        "name": ctx.deps.dataset_name,
        "max_rows": ctx.deps.max_rows,
        "available_columns": ["date", "revenue", "users", "conversions", "region"],
    }


@data_analysis_agent.tool
async def compute_statistics(ctx: RunContext[DataDeps], column: str) -> dict:
    """Compute basic statistics for a given column."""
    # In production, this would query real data; here we return mock stats
    mock_stats = {
        "revenue": {"mean": 45_230.50, "min": 12_000, "max": 98_400, "std": 18_500},
        "users": {"mean": 1_250, "min": 300, "max": 3_800, "std": 620},
        "conversions": {"mean": 0.042, "min": 0.01, "max": 0.12, "std": 0.018},
    }
    return mock_stats.get(column, {"error": f"Column '{column}' not found"})


AGENT_META = {
    "name": "DataAnalysisAgent",
    "description": "Analyses datasets and produces structured insights with key findings and recommendations.",
    "outputType": "AnalysisResult",
    "tools": [
        {"name": "get_dataset_info", "description": "Return metadata about the dataset"},
        {"name": "compute_statistics", "description": "Compute basic statistics for a column"},
    ],
    "instructions": "Analyse datasets and return structured insights with key findings.",
}
