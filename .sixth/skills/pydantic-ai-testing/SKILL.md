---
name: pydantic-ai-testing
description: >
  Pydantic AI agent framework — building, testing, and evaluating production
  agents. Covers Agent construction, dependency injection, structured output,
  tools, TestModel/FunctionModel for unit tests, agent.override(), pytest
  fixtures, capture_run_messages, UsageLimits, ModelRetry, streaming, evals,
  and Logfire observability. Use for any Pydantic AI Python agent work in the
  AXON Admin project.
---

# Pydantic AI Testing Skill

## Overview

Pydantic AI is a Python agent framework designed to build production-grade
applications with Generative AI. It is model-agnostic, fully type-safe, and
built by the Pydantic team.

Official docs: https://pydantic.dev/docs/ai/overview/  
Testing guide: https://pydantic.dev/docs/ai/guides/testing/

---

## 1. Installation

```bash
# Core
pip install pydantic-ai

# With Logfire observability
pip install "pydantic-ai[logfire]"

# With all extras (evals, logfire, etc.)
pip install "pydantic-ai[all]"

# Evals framework (separate package)
pip install pydantic-evals

# Useful test utilities
pip install pytest pytest-anyio dirty-equals inline-snapshot
```

---

## 2. Core Concepts

### Agent Construction

```python
from dataclasses import dataclass
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext

# 1. Plain text agent (simplest)
agent = Agent(
    'openai:gpt-5.2',
    instructions='Be concise, reply with one sentence.',
)
result = agent.run_sync('Where does "hello world" come from?')
print(result.output)  # str

# 2. Structured output agent
class SupportOutput(BaseModel):
    support_advice: str = Field(description='Advice returned to the customer')
    block_card: bool = Field(description="Whether to block the customer's card")
    risk: int = Field(description='Risk level of query', ge=0, le=10)

@dataclass
class SupportDeps:
    customer_id: int
    db: 'DatabaseConn'

support_agent = Agent(
    'openai:gpt-5.2',
    deps_type=SupportDeps,
    output_type=SupportOutput,
    instructions='You are a support agent. Judge the risk level of customer queries.',
)

# 3. Dynamic instructions via decorator
@support_agent.instructions
async def add_customer_name(ctx: RunContext[SupportDeps]) -> str:
    name = await ctx.deps.db.customer_name(id=ctx.deps.customer_id)
    return f"The customer's name is {name!r}"

# 4. Tool registration
@support_agent.tool
async def customer_balance(
    ctx: RunContext[SupportDeps], include_pending: bool
) -> float:
    """Returns the customer's current account balance."""
    return await ctx.deps.db.customer_balance(
        id=ctx.deps.customer_id, include_pending=include_pending
    )
```

### Running Agents — Five Methods

```python
# 1. Sync (blocks)
result = agent.run_sync('What is the capital of Italy?')
print(result.output)

# 2. Async
result = await agent.run('What is the capital of France?')

# 3. Stream output (async context manager)
async with agent.run_stream('What is the capital of the UK?') as response:
    async for text in response.stream_text():
        print(text)  # incremental chunks

# 4. Stream all events (tokens, tool calls, tool returns)
async with agent.run_stream_events('What is the capital of Mexico?') as stream:
    async for event in stream:
        print(event)

# 5. Iterate node-by-node (deepest control)
async with agent.iter('What is the capital of France?') as agent_run:
    async for node in agent_run:
        ...  # UserPromptNode, ModelRequestNode, CallToolsNode, End
    print(agent_run.result.output)
```

### Multi-turn Conversations

```python
# Pass previous messages to continue a conversation
result1 = agent.run_sync('Who was Albert Einstein?')
result2 = agent.run_sync(
    'What was his most famous equation?',
    message_history=result1.new_messages(),
)
print(result2.output)  # "Albert Einstein's most famous equation is E = mc²."
```

---

## 3. Testing Strategy

Always follow this strategy:

