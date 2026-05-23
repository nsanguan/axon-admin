---
name: langgraph-testing
description: >
  LangGraph production session testing — stateful agent graphs with persistent
  checkpointers (PostgreSQL), thread-based session management, streaming, HITL
  interrupts, fault tolerance, time travel, and LangSmith observability. Use for
  any LangGraph Python agent work in the AXON Admin project.
---

# LangGraph Production Session Testing Skill

## Overview

LangGraph is a Python library for building **stateful**, **durable** agent
orchestrations. Every graph execution is checkpointed at each super-step, giving
you fault-tolerance, human-in-the-loop (HITL), time-travel debugging, and
cross-session memory.

Official docs: https://docs.langchain.com/oss/python/langgraph/

---

## 1. Installation

```bash
# Core LangGraph
pip install -U langgraph

# PostgreSQL checkpointer (production)
pip install langgraph-checkpoint-postgres

# SQLite checkpointer (local dev)
pip install langgraph-checkpoint-sqlite

# LangGraph CLI (includes in-memory server)
pip install -U "langgraph-cli[inmem]"

# Python SDK for hitting the local/deployed API
pip install langgraph-sdk

# LangSmith tracing
pip install langsmith
```

---

## 2. Core Concepts

### State & Graph

```python
from typing import Annotated
from typing_extensions import TypedDict
from operator import add
from langgraph.graph import StateGraph, START, END

# Define your state schema
class AgentState(TypedDict):
    messages: Annotated[list, add]   # reducer accumulates messages
    status: str                       # last-write-wins (no reducer)

def call_llm(state: AgentState) -> AgentState:
    # ... call your LLM or tool
    return {"messages": [{"role": "assistant", "content": "Hello"}], "status": "done"}

# Build graph
builder = StateGraph(AgentState)
builder.add_node("call_llm", call_llm)
builder.add_edge(START, "call_llm")
builder.add_edge("call_llm", END)

# Compile with checkpointer
from langgraph.checkpoint.memory import InMemorySaver
graph = builder.compile(checkpointer=InMemorySaver())
```

### Threads — the unit of a Production Session

Every conversation is a **thread** identified by a `thread_id`. All checkpoints
for that session are stored under this key. You MUST pass `thread_id` when using a
checkpointer.

```python
config = {"configurable": {"thread_id": "user-42-session-001"}}
result = graph.invoke({"messages": [{"role": "user", "content": "Hi"}]}, config)
```

---

## 3. Checkpointers

| Checkpointer | Package | Use Case |
|---|---|---|
| `InMemorySaver` | `langgraph` (built-in) | Dev, unit tests — no persistence |
| `SqliteSaver` / `AsyncSqliteSaver` | `langgraph-checkpoint-sqlite` | Local integration tests |
| `PostgresSaver` / `AsyncPostgresSaver` | `langgraph-checkpoint-postgres` | **Production** |
| `CosmosDBSaver` | `langchain-azure-cosmosdb` | Azure production |

### PostgresSaver (Production)

```python
from langgraph.checkpoint.postgres import PostgresSaver

DB_URI = "postgresql://axon:axon@202.71.1.13:5435/axon_admin"

with PostgresSaver.from_conn_string(DB_URI) as checkpointer:
    checkpointer.setup()  # creates tables on first run
    graph = builder.compile(checkpointer=checkpointer)
    result = graph.invoke(input, config)
```

### AsyncPostgresSaver (Async production — preferred in NestJS-called Python services)

```python
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
import asyncio

async def run():
    async with AsyncPostgresSaver.from_conn_string(DB_URI) as checkpointer:
        await checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer)
        result = await graph.ainvoke(input, config)

asyncio.run(run())
```

### Encrypted Checkpointer (Security-hardened production)

```python
import os
from langgraph.checkpoint.serde.encrypted import EncryptedSerializer
from langgraph.checkpoint.postgres import PostgresSaver

# Set LANGGRAPH_AES_KEY env var to a 32-byte base64 key
serde = EncryptedSerializer.from_pycryptodome_aes()  # reads LANGGRAPH_AES_KEY
checkpointer = PostgresSaver.from_conn_string(DB_URI, serde=serde)
checkpointer.setup()
```

---

## 4. Application Structure (`langgraph.json`)

Required for `langgraph dev` and LangSmith Deployment.

