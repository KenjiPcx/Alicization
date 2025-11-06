# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Alicization is an AI-powered office simulation where users can create AI employees, organize them into teams, and watch them work in a 3D WeWork-style environment. Employees are autonomous agents that can navigate the office, collaborate, and handle complex workflows with human-in-the-loop collaboration.

**Tech Stack**:
- **Frontend**: Next.js 15 with TypeScript, React 19, Tailwind CSS
- **Backend**: Convex (real-time database and serverless functions)
- **3D Graphics**: Three.js with React Three Fiber
- **AI**: Multi-agent system using @convex-dev/agent with multiple providers
- **Authentication**: Convex Auth

## Essential Commands

### Development
```bash
npm run dev                  # Run both frontend and backend in parallel
npm run dev:frontend         # Run Next.js frontend only
npm run dev:backend          # Run Convex backend only
npm run build               # Build the Next.js application
npm run lint                # Run ESLint
convex dev --once           # Run Convex functions once (for testing)
convex dashboard            # Open Convex dashboard
```

### Database Operations
```bash
npx convex run seed         # Seed the database
npx convex run <function>   # Run a Convex function directly
```

## Architecture Overview

### Core Systems

1. **3D Office Simulation**: WeWork-style floor with teams, desks, and navigable spaces using A* pathfinding
2. **Multi-Agent System**: AI employees with personalities, skills, and role-based capabilities (CEO, CTO, CFO, etc.)
3. **Dynamic Skill Learning**: Employees learn new workflows organically when users teach them
4. **Workflow Orchestration**: Complex task management with blocking/unblocking and human collaboration
5. **Micro Apps System**: Generative UI components for specialized dashboards (KPI, Company Config, Employee Drive)

### Key Directories

- `/convex/`: Backend functions, schema, and business logic
  - `schema.ts`: Database schema definition
  - `chat.ts`, `chatNode.ts`, `chatWorkflow.ts`: Chat and workflow management
  - `employees.ts`, `teams.ts`, `companies.ts`: Core entity management
  - `artifacts.ts`: Artifact generation and management
  - `lib/`: Shared validators and utilities

- `/lib/ai/`: AI agent configuration and tools
  - `agents/`: Employee and CEO agent definitions
  - `tools/base/`: Core tools (artifacts, web search, interpreter, MCP)
  - `tools/advanced/`: Complex tools (planner, memory, scheduler)
  - `tools/office/`: Role-specific tools (CEO, CTO, CFO, etc.)
  - `model.ts`: AI model configuration

- `/components/`: React components
  - `chat/`: Chat interface components
  - `office-simulation/`: 3D office rendering
  - `micro-apps/`: Artifact and mini-application components
  - `ui/`: Shadcn UI components

### Database Schema Key Tables

- **employees**: AI agents with personalities, skills, and team assignments
- **teams**: Groups of employees with desk clusters
- **chats**: Chat threads between users and employees
- **artifacts**: Generated content (code, documents)
- **officeObjects**: 3D objects in the office space
- **toolsets**: Collections of tools that can be assigned to employees
- **skills**: Capabilities that employees can acquire
- **memories**: Context storage for conversations and user preferences
- **backgroundJobStatuses**: Real-time status updates for long-running operations

### Tool & Skill Systems

**Toolsets** (collections of related tools):
- Built-in: Artifact Management, Planning, Memory, Human Collaboration, File Management, KPI Management
- MCP: External integrations via Model Context Protocol
- Assignment: IT managers assign toolsets to employees

**Dynamic Skills**:
- Users teach skills through natural language ("let me teach you a skill")
- System generates documentation and saves to company knowledge base
- Skills tracked with proficiency levels (learning → competent → proficient → expert)

### Key Workflows

1. **Message Queue System**: FIFO processing when agents are busy, with UI indicators
2. **Human Collaboration**: Agents request approval/review/permission with blocking workflows
3. **Office Builder Mode**: Drag-and-drop objects with 90° rotation controls
4. **Task Management**: Todo lists with status tracking (pending → in_progress → completed/blocked)

## Development Guidelines

### Code Patterns
- Use `withToolErrorHandling` for consistent tool error handling (see `.docs/tool-error-handling-migration.md`)
- Return structured objects from tools: `{ success: boolean, message: string, ...data }`
- Use Convex mutations/queries for all database operations
- Stream AI responses using `@convex-dev/agent` streaming utilities

### Important Practices
- **Never run `npm run dev` or `npm run build`** - user will do this manually
- **Plan before implementing** - break down complex tasks into smaller chunks
- **Use existing patterns** - check neighboring files for conventions
- **No hardcoded positions** - all 3D objects load from database
- **Maintain type safety** - use proper TypeScript interfaces

## Environment Variables

Required in `.env.local`:
- Convex Auth configuration (automatically set up by setup.mjs)
- AI provider API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
- E2B_API_KEY for code interpreter functionality
- TAVILY_API_KEY for web search

## UI/UX Features

### Game-like HUD System
- **Speed Dial** (top-left): Quick access to tasks, settings, and features
- **Stats HUD** (top-right): GTA-style performance metrics and XP system
- **User Tasks Modal**: Manage human collaboration requests
- **Employee Profiles**: GitHub-style profiles with skills and gamification

### 3D Office Features
- **Navigation**: A* pathfinding with obstacle avoidance
- **Status Indicators**: Floating indicators above employees with auto-hide
- **Builder Mode**: Drag objects and rotate in 90° increments
- **Team Clusters**: Organized desk arrangements for teams

## Recent Features & Next Steps

### Completed
- Message queue system for handling concurrent requests
- Human collaboration with workflow blocking/unblocking
- Dynamic skill learning system with documentation generation
- Toolset management system replacing individual tools
- Object rotation system with database persistence
- Micro apps for specialized dashboards

### Immediate Next Steps
- Connect stats HUD to real backend metrics
- Test toolset assignment workflow end-to-end
- Implement MCP toolset integration

See `.docs/context.md` for detailed progress tracking and upcoming features.