- Use **pytest** as test harness
- Use **`TestModel`** or **`FunctionModel`** instead of real LLMs — no cost, no latency, no variability
- Use **`agent.override()`** to replace model/deps inside application logic
- Set **`ALLOW_MODEL_REQUESTS = False`** globally to block accidental real LLM calls
- Use **`capture_run_messages()`** to inspect the full message exchange
- Use **`inline-snapshot`** for large assertion strings
- Use **`dirty-equals`** (e.g. `IsNow`, `IsStr`) when asserting timestamps/IDs

---

## 4. `TestModel` — Unit Testing (Fastest)

`TestModel` calls all tools in the agent using procedurally generated valid data,
then returns a structured or text response — no ML, no HTTP calls.

```python
# weather_app.py (application code)
from datetime import date
from pydantic_ai import Agent, RunContext
from weather_service import WeatherService

weather_agent = Agent(
    'openai:gpt-5.2',
    deps_type=WeatherService,
    instructions='Providing a weather forecast at the locations the user provides.',
)

@weather_agent.tool
def weather_forecast(
    ctx: RunContext[WeatherService], location: str, forecast_date: date
) -> str:
    if forecast_date < date.today():
        return ctx.deps.get_historic_weather(location, forecast_date)
    else:
        return ctx.deps.get_forecast(location, forecast_date)
```

```python
# test_weather_app.py (test file)
from datetime import timezone
import pytest
from dirty_equals import IsNow, IsStr
from pydantic_ai import models, capture_run_messages, RequestUsage
from pydantic_ai.models.test import TestModel
from pydantic_ai import (
    ModelResponse, TextPart, ToolCallPart, ToolReturnPart,
    UserPromptPart, ModelRequest,
)
from weather_app import run_weather_forecast, weather_agent

pytestmark = pytest.mark.anyio

# IMPORTANT: Block all real model calls globally
models.ALLOW_MODEL_REQUESTS = False

async def test_forecast():
    conn = DatabaseConn()
    user_id = 1

    # capture_run_messages records every message exchanged
    with capture_run_messages() as messages:
        # Override the model for this code block only
        with weather_agent.override(model=TestModel()):
            prompt = 'What will the weather be like in London on 2024-11-28?'
            await run_weather_forecast([(prompt, user_id)], conn)

    forecast = await conn.get_forecast(user_id)
    assert forecast == '{"weather_forecast":"Sunny with a chance of rain"}'

    # Assert the full message exchange
    assert messages == [
        ModelRequest(
            parts=[
                UserPromptPart(
                    content='What will the weather be like in London on 2024-11-28?',
                    timestamp=IsNow(tz=timezone.utc),
                ),
            ],
            instructions='Providing a weather forecast at the locations the user provides.',
            timestamp=IsNow(tz=timezone.utc),
            run_id=IsStr(),
            conversation_id=IsStr(),
        ),
        ModelResponse(
            parts=[
                ToolCallPart(
                    tool_name='weather_forecast',
                    # TestModel generates valid-but-minimal args from the schema
                    args={'location': 'a', 'forecast_date': '2024-01-01'},
                    tool_call_id=IsStr(),
                )
            ],
            usage=RequestUsage(input_tokens=60, output_tokens=7),
            model_name='test',
            timestamp=IsNow(tz=timezone.utc),
            run_id=IsStr(),
            conversation_id=IsStr(),
        ),
        ModelRequest(
            parts=[
                ToolReturnPart(
                    tool_name='weather_forecast',
                    content='Sunny with a chance of rain',
                    tool_call_id=IsStr(),
                    timestamp=IsNow(tz=timezone.utc),
                ),
            ],
            instructions='Providing a weather forecast at the locations the user provides.',
            timestamp=IsNow(tz=timezone.utc),
            run_id=IsStr(),
            conversation_id=IsStr(),
        ),
        ModelResponse(
            parts=[TextPart(content='{"weather_forecast":"Sunny with a chance of rain"}')],
            usage=RequestUsage(input_tokens=66, output_tokens=16),
            model_name='test',
            timestamp=IsNow(tz=timezone.utc),
            run_id=IsStr(),
            conversation_id=IsStr(),
        ),
    ]
```