```
my-agent/
├── src/
│   └── agent.py        # graph definition
├── .env                # environment variables
├── requirements.txt    # or pyproject.toml
└── langgraph.json      # LangGraph config
```

**`langgraph.json`**:
```json
{
  "dependencies": [".", "langchain_openai"],
  "graphs": {
    "agent": "./src/agent.py:graph"
  },
  "env": "./.env",
  "store": {
    "index": {
      "embed": "openai:text-embedding-3-small",
      "dims": 1536,
      "fields": ["$"]
    }
  }
}
```

**`src/agent.py`** must expose the compiled graph at module level:

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver

builder = StateGraph(...)
# ... add nodes and edges ...

# When langgraph dev runs, it injects the checkpointer automatically.
# Export the *builder* or the compiled graph.
graph = builder.compile()   # langgraph dev replaces checkpointer at runtime
```

---

## 5. Local Development — `langgraph dev`

`langgraph dev` starts an **in-memory** Agent Server (not for production) with:
- REST API at `http://127.0.0.1:2024`
- Studio UI at `https://smith.langchain.com/studio/?baseUrl=http://127.0.0.1:2024`
- Auto-reload on file changes

```bash
# Install CLI with in-memory support
pip install -U "langgraph-cli[inmem]"

# Start the dev server (reads langgraph.json in CWD)
langgraph dev

# Safari / tunnel
langgraph dev --tunnel

# Custom host/port
langgraph dev --host 0.0.0.0 --port 8500
```

**Test the running server via SDK:**

```python
from langgraph_sdk import get_sync_client

client = get_sync_client(url="http://localhost:2024")

# Stateless (threadless) run
for chunk in client.runs.stream(
    None,         # no thread — stateless
    "agent",      # graph name from langgraph.json
    input={"messages": [{"role": "human", "content": "Hello"}]},
    stream_mode="messages-tuple",
):
    print(chunk.event, chunk.data)
```

**Test with a persistent thread (session):**

```python
import asyncio
from langgraph_sdk import get_client

async def test_session():
    client = get_client(url="http://localhost:2024")

    # Create a thread (= a session)
    thread = await client.threads.create()
    thread_id = thread["thread_id"]

    # First message
    async for chunk in client.runs.stream(
        thread_id,
        "agent",
        input={"messages": [{"role": "human", "content": "My name is Alice"}]},
        stream_mode="updates",
    ):
        print(chunk)

    # Follow-up — agent remembers Alice
    async for chunk in client.runs.stream(
        thread_id,
        "agent",
        input={"messages": [{"role": "human", "content": "What is my name?"}]},
        stream_mode="updates",
    ):
        print(chunk)

asyncio.run(test_session())
```

---

## 6. Testing Patterns

### 6.1 Unit Test — InMemorySaver

Create a fresh checkpointer and graph per test. Never share state between tests.

```python
import pytest
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver

class MyState(TypedDict):
    my_key: str

def create_graph() -> StateGraph:
    graph = StateGraph(MyState)
    graph.add_node("node1", lambda state: {"my_key": "hello from node1"})
    graph.add_node("node2", lambda state: {"my_key": "hello from node2"})
    graph.add_edge(START, "node1")
    graph.add_edge("node1", "node2")
    graph.add_edge("node2", END)
    return graph

def test_basic_execution():
    checkpointer = InMemorySaver()
    compiled = create_graph().compile(checkpointer=checkpointer)
    result = compiled.invoke(
        {"my_key": "initial"},
        config={"configurable": {"thread_id": "test-1"}},
    )
    assert result["my_key"] == "hello from node2"

def test_session_memory():
    """State persists within the same thread_id."""
    checkpointer = InMemorySaver()
    compiled = create_graph().compile(checkpointer=checkpointer)
    config = {"configurable": {"thread_id": "session-42"}}

    # First invocation
    compiled.invoke({"my_key": "turn-1"}, config)

    # Get state — should reflect last execution
    snapshot = compiled.get_state(config)
    assert snapshot.values["my_key"] == "hello from node2"

    # State history (most recent first)
    history = list(compiled.get_state_history(config))
    assert len(history) == 4  # empty, input, node1, node2 checkpoints
```

### 6.2 Test Individual Nodes

