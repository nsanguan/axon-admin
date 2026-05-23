"""Code Review Agent — Pydantic AI."""
from __future__ import annotations

from dataclasses import dataclass
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext


@dataclass
class CodeReviewDeps:
    language: str = "python"
    strict_mode: bool = False


class ReviewResult(BaseModel):
    overall_score: float  # 0.0 – 10.0
    issues: list[dict]    # {"severity": str, "line": int|None, "message": str}
    suggestions: list[str]
    summary: str


code_review_agent = Agent(
    "openai:gpt-4o",
    deps_type=CodeReviewDeps,
    result_type=ReviewResult,
    system_prompt=(
        "You are a senior software engineer performing code review. "
        "Identify bugs, security issues, performance problems, and style violations. "
        "Return a structured review with an overall quality score out of 10."
    ),
)


@code_review_agent.tool
async def check_security_patterns(ctx: RunContext[CodeReviewDeps], code_snippet: str) -> dict:
    """Check code snippet for common security anti-patterns."""
    issues = []
    if "eval(" in code_snippet:
        issues.append({"severity": "critical", "pattern": "eval()", "message": "Use of eval() is dangerous"})
    if "exec(" in code_snippet:
        issues.append({"severity": "critical", "pattern": "exec()", "message": "Use of exec() is dangerous"})
    if "shell=True" in code_snippet:
        issues.append({"severity": "high", "pattern": "shell=True", "message": "subprocess with shell=True is a shell injection risk"})
    return {"issues": issues, "scanned_length": len(code_snippet)}


@code_review_agent.tool
async def get_style_guidelines(ctx: RunContext[CodeReviewDeps]) -> dict:
    """Return style guidelines for the target language."""
    guides = {
        "python": {"standard": "PEP 8", "max_line_length": 88, "formatter": "black"},
        "typescript": {"standard": "ESLint + Prettier", "max_line_length": 100, "formatter": "prettier"},
        "go": {"standard": "gofmt", "max_line_length": 120, "formatter": "gofmt"},
    }
    return guides.get(ctx.deps.language, {"standard": "unknown"})


AGENT_META = {
    "name": "CodeReviewAgent",
    "description": "Reviews code snippets for bugs, security issues, performance, and style. Returns a scored review.",
    "outputType": "ReviewResult",
    "tools": [
        {"name": "check_security_patterns", "description": "Scan for security anti-patterns"},
        {"name": "get_style_guidelines", "description": "Return style guidelines for the language"},
    ],
    "instructions": "Perform thorough code review and return a structured result with score and issues.",
}