> **Note**: `TestModel` generates dates in the past (e.g. `2024-01-01`) so
> the `if forecast_date < date.today()` branch always takes the historic path.
> Use `FunctionModel` to force the future path.

---

## 5. `FunctionModel` — Custom Test Logic

`FunctionModel` lets you write a Python function that acts as the model,
giving you full control over which tools are called and with what arguments.

```python
import re
import pytest
from pydantic_ai import models
from pydantic_ai import ModelMessage, ModelResponse, TextPart, ToolCallPart
from pydantic_ai.models.function import AgentInfo, FunctionModel
from weather_app import run_weather_forecast, weather_agent

pytestmark = pytest.mark.anyio
models.ALLOW_MODEL_REQUESTS = False

def call_weather_forecast(
    messages: list[ModelMessage], info: AgentInfo
) -> ModelResponse:
    if len(messages) == 1:
        # First call: parse the date from the prompt and call the tool
        user_prompt = messages[0].parts[-1]
        m = re.search(r'\d{4}-\d{2}-\d{2}', user_prompt.content)
        assert m is not None
        args = {'location': 'London', 'forecast_date': m.group()}
        return ModelResponse(parts=[ToolCallPart('weather_forecast', args)])
    else:
        # Second call: return a text response using the tool's output
        msg = messages[-1].parts[0]
        assert msg.part_kind == 'tool-return'
        return ModelResponse(parts=[TextPart(f'The forecast is: {msg.content}')])

async def test_forecast_future():
    conn = DatabaseConn()
    user_id = 1

    with weather_agent.override(model=FunctionModel(call_weather_forecast)):
        # A future date forces the get_forecast (non-historic) branch
        prompt = 'What will the weather be like in London on 2032-01-01?'
        await run_weather_forecast([(prompt, user_id)], conn)

    forecast = await conn.get_forecast(user_id)
    assert forecast == 'The forecast is: Rainy with a chance of sun'
```

---

## 6. `agent.override()` — Replacing Model & Dependencies

`agent.override()` is a context manager that temporarily replaces the agent's
model, dependencies, or both. It does NOT modify global state — only calls
made inside the `with` block are affected.

```python
from pydantic_ai.models.test import TestModel
from pydantic_ai import Agent

agent = Agent('openai:gpt-5.2', deps_type=MyDeps, output_type=MyOutput)

# Override model only
with agent.override(model=TestModel()):
    result = agent.run_sync('test prompt', deps=MyDeps(...))

# Override deps only
with agent.override(deps=MyDeps(db=MockDB())):
    result = agent.run_sync('test prompt')

# Override both
with agent.override(model=TestModel(), deps=MyDeps(db=MockDB())):
    result = agent.run_sync('test prompt')
```

---

## 7. Pytest Fixtures — Reusable Model Overrides

When many tests need model override, extract to a fixture:

```python
# conftest.py
import pytest
from pydantic_ai.models.test import TestModel
from weather_app import weather_agent

@pytest.fixture
def override_weather_agent():
    with weather_agent.override(model=TestModel()):
        yield

# test_agent.py
async def test_forecast(override_weather_agent: None):
    # weather_agent uses TestModel in this test automatically
    result = weather_agent.run_sync('What is the weather in London?')
    assert result.output is not None
```

---

## 8. `capture_run_messages()` — Inspecting Message Flow

Use `capture_run_messages()` to capture the raw message exchange for any run,
including when a run fails with an exception.

```python
from pydantic_ai import Agent, capture_run_messages, ModelRetry, UnexpectedModelBehavior

agent = Agent('openai:gpt-5.2')

@agent.tool_plain
def calc_volume(size: int) -> int:
    if size == 42:
        return size ** 3
    else:
        raise ModelRetry('Please try again.')

# Works even when the run raises an exception
with capture_run_messages() as messages:
    try:
        result = agent.run_sync('Please get me the volume of a box with size 6.')
    except UnexpectedModelBehavior as e:
        print('Error:', e)
        # > Error: Tool 'calc_volume' exceeded max retries count of 1
        print('Cause:', repr(e.__cause__))
        # > Cause: ModelRetry('Please try again.')

# messages contains the full exchange up to the error
print(messages)
```