```python
def test_individual_node():
    compiled = create_graph().compile(checkpointer=InMemorySaver())
    # Access node directly — bypasses checkpointer
    result = compiled.nodes["node1"].invoke({"my_key": "initial"})
    assert result["my_key"] == "hello from node1"
```

### 6.3 Partial Execution Test (update_state + interrupt_after)

Use `update_state` to seed the graph at a specific point, then `interrupt_after`
to stop at a specific node. Ideal for testing middle sections of large graphs.

```python
def test_partial_execution_from_node2_to_node3():
    class MultiState(TypedDict):
        my_key: str

    graph = StateGraph(MultiState)
    graph.add_node("node1", lambda s: {"my_key": "n1"})
    graph.add_node("node2", lambda s: {"my_key": "n2"})
    graph.add_node("node3", lambda s: {"my_key": "n3"})
    graph.add_node("node4", lambda s: {"my_key": "n4"})
    graph.add_edge(START, "node1")
    graph.add_edge("node1", "node2")
    graph.add_edge("node2", "node3")
    graph.add_edge("node3", "node4")
    graph.add_edge("node4", END)

    compiled = graph.compile(checkpointer=InMemorySaver())
    config = {"configurable": {"thread_id": "partial-test-1"}}

    # Seed state as if node1 just completed — execution will resume at node2
    compiled.update_state(
        config=config,
        values={"my_key": "seeded"},
        as_node="node1",
    )

    # Run from node2 and stop after node3
    result = compiled.invoke(
        None,   # None = resume from saved state
        config=config,
        interrupt_after=["node3"],
    )
    assert result["my_key"] == "n3"  # node4 did NOT run
```

### 6.4 Integration Test — PostgresSaver

```python
import pytest
from langgraph.checkpoint.postgres import PostgresSaver

DB_URI = "postgresql://axon:axon@202.71.1.13:5435/axon_admin"

@pytest.fixture(scope="session")
def pg_checkpointer():
    with PostgresSaver.from_conn_string(DB_URI) as cp:
        cp.setup()
        yield cp

def test_production_session_persists(pg_checkpointer):
    compiled = create_graph().compile(checkpointer=pg_checkpointer)
    thread_id = f"integration-test-{uuid.uuid4()}"
    config = {"configurable": {"thread_id": thread_id}}

    result = compiled.invoke({"my_key": "initial"}, config)
    assert result["my_key"] == "hello from node2"

    # Verify state is actually persisted in Postgres
    snapshot = compiled.get_state(config)
    assert snapshot.values["my_key"] == "hello from node2"
```

### 6.5 Time Travel — Replay & Fork

```python
def test_time_travel():
    compiled = create_graph().compile(checkpointer=InMemorySaver())
    config = {"configurable": {"thread_id": "tt-test-1"}}
    compiled.invoke({"my_key": "initial"}, config)

    history = list(compiled.get_state_history(config))

    # Find checkpoint just before node2 ran
    before_node2 = next(s for s in history if s.next == ("node2",))

    # Replay from that checkpoint — re-runs node2 onward
    replay_config = before_node2.config
    replayed = compiled.invoke(None, replay_config)
    assert replayed["my_key"] == "hello from node2"

    # Fork: update state at that checkpoint and run a different path
    compiled.update_state(replay_config, {"my_key": "overridden"}, as_node="node1")
    forked = compiled.invoke(None, replay_config)
    assert forked["my_key"] == "hello from node2"  # node2 runs with new input
```

---

## 7. Streaming

```python
# stream_mode options:
#   "values"         — full state after each super-step
#   "updates"        — only the delta from each node
#   "messages"       — token-by-token message chunks (LLM streaming)
#   "messages-tuple" — (message, metadata) tuples

config = {"configurable": {"thread_id": "stream-test-1"}}

# Stream updates
for event in graph.stream(
    {"messages": [{"role": "user", "content": "Hello"}]},
    config,
    stream_mode="updates",
):
    print(event)  # {"node_name": {"key": "value"}}

# Async streaming
async for event in graph.astream(input, config, stream_mode="messages"):
    print(event)

# Multiple modes simultaneously
for chunk in graph.stream(input, config, stream_mode=["values", "updates"]):
    mode, data = chunk
    print(f"Mode: {mode}, Data: {data}")
```

---

## 8. Human-in-the-Loop (HITL)

