# Alicization - AI Office Simulation

## High Level Architecture

Alicization is a multi-agent AI office simulation where users can create AI employees, organize them into teams, and assign them tasks. The system supports complex workflows with human-in-the-loop collaboration.

## Recent Progress: Human Collaboration System

### Overview
Implemented a comprehensive human collaboration system that allows AI agents to request input, approval, or review from humans during task execution. The system seamlessly integrates with the existing task/todo workflow.

### How It Works

#### 1. Agent Requests Human Input
When an AI agent needs human input, it calls the `humanCollabTool` with:
- **message**: Clear description of what's needed
- **type**: approval, review, question, or permission  
- **context**: Optional additional context

#### 2. System Response
The system:
- Creates a visible request message in the chat with emoji indicators
- Stores the request in the database for tracking
- Blocks the current task with status "blocked"
- Generates a unique `requestRef` for linking responses

#### 3. Human Response
When humans respond, they include the `requestRef` in their message. The system:
- Automatically links the response to the original request
- Marks the human request as "responded" 
- Adds the response as a new todo item
- Unblocks the task and restarts the workflow
- Agent continues with the human's input

### Workflow Integration

**Task Blocking**: Uses the existing `setTaskStatus("blocked")` mechanism
**Automatic Resumption**: When new input arrives for a blocked task, it automatically unblocks via `addTodoToTask`
**Workflow Restart**: Blocked tasks restart with a new workflow when input is received
**Context Preservation**: Full conversation context is maintained across blocking/unblocking

### Examples

```
Agent: "I need approval to delete these 50 files from the old project"
→ Task blocks, user sees: "✋ Human Input Requested (approval)"

User: "Yes, go ahead. Reference: abc-123"  
→ Task unblocks, agent continues with approval

Agent: "Please review this code before I deploy"
→ Task blocks, user sees: "👀 Human Input Requested (review)"

User: "Looks good but change line 15. Reference: def-456"
→ Task unblocks, agent makes changes and continues
```

### Technical Implementation

**Database**: `humanRequests` table tracks all requests and responses
**Workflow**: `chatWorkflow.ts` handles blocking/unblocking logic  
**Chat Integration**: `chat.ts` routes responses and manages task status
**Tool Integration**: Added to `createAdvancedTools` for all employees

### Benefits

- **Seamless**: No separate approval flows, works within existing chat
- **Trackable**: All requests stored and linked to responses
- **Flexible**: Supports various request types with appropriate UX
- **Efficient**: Only blocks when truly needed, auto-resumes when input arrives
- **Scalable**: Handles multiple concurrent requests across different threads

## Current State

The human collaboration system is fully implemented and integrated. Agents can now:
- Request approvals for sensitive operations
- Get human review on work before proceeding  
- Ask clarifying questions when requirements are unclear
- Request permissions for actions requiring authorization

Next steps could include:
- Priority/urgency levels for requests
- Timeout handling for abandoned requests  
- Rich media support for complex reviews
- Request delegation to other team members 