> If you call `run()` multiple times inside one `capture_run_messages()` block,
> only the messages from the **first** call are captured.

---

## 9. `ModelRetry` & Reflection

Raise `ModelRetry` from inside a tool or output validator to tell the model to
retry with the error message included. Use `retries=N` to configure budget.

```python
from pydantic import BaseModel
from pydantic_ai import Agent, RunContext, ModelRetry
from fake_database import DatabaseConn

class ChatResult(BaseModel):
    user_id: int
    message: str

agent = Agent(
    'openai:gpt-5.2',
    deps_type=DatabaseConn,
    output_type=ChatResult,
)

@agent.tool(retries=2)          # this tool gets up to 2 retry attempts
def get_user_by_name(ctx: RunContext[DatabaseConn], name: str) -> int:
    """Get a user's ID from their full name."""
    user_id = ctx.deps.users.get(name=name)
    if user_id is None:
        raise ModelRetry(
            f'No user found with name {name!r}, '
            'remember to provide their full name'
        )
    return user_id
```

---

## 10. `UsageLimits` — Capping Tokens, Requests, and Tool Calls

Prevent infinite loops and runaway costs in tests and production.

```python
from pydantic_ai import Agent, UsageLimitExceeded, UsageLimits

agent = Agent('anthropic:claude-sonnet-4-6')

# Cap response tokens
result = agent.run_sync(
    'What is the capital of Italy? Answer with just the city.',
    usage_limits=UsageLimits(response_tokens_limit=10),
)
print(result.usage)  # RunUsage(input_tokens=62, output_tokens=1, requests=1)

# Cap total model requests (prevents infinite tool-calling loops)
try:
    agent.run_sync(
        'Begin infinite retry loop!',
        usage_limits=UsageLimits(request_limit=3),
    )
except UsageLimitExceeded as e:
    print(e)  # The next request would exceed the request_limit of 3

# Cap total tool executions in one run
try:
    agent.run_sync(
        'Please call the tool twice',
        usage_limits=UsageLimits(tool_calls_limit=1),
    )
except UsageLimitExceeded as e:
    print(e)  # The next tool call(s) would exceed the tool_calls_limit of 1
```

---

## 11. Structured Output & Output Validators

```python
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.output import ToolOutput

class CityInfo(BaseModel):
    city: str
    country: str
    population: int

agent = Agent(
    'openai:gpt-5.2',
    output_type=CityInfo,
)

# With per-output retry budget:
agent2 = Agent(
    'openai:gpt-5.2',
    output_type=ToolOutput(CityInfo, max_retries=3),
)

result = agent.run_sync('Tell me about Paris')
print(result.output)           # CityInfo(city='Paris', country='France', population=2161000)
print(result.output.city)      # 'Paris'
print(result.usage)            # RunUsage(...)
```

---

## 12. Testing Structured Output with TestModel

`TestModel` auto-generates valid Pydantic data from your output schema:

```python
from pydantic import BaseModel
from pydantic_ai import Agent, models
from pydantic_ai.models.test import TestModel

models.ALLOW_MODEL_REQUESTS = False

class MyOutput(BaseModel):
    answer: str
    confidence: float

agent = Agent('openai:gpt-5.2', output_type=MyOutput)

def test_structured_output():
    with agent.override(model=TestModel()):
        result = agent.run_sync('What is 2+2?')
        # TestModel generates valid MyOutput from schema
        assert isinstance(result.output, MyOutput)
        assert isinstance(result.output.confidence, float)

def test_structured_output_custom():
    """Force TestModel to return a specific response."""
    with agent.override(model=TestModel(custom_output_text='{"answer": "4", "confidence": 0.99}')):
        result = agent.run_sync('What is 2+2?')
        assert result.output.answer == '4'
        assert result.output.confidence == 0.99
```

---

## 13. Model Settings & Deterministic Tests

```python
from pydantic_ai import Agent, ModelSettings

# temperature=0.0 → more deterministic in production
agent = Agent(
    'openai:gpt-5.2',
    model_settings=ModelSettings(temperature=0.0),
)

# Override at run time
result = agent.run_sync(
    'What is the capital of Italy?',
    model_settings=ModelSettings(temperature=0.0, max_tokens=50),
)
```

---

## 14. Testing Error Paths

```python
from pydantic_ai import Agent, UnexpectedModelBehavior, ModelRetry, capture_run_messages
from pydantic_ai.models.function import FunctionModel
from pydantic_ai import ModelMessage, ModelResponse, TextPart
import pytest

agent = Agent('openai:gpt-5.2')

@agent.tool_plain
def always_fails() -> str:
    raise ModelRetry('Always retry.')

def failing_model(messages: list[ModelMessage], info) -> ModelResponse:
    return ModelResponse(parts=[TextPart('done')])

def test_tool_retry_exhausted():
    """Agent raises UnexpectedModelBehavior when retries are exhausted."""
    with agent.override(model=FunctionModel(failing_model)):
        with capture_run_messages() as messages:
            with pytest.raises(UnexpectedModelBehavior) as exc_info:
                agent.run_sync('trigger the failure')
        assert 'exceeded max retries' in str(exc_info.value)
        assert len(messages) > 0  # messages captured even on exception
```

---

## 15. Multi-Agent & Dependency Injection Testing

```python
from dataclasses import dataclass
from pydantic_ai import Agent, RunContext
from pydantic_ai.models.test import TestModel
import pytest

@dataclass
class MockDB:
    """Test double for the real database connection."""
    users: dict[str, int] = None

    def __post_init__(self):
        if self.users is None:
            self.users = {'Alice': 1, 'Bob': 2}

    def get_user_id(self, name: str) -> int | None:
        return self.users.get(name)

@dataclass
class AppDeps:
    db: MockDB
    user_id: int

agent = Agent('openai:gpt-5.2', deps_type=AppDeps)

@agent.tool
def get_user(ctx: RunContext[AppDeps], name: str) -> str:
    uid = ctx.deps.db.get_user_id(name)
    return f'User ID: {uid}' if uid else 'Not found'

def test_agent_with_mock_deps():
    mock_deps = AppDeps(db=MockDB(), user_id=99)
    with agent.override(model=TestModel(), deps=mock_deps):
        result = agent.run_sync('Look up Alice')
        assert result.output is not None
```

---

## 16. Streaming Tests

```python
import asyncio
import pytest
from pydantic_ai.models.function import FunctionModel
from pydantic_ai import ModelMessage, ModelResponse, TextPart

def streaming_model(messages: list[ModelMessage], info) -> ModelResponse:
    return ModelResponse(parts=[TextPart('The answer is 42.')])

@pytest.mark.anyio
async def test_streaming():
    with agent.override(model=FunctionModel(streaming_model)):
        async with agent.run_stream('What is the answer?') as response:
            chunks = []
            async for chunk in response.stream_text():
                chunks.append(chunk)
            full = ''.join(chunks)
            assert '42' in full
            assert response.usage().requests == 1
```

---

## 17. Evals with `pydantic-evals`

For systematic regression testing of agent quality (not just correctness):

```python
from pydantic_evals import Case, Dataset
from pydantic_ai import Agent

agent = Agent('openai:gpt-5.2', instructions='Answer geography questions.')

async def run_agent(prompt: str) -> str:
    result = await agent.run(prompt)
    return result.output

dataset = Dataset(
    name='geography_eval',
    cases=[
        Case(
            name='france_capital',
            inputs='What is the capital of France?',
            expected_output='Paris',
        ),
        Case(
            name='italy_capital',
            inputs='What is the capital of Italy?',
            expected_output='Rome',
        ),
    ],
)

# Run all cases and get a report
report = dataset.evaluate_sync(run_agent)
print(report.summary())

# With Logfire — evaluation results appear in the web UI
import logfire
logfire.configure()
logfire.instrument_pydantic_ai()
report = dataset.evaluate_sync(run_agent)
```

---

## 18. Logfire Observability

