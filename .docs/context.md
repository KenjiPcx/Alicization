# Alicization - AI Office Simulation

## High Level Architecture

Alicization is a multi-agent AI office simulation where users can create AI employees, organize them into teams, and assign them tasks. The system supports complex workflows with human-in-the-loop collaboration.

## Recent Progress: Game-like HUD System

### Overview
Implemented a comprehensive game-like HUD (Heads-Up Display) system that provides an immersive gaming experience for managing the AI office simulation. The HUD includes a vertical speed dial for quick actions, a stats display similar to GTA-style games, and a streamlined task management interface.

### HUD Components

#### 1. Vertical Speed Dial (Top Left)
**Location**: Fixed position top-left corner
**Features**:
- Expandable floating action button with smooth animations
- Circular buttons for different functions
- Visual indicators for pending notifications
- Game-like color-coded buttons with hover effects
- Labels with "Coming Soon" for placeholder features

**Current Actions**:
- **User Tasks** (🔔): Shows pending human collaboration requests with live count badge
- **Settings** (⚙️): Opens settings dialog with theme, debug mode, and sign out
- **Profile** (👤): Placeholder for user profile management
- **Company** (🏢): Placeholder for company overview
- **Analytics** (📈): Placeholder for performance analytics

**Technical Implementation**:
- Built with Framer Motion for smooth animations
- Automatic badge updates based on real-time pending task count
- Integrates directly with SettingsDialog component
- Responsive design with proper z-indexing

#### 2. Stats HUD (Top Right)
**Location**: Fixed position top-right corner
**Features**:
- GTA-style performance indicators
- Real-time stats in a grid layout
- Color-coded metrics with appropriate icons
- Level/XP progression system
- System status indicators

**Current Metrics**:
- **Agents**: Active/Total agents online
- **Revenue**: Money made today
- **Tasks**: Active task count
- **Completed**: Tasks completed today
- **Efficiency**: Performance percentage with color coding
- **Uptime**: System availability
- **Level & XP**: Gamification with progress bar
- **System Status**: Online/offline indicator with pulse animation

**Technical Implementation**:
- Responsive card-based layout
- Dynamic color coding based on performance thresholds
- Currency formatting with internationalization
- Animated progress bars and status indicators
- TODO: Connect to real backend metrics

#### 3. User Tasks Management
**Features**:
- Modal-based task viewer triggered from speed dial
- Real-time display of pending human collaboration requests
- Type-specific icons and color coding (approval, review, question, permission)
- Time stamps with relative formatting ("2 hours ago")
- Action buttons for respond/dismiss
- Scrollable interface for multiple tasks

**Task Types**:
- **Approval** (✋): Orange - Yes/no decisions
- **Review** (👀): Blue - Feedback requests
- **Question** (❓): Purple - Clarification needed
- **Permission** (🔐): Red - Authorization requests

**Technical Implementation**:
- Connected to `userTasks` database table
- Uses `api.auth.currentUser` for authentication
- Real-time updates via Convex queries
- Proper loading states and error handling

### Settings Integration

**Updated Settings Dialog**:
- Moved from absolute positioning to speed dial integration
- Added sign out functionality directly in settings
- Maintains theme toggle and debug mode controls
- Clean modal interface with proper trigger handling

**Removed Components**:
- Old absolute positioned SignOutButton
- Standalone SettingsDialog positioning
- Redundant debug mode management

### Technical Architecture

**File Structure**:
```
components/hud/
├── speed-dial.tsx          # Main navigation component
├── stats-hud.tsx           # Performance metrics display
├── user-tasks.tsx          # Task list component
└── user-tasks-modal.tsx    # Modal wrapper for tasks
```

**State Management**:
- Real-time task count via Convex queries
- Debug mode managed at app level and passed down
- Modal state managed locally in HomePage
- Consistent with existing store patterns

**Styling**:
- Game-like aesthetic with vibrant colors
- Backdrop blur effects for modern glass-morphism
- Smooth animations and transitions
- Responsive design for different screen sizes
- Dark mode support throughout

### Integration Points

**Database Queries**:
- `userTasks.getAllPendingUserTasks`: Fetches user-specific pending tasks
- `auth.currentUser`: Gets authenticated user information
- Ready for future stats queries (agents, revenue, etc.)

**Component Integration**:
- Seamlessly integrated with existing office simulation
- Maintains compatibility with chat system
- No conflicts with sidebar or modal systems
- Proper z-index management for layering

### Benefits

- **Gaming Experience**: Provides an immersive, game-like interface
- **Quick Access**: Speed dial enables rapid navigation to key features
- **Real-time Feedback**: Live stats and notifications keep users informed
- **Scalable Design**: Ready for additional features and metrics
- **Modern UI**: Glass-morphism and smooth animations for professional feel
- **Accessibility**: Clear visual indicators and proper contrast ratios

## Previous Progress: Human Collaboration System

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
**UI Component**: `HumanCollabPreview` provides rich visual feedback in chat

### Benefits

- **Seamless**: No separate approval flows, works within existing chat
- **Trackable**: All requests stored and linked to responses
- **Flexible**: Supports various request types with appropriate UX
- **Efficient**: Only blocks when truly needed, auto-resumes when input arrives
- **Scalable**: Handles multiple concurrent requests across different threads

## Current State

The system now features both a comprehensive human collaboration system and a modern game-like HUD interface. Users can:

### Game Interface
- Use the speed dial for quick access to tasks, settings, and future features
- Monitor real-time performance through the stats HUD
- Manage pending human collaboration requests through an intuitive task interface
- Experience a gaming-style interface that makes work management engaging

### AI Collaboration
- Request approvals for sensitive operations
- Get human review on work before proceeding  
- Ask clarifying questions when requirements are unclear
- Request permissions for actions requiring authorization

### Human Collaboration Tool Preview

Created a visual tool preview component (`HumanCollabPreview`) that provides rich feedback for human collaboration requests in the chat interface:

**Visual Design**:
- Beige/amber color scheme (human skin tone theme) to distinguish from other tools
- Full dark mode support with appropriate color variants
- UserIcon and MessageIcon for clear visual identity  
- Animated pulse effects while waiting for response
- Type-specific colors: orange for approval, yellow for review, red for permission

**Features**:
- Shows request type with appropriate emoji (✋ approval, 👀 review, ❓ question, 🔐 permission)
- Displays main message with MessageIcon
- Optional context section with lightbulb icon
- Status badges (APPROVAL NEEDED, REVIEW REQUESTED, etc.)
- Waiting indicator with animated pulse
- Clean "request sent" state with MessageIcon when completed

**Integration**:
- Added to `components/chat/messages/tool-previews/`
- Exported from tool-previews index
- Integrated into message.tsx switch statements for both 'call' and 'result' states
- Handles `requestHumanInput` tool calls

The component follows the existing hacker/gamer aesthetic while using warm beige tones to clearly indicate human involvement in the workflow. Includes full dark mode support with appropriate color adjustments for both light and dark themes.

## Next Steps

### Immediate
- Connect stats HUD to real backend metrics (agent count, revenue, efficiency)
- Implement respond/dismiss functionality for user tasks
- Add priority levels and timeout handling for collaboration requests

### Future Features
- Rich media support for complex reviews
- Request delegation to other team members
- Advanced analytics dashboard
- Company profile and leveling system
- Performance-based rewards and achievements 