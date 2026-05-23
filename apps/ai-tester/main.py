"""AXON AI Tester — FastAPI sidecar.

Hosts Pydantic AI agents and exposes a REST API consumed by the NestJS backend.
"""
from __future__ import annotations

import asyncio
import time
import uuid
from contextlib import asynccontextmanager
from typing import Any

import logfire
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from redis_client import init_redis_pool, close_redis_pool
from agents.data_analysis_agent import AGENT_META as DATA_META, data_analysis_agent, DataDeps
from agents.code_review_agent import AGENT_META as CODE_META, code_review_agent, CodeReviewDeps
from agents.research_agent import AGENT_META as RESEARCH_META, research_agent, ResearchDeps

# ---------------------------------------------------------------------------
# Logfire observability (no-op if LOGFIRE_TOKEN not set)
# ---------------------------------------------------------------------------
logfire.configure(send_to_logfire="if-token-present")
logfire.instrument_pydantic()

# ---------------------------------------------------------------------------
# Agent registry
# ---------------------------------------------------------------------------
AGENT_REGISTRY: dict[str, dict] = {
    "DataAnalysisAgent": DATA_META,
    "CodeReviewAgent": CODE_META,
    "ResearchAgent": RESEARCH_META,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_redis_pool()
    print("AXON AI Tester sidecar starting up")
    yield
    print("AXON AI Tester sidecar shutting down")
    await close_redis_pool()


app = FastAPI(
    title="AXON AI Tester",
    description="Pydantic AI agent sidecar for AXON Admin",
    version="1.0.0",
    lifespan=lifespan,
)

logfire.instrument_fastapi(app)

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class RunRequest(BaseModel):
    agent_name: str
    prompt: str
    model_mode: str = "test_model"  # test_model | function_model | real_model
    model_name: str | None = None
    deps: dict[str, Any] = Field(default_factory=dict)
    usage_limits: dict[str, Any] = Field(default_factory=dict)
    function_snippet: str | None = None


class AgentMessage(BaseModel):
    sequence_order: int
    message_kind: str
    part_kind: str
    content: Any = None
    tool_name: str | None = None
    tool_call_id: str | None = None
    model_name: str | None = None
    input_tokens: int | None = None
    output_tokens: int | None = None


class RunResponse(BaseModel):
    run_id: str
    agent_name: str
    model_mode: str
    status: str
    output: Any | None = None
    error: str | None = None
    messages: list[AgentMessage] = Field(default_factory=list)
    duration_ms: float
    input_tokens: int | None = None
    output_tokens: int | None = None


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok", "agents": list(AGENT_REGISTRY.keys())}


@app.get("/agents")
async def list_agents():
    return list(AGENT_REGISTRY.values())


@app.get("/agents/{name}")
async def get_agent(name: str):
    if name not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{name}' not found")
    return AGENT_REGISTRY[name]


@app.post("/runs", response_model=RunResponse)
async def create_run(req: RunRequest):
    if req.agent_name not in AGENT_REGISTRY:
        raise HTTPException(status_code=404, detail=f"Agent '{req.agent_name}' not found")

    run_id = str(uuid.uuid4())
    start = time.monotonic()

    try:
        result = await _execute_agent(req)
        duration_ms = (time.monotonic() - start) * 1000

        messages: list[AgentMessage] = []
        usage = result.usage()

        for i, msg in enumerate(result.all_messages()):
            for part in msg.parts:
                part_kind = getattr(part, "part_kind", type(part).__name__)
                content = None
                tool_name = None
                tool_call_id = None

                if hasattr(part, "content"):
                    content = part.content
                elif hasattr(part, "args"):
                    content = part.args
                elif hasattr(part, "tool_return"):
                    content = part.tool_return

                if hasattr(part, "tool_name"):
                    tool_name = part.tool_name
                if hasattr(part, "tool_call_id"):
                    tool_call_id = part.tool_call_id

                messages.append(AgentMessage(
                    sequence_order=len(messages),
                    message_kind=type(msg).__name__.lower().replace("message", ""),
                    part_kind=part_kind,
                    content=content,
                    tool_name=tool_name,
                    tool_call_id=tool_call_id,
                    model_name=req.model_name,
                    input_tokens=usage.request_tokens if i == len(list(result.all_messages())) - 1 else None,
                    output_tokens=usage.response_tokens if i == len(list(result.all_messages())) - 1 else None,
                ))

        return RunResponse(
            run_id=run_id,
            agent_name=req.agent_name,
            model_mode=req.model_mode,
            status="done",
            output=result.data.model_dump() if hasattr(result.data, "model_dump") else result.data,
            messages=messages,
            duration_ms=duration_ms,
            input_tokens=usage.request_tokens,
            output_tokens=usage.response_tokens,
        )

    except Exception as exc:
        duration_ms = (time.monotonic() - start) * 1000
        return RunResponse(
            run_id=run_id,
            agent_name=req.agent_name,
            model_mode=req.model_mode,
            status="error",
            error=str(exc),
            messages=[],
            duration_ms=duration_ms,
        )


# ---------------------------------------------------------------------------
# Internal — select and run the appropriate agent
# ---------------------------------------------------------------------------


async def _execute_agent(req: RunRequest):
    from pydantic_ai.models.test import TestModel
    from pydantic_ai import models

    if req.model_mode == "test_model":
        models.ALLOW_MODEL_REQUESTS = False
        model = TestModel()
    elif req.model_mode == "function_model":
        from pydantic_ai.models.function import FunctionModel, ModelRequest

        def _fn(messages, info):
            from pydantic_ai.models import ModelResponse
            from pydantic_ai.messages import TextPart
            return ModelResponse(parts=[TextPart("FunctionModel placeholder response")])

        model = FunctionModel(_fn)
    else:
        # real model — uses OPENAI_API_KEY / ANTHROPIC_API_KEY env vars
        models.ALLOW_MODEL_REQUESTS = True
        model = req.model_name or "openai:gpt-4o-mini"

    if req.agent_name == "DataAnalysisAgent":
        deps = DataDeps(**{k: v for k, v in req.deps.items() if k in DataDeps.__dataclass_fields__})
        return await data_analysis_agent.run(req.prompt, deps=deps, model=model)
    elif req.agent_name == "CodeReviewAgent":
        deps = CodeReviewDeps(**{k: v for k, v in req.deps.items() if k in CodeReviewDeps.__dataclass_fields__})
        return await code_review_agent.run(req.prompt, deps=deps, model=model)
    elif req.agent_name == "ResearchAgent":
        deps = ResearchDeps(**{k: v for k, v in req.deps.items() if k in ResearchDeps.__dataclass_fields__})
        return await research_agent.run(req.prompt, deps=deps, model=model)
    else:
        raise ValueError(f"Unknown agent: {req.agent_name}")