```python
import logfire

logfire.configure()
logfire.instrument_pydantic_ai()   # instruments all agent runs automatically
logfire.instrument_sqlite3()       # also instrument DB if used

# All agent.run() / run_sync() / run_stream() calls now emit traces to Logfire
# Traces include: messages, tool calls, token usage, latency, errors
result = agent.run_sync('What is the capital of France?')

# Add run metadata for filtering traces (e.g. by tenant, user, session)
result = agent.run_sync(
    'What is the capital of France?',
    metadata={'tenant_id': 'axon-admin', 'user_id': 'usr-42'},
)
print(result.metadata)  # {'tenant_id': 'axon-admin', 'user_id': 'usr-42'}
```

View traces at: https://logfire.pydantic.dev

---

## 19. `ALLOW_MODEL_REQUESTS` — Safety Guardrail

Add this to every test module or `conftest.py` to prevent accidental real
model calls in the test suite:

```python
# conftest.py
import pytest
from pydantic_ai import models

# Raise an error if any test tries to call a real LLM
models.ALLOW_MODEL_REQUESTS = False

# If some tests genuinely need real model calls, use a marker:
@pytest.fixture
def allow_real_model():
    models.ALLOW_MODEL_REQUESTS = True
    yield
    models.ALLOW_MODEL_REQUESTS = False
```

---

## 20. Full AXON Admin Agent Example

```python
"""
AXON Admin — MCP Plugin Agent with Pydantic AI
Tests demonstrate TestModel + FunctionModel patterns for the AXON MCP platform.
"""
from dataclasses import dataclass
from pydantic import BaseModel, Field
from pydantic_ai import Agent, RunContext, ModelRetry
from pydantic_ai.models.test import TestModel
from pydantic_ai.models.function import FunctionModel, AgentInfo
from pydantic_ai import ModelMessage, ModelResponse, TextPart, ToolCallPart
import pytest

# ── Domain models ─────────────────────────────────────────────────────────────

class PluginResult(BaseModel):
    plugin_id: str
    status: str = Field(description='resolved | error')
    output: str | None = Field(default=None)

@dataclass
class AxonDeps:
    user_id: str
    tenant: str
    mcp_base_url: str = 'http://axon-control-tower:8200'

# ── Agent definition ───────────────────────────────────────────────────────────

axon_agent = Agent(
    'openai:gpt-5.2',
    deps_type=AxonDeps,
    output_type=PluginResult,
    instructions='You are an AXON MCP plugin orchestrator. Resolve and call plugins.',
)

@axon_agent.instructions
def add_tenant_context(ctx: RunContext[AxonDeps]) -> str:
    return f'Operating for tenant: {ctx.deps.tenant}, user: {ctx.deps.user_id}'

@axon_agent.tool(retries=2)
async def resolve_plugin(ctx: RunContext[AxonDeps], plugin_name: str) -> str:
    """Resolve a plugin ID from its name via the AXON MCP registry."""
    # In production: call ctx.deps.mcp_base_url/v1/plugins?name=plugin_name
    if not plugin_name:
        raise ModelRetry('Plugin name is required.')
    return f'plugin-{plugin_name.lower().replace(" ", "-")}'

@axon_agent.tool
async def call_plugin(ctx: RunContext[AxonDeps], plugin_id: str, payload: str) -> str:
    """Call a resolved plugin via the AXON Control Tower."""
    # In production: POST to ctx.deps.mcp_base_url/v1/run/{plugin_id}
    return f'Result from {plugin_id}: processed "{payload}"'

# ── Tests ──────────────────────────────────────────────────────────────────────

from pydantic_ai import models

models.ALLOW_MODEL_REQUESTS = False

TEST_DEPS = AxonDeps(user_id='usr-42', tenant='axon-admin')

class TestAxonAgentUnit:
    """Fast unit tests — no real LLM calls."""

    def test_basic_run(self):
        with axon_agent.override(model=TestModel()):
            result = axon_agent.run_sync(
                'Run the weather plugin', deps=TEST_DEPS
            )
            # TestModel generates valid PluginResult from schema
            assert isinstance(result.output, PluginResult)
            assert result.output.plugin_id  # non-empty string generated
            assert result.output.status in ('resolved', 'error', 'a')  # TestModel generates 'a' for str

    def test_instructions_include_tenant(self):
        from pydantic_ai import capture_run_messages
        with capture_run_messages() as messages:
            with axon_agent.override(model=TestModel()):
                axon_agent.run_sync('Run any plugin', deps=TEST_DEPS)
        # Check that tenant context was injected
        first_request = messages[0]
        assert any(
            'axon-admin' in str(part)
            for part in first_request.parts
        )

class TestAxonAgentFunctionModel:
    """Controlled integration tests — deterministic tool calling."""

    def call_resolve_and_execute(
        self, messages: list[ModelMessage], info: AgentInfo
    ) -> ModelResponse:
        if len(messages) == 1:
            # Step 1: call resolve_plugin
            return ModelResponse(parts=[
                ToolCallPart('resolve_plugin', {'plugin_name': 'weather'})
            ])
        elif len(messages) == 2:
            # Step 2: call call_plugin with resolved ID
            tool_return = messages[-1].parts[0]
            plugin_id = tool_return.content  # 'plugin-weather'
            return ModelResponse(parts=[
                ToolCallPart('call_plugin', {'plugin_id': plugin_id, 'payload': 'London'})
            ])
        else:
            # Step 3: return structured result
            tool_return = messages[-1].parts[0]
            return ModelResponse(parts=[TextPart(
                f'{{"plugin_id": "plugin-weather", "status": "resolved", "output": "{tool_return.content}"}}'
            )])

    @pytest.mark.anyio
    async def test_full_plugin_flow(self):
        with axon_agent.override(model=FunctionModel(self.call_resolve_and_execute)):
            result = await axon_agent.run('Run the weather plugin', deps=TEST_DEPS)

        assert result.output.plugin_id == 'plugin-weather'
        assert result.output.status == 'resolved'
        assert 'London' in result.output.output

    @pytest.mark.anyio
    async def test_usage_tracking(self):
        with axon_agent.override(model=TestModel()):
            result = await axon_agent.run('Run any plugin', deps=TEST_DEPS)
        assert result.usage().requests >= 1

# ── pytest conftest ────────────────────────────────────────────────────────────

# conftest.py
# import pytest
# from pydantic_ai import models
# from pydantic_ai.models.test import TestModel
# from axon_agent import axon_agent, AxonDeps
#
# models.ALLOW_MODEL_REQUESTS = False
#
# @pytest.fixture
# def test_deps() -> AxonDeps:
#     return AxonDeps(user_id='usr-test', tenant='axon-test')
#
# @pytest.fixture
# def override_axon_agent():
#     with axon_agent.override(model=TestModel()):
#         yield
```