```python
from langgraph.types import interrupt, Command

def human_review_node(state: AgentState):
    # Pause execution and surface the value to the human
    human_decision = interrupt({"question": "Approve this action?", "data": state})
    return {"status": f"approved: {human_decision}"}

# Compile with interrupt
builder.add_node("human_review", human_review_node)
compiled = builder.compile(checkpointer=InMemorySaver(), interrupt_before=["human_review"])

config = {"configurable": {"thread_id": "hitl-1"}}

# Run until interrupt
result = compiled.invoke(input, config)
# result will be the state at the interrupt point

# Resume after human provides input
resumed = compiled.invoke(
    Command(resume="approved"),  # human's answer
    config,
)
```

---

## 9. Fault Tolerance & Retry Policy

```python
from langgraph.types import RetryPolicy

def flaky_api_node(state: AgentState):
    # ... call external API that may fail
    pass

builder.add_node(
    "flaky_api",
    flaky_api_node,
    retry=RetryPolicy(
        max_attempts=3,
        initial_interval=1.0,   # seconds
        backoff_factor=2.0,     # exponential backoff
        retry_on=[Exception],   # which exceptions trigger retry
    ),
)
```

---

## 10. Backward Compatibility — Safe State Schema Evolution

When adding new fields to a running production graph (threads already in-flight):

```python
from typing import Annotated
from typing_extensions import TypedDict

# BEFORE (deployed version)
class AgentStateV1(TypedDict):
    messages: Annotated[list, add]

# AFTER (new version — safe to deploy without breaking in-flight runs)
class AgentStateV2(TypedDict):
    messages: Annotated[list, add]
    # New field with a default value — existing checkpoints won't have it,
    # LangGraph uses the default automatically on resume
    summary: str | None  # defaults to None

# For fields with reducers, use default_factory:
from langgraph.graph import add_messages
class AgentStateV3(TypedDict):
    messages: Annotated[list, add_messages]
    tool_calls: Annotated[list, add]  # empty list default handles missing checkpoints
```

**Rule**: Always add new state fields with a sensible default (`None`, `[]`, `""`).
Never remove or rename existing fields — that breaks serialization of stored
checkpoints.

---

## 11. Production Deployment — LangSmith Cloud

### Deploy Steps

```bash
# 1. Push code to GitHub (public or private repo)
# 2. Log in to LangSmith: https://smith.langchain.com
# 3. Navigate to Deployments → New Deployment
# 4. Connect GitHub repo and click Submit
# 5. Copy the API URL from Deployment Details
```

### Test Deployed Agent via SDK

```python
from langgraph_sdk import get_sync_client

client = get_sync_client(
    url="https://your-deployment.langsmith.com",
    api_key="lsv2_...",
)

# Create a persistent thread (production session)
thread = client.threads.create()
thread_id = thread["thread_id"]

# Invoke on thread (state persists in PostgreSQL under the hood)
for chunk in client.runs.stream(
    thread_id,
    "agent",
    input={"messages": [{"role": "human", "content": "Hello"}]},
    stream_mode="updates",
):
    print(chunk.event, chunk.data)
```

### RemoteGraph — Call Deployed Graph from Tests

```python
from langgraph.pregel.remote import RemoteGraph

# Connect to deployed graph — state is stored remotely
remote_graph = RemoteGraph(
    "agent",
    url="https://your-deployment.langsmith.com",
    api_key="lsv2_...",
)

config = {"configurable": {"thread_id": "remote-test-1"}}
result = remote_graph.invoke({"messages": [{"role": "user", "content": "Hello"}]}, config)
```

---

## 12. LangSmith Observability

```bash
# .env
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=axon-admin-production
```

```python
import os
os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_API_KEY"] = "lsv2_..."
os.environ["LANGSMITH_PROJECT"] = "axon-admin-production"

# All graph.invoke() / graph.stream() calls are automatically traced
result = graph.invoke(input, config)
# View traces at: https://smith.langchain.com
```

---

## 13. Memory Store — Cross-Thread Long-Term Memory

Checkpoints store state per-thread. For user-level memory shared across all
threads, use the `Store` interface.