---

## 21. Quick Reference

| Task | Code |
|---|---|
| Install | `pip install pydantic-ai pytest pytest-anyio dirty-equals` |
| Block real LLM calls | `models.ALLOW_MODEL_REQUESTS = False` |
| Unit test (no logic) | `with agent.override(model=TestModel()): ...` |
| Unit test (custom logic) | `with agent.override(model=FunctionModel(my_fn)): ...` |
| Replace deps in tests | `with agent.override(deps=MockDeps()): ...` |
| Capture messages | `with capture_run_messages() as msgs: ...` |
| Limit requests | `agent.run_sync(prompt, usage_limits=UsageLimits(request_limit=3))` |
| Limit tokens | `UsageLimits(response_tokens_limit=100)` |
| Limit tool calls | `UsageLimits(tool_calls_limit=5)` |
| Tool retry | `@agent.tool(retries=2)` + `raise ModelRetry('...')` |
| Structured output | `Agent(..., output_type=MyModel)` |
| Stream text | `async with agent.run_stream(...) as r: async for t in r.stream_text(): ...` |
| Multi-turn | `agent.run(prompt, message_history=prev.new_messages())` |
| Add Logfire | `logfire.configure(); logfire.instrument_pydantic_ai()` |
| Run evals | `Dataset(cases=[...]).evaluate_sync(my_fn)` |
| Async tests | `pytestmark = pytest.mark.anyio` |
| Determinism | `ModelSettings(temperature=0.0)` |