```python
from langgraph.store.memory import InMemoryStore
# Production: use PostgresStore from langgraph-checkpoint-postgres

store = InMemoryStore()

# Compile graph with both checkpointer AND store
graph = builder.compile(checkpointer=checkpointer, store=store)

# Access store inside any node via Runtime injection
from langgraph.runtime import Runtime
from dataclasses import dataclass

@dataclass
class UserContext:
    user_id: str

async def memory_node(state: AgentState, runtime: Runtime[UserContext]):
    namespace = (runtime.context.user_id, "memories")

    # Save a memory
    await runtime.store.aput(namespace, "key-1", {"fact": "User likes pizza"})

    # Search memories
    memories = await runtime.store.asearch(
        namespace,
        query="food preferences",
        limit=3,
    )
    return {"messages": [{"role": "assistant", "content": str(memories)}]}

# Invoke with context
config = {"configurable": {"thread_id": "thread-1"}}
result = await graph.ainvoke(
    {"messages": [{"role": "user", "content": "Hi"}]},
    config,
    context=UserContext(user_id="user-42"),
)
```

---

## 14. Full Production Session Example (AXON Admin Context)

```python
"""
AXON Admin — MCP Tool Agent with PostgreSQL Persistence
Demonstrates a full production-grade session pattern.
"""
from typing import Annotated
from typing_extensions import TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph import add_messages
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

DB_URI = "postgresql://axon:axon@202.71.1.13:5435/axon_admin"

# --- State ---
class AxonAgentState(TypedDict):
    messages: Annotated[list, add_messages]
    plugin_id: str | None
    status: str

# --- Nodes ---
async def resolve_plugin(state: AxonAgentState):
    # Look up plugin from axon_mcp schema
    return {"plugin_id": "plugin-xyz", "status": "resolved"}

async def call_mcp_tool(state: AxonAgentState):
    # Call AXON Control Tower at port 8200
    return {"messages": [{"role": "assistant", "content": "Tool called"}], "status": "done"}

# --- Graph ---
builder = StateGraph(AxonAgentState)
builder.add_node("resolve_plugin", resolve_plugin)
builder.add_node("call_mcp_tool", call_mcp_tool)
builder.add_edge(START, "resolve_plugin")
builder.add_edge("resolve_plugin", "call_mcp_tool")
builder.add_edge("call_mcp_tool", END)

# --- Production entrypoint ---
async def run_session(session_id: str, user_input: str):
    async with AsyncPostgresSaver.from_conn_string(DB_URI) as checkpointer:
        await checkpointer.setup()
        graph = builder.compile(checkpointer=checkpointer)

        config = {"configurable": {"thread_id": session_id}}
        result = await graph.ainvoke(
            {"messages": [{"role": "user", "content": user_input}],
             "plugin_id": None, "status": "pending"},
            config,
        )
        return result

# --- Test ---
import pytest

@pytest.mark.asyncio
async def test_axon_agent_session():
    from langgraph.checkpoint.memory import InMemorySaver
    from langgraph.graph import StateGraph

    checkpointer = InMemorySaver()
    graph = builder.compile(checkpointer=checkpointer)
    config = {"configurable": {"thread_id": "axon-test-001"}}

    result = await graph.ainvoke(
        {"messages": [{"role": "user", "content": "Run plugin"}],
         "plugin_id": None, "status": "pending"},
        config,
    )

    assert result["status"] == "done"
    assert result["plugin_id"] == "plugin-xyz"

    # Verify state is checkpointed
    snapshot = graph.get_state(config)
    assert snapshot.values["status"] == "done"
```

---

## 15. Quick Reference

| Task | Code |
|---|---|
| Install | `pip install -U langgraph langgraph-checkpoint-postgres "langgraph-cli[inmem]"` |
| In-memory checkpointer (tests) | `from langgraph.checkpoint.memory import InMemorySaver` |
| Postgres checkpointer (prod) | `from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver` |
| Run with thread | `graph.invoke(input, {"configurable": {"thread_id": "x"}})` |
| Get current state | `graph.get_state(config)` |
| Get state history | `list(graph.get_state_history(config))` |
| Seed state for partial test | `graph.update_state(config, values, as_node="prev_node")` |
| Stop at node | `graph.invoke(None, config, interrupt_after=["node_name"])` |
| Resume after HITL | `graph.invoke(Command(resume=value), config)` |
| Stream updates | `graph.stream(input, config, stream_mode="updates")` |
| Start local dev server | `langgraph dev` |
| LangSmith tracing | `LANGSMITH_TRACING=true` |
| Test deployed graph | `from langgraph.pregel.remote import RemoteGraph` |
