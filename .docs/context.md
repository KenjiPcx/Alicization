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

The system now features a comprehensive human collaboration system, a modern game-like HUD interface, and a detailed employee profile system. Users can:

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

### Employee Profile System
- View comprehensive employee profiles in a GitHub-style interface
- Display gamified employee stats with XP and leveling system
- Manage employee skills with proficiency tracking
- View assigned tools and access permissions
- Organize skills by categories with visual proficiency indicators

### Micro Apps System
- Dynamic generative UI components for specialized data dashboards
- Role-based access control (CEO, Employee, HR) with different available apps
- Seamlessly integrated with AI agent tooling for contextual data interaction
- Support for KPI dashboards, company configuration, and employee management interfaces

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

## Employee Skills Management System

### Overview
Implemented a comprehensive skills management system that allows dynamic skill tracking and proficiency development for AI employees. The system supports skill sharing, categorization, and gamified progression tracking.

### Database Schema

**Skills Table**:
- `name`: Skill name (e.g., "React Development", "Project Management")
- `description`: Detailed description of the skill
- `proficiencyLevel`: Current proficiency level (learning, competent, proficient, expert)
- `isShareable`: Whether the skill can be shared across employees
- `userId`: Owner of the skill
- `createdAt`: Creation timestamp
- `stats`: Optional performance metrics (execution count, average time, success rate)

**Employee-to-Skills Junction Table**:
- `employeeId`: Reference to employee
- `skillId`: Reference to skill
- `proficiencyLevel`: Employee's proficiency (learning, competent, proficient, expert)
- `dateAcquired`: When the employee acquired this skill
- `notes`: Optional notes about learning or expertise

### Features

**Skill Management**:
- Create, update, and delete skills
- Mark skills as shareable across employees
- Track individual proficiency levels and performance statistics
- Support dynamic skill learning and documentation

**Employee Skill Tracking**:
- Assign skills to employees with proficiency levels
- Track skill acquisition dates
- Add notes about learning progress or specific expertise
- Visual proficiency indicators with color coding

**Gamification Elements**:
- XP system based on skill proficiency levels
- Employee leveling system (Level = total skill points / 10)
- Visual progress bars and achievement indicators
- Color-coded proficiency badges

**Profile Interface**:
- GitHub-style employee profiles
- All skills displayed with acquisition dates and proficiency indicators
- Proficiency overview charts showing skill distribution
- Tools and access permissions display
- Role-based badges (CEO, Supervisor, etc.)

### Technical Implementation

**Backend (Convex)**:
- `convex/skills.ts`: Comprehensive CRUD operations for skills
- `convex/employees.ts`: Enhanced with skills data joining
- Type-safe queries with proper user authorization
- Efficient database indexing for performance

**Frontend Components**:
- `components/micro-apps/office/employee-config.tsx`: Main profile interface
- GitHub-inspired layout with modern gaming aesthetics
- Responsive design with dark mode support
- Interactive skill management interface

**Integration**:
- Seamlessly integrated with office micro app system
- Accessible through employee context in conversations
- Real-time data updates via Convex queries
- Proper error handling and loading states

### Benefits

- **Dynamic Learning**: No hardcoded workflow tools - agents learn and document skills organically
- **Job-Based Organization**: Skills are naturally grouped by employee roles rather than artificial categories
- **Performance Metrics**: Optional statistics tracking for future optimization and learning analysis
- **Visual Feedback**: Gamified interface makes skill development engaging
- **Collaboration**: Shareable skills enable knowledge transfer between employees
- **Simplified Management**: Streamlined schema focused on practical skill tracking and proficiency

## Dynamic Skill Learning System

### Overview
Implemented a revolutionary dynamic skill learning system that allows employees to learn new workflows organically when users teach them, eliminating the need for hardcoded workflow tools.

### How It Works

**User Teaches a Skill**:
1. User says "let me teach you a skill" followed by detailed workflow description
2. Employee agent calls `learnSkill` tool with comprehensive parameters
3. System creates skill record and assigns it to the employee
4. Automatically generates structured documentation artifact
5. Documentation gets saved to company files for institutional knowledge

**Skill Learning Process**:
- **Skill Creation**: Creates skill record with proficiency level and shareability settings
- **Employee Assignment**: Links skill to employee with acquisition date and notes
- **Documentation Generation**: Creates comprehensive workflow documentation with:
  - Overview and prerequisites
  - Step-by-step process instructions
  - Common issues and troubleshooting
  - Tips and best practices
  - References to related skills

**Automatic Documentation Saving**:
- Extended artifacts system with `saveAsDocumentation` flag
- Automatically saves skill documentation to company files
- Builds searchable institutional knowledge base
- Enables knowledge sharing across employees

### Technical Implementation

**Learn Skill Tool** (`lib/ai/tools/advanced/learn-skill.ts`):
- Context-injected tool with proper error handling
- Creates skill and employee-skill association
- Generates structured documentation prompt
- Triggers artifact creation with auto-save

**Enhanced Artifacts System** (`lib/ai/tools/base/artifacts.ts`):
- Added `saveAsDocumentation` parameter to both create and update tools
- Automatically saves artifacts to company files when flag is true
- Eliminates need for separate file creation tools

**Internal Database Operations** (`convex/skills.ts`):
- Added internal mutations for agent tool usage
- `internalCreateSkill`: Creates skills from agent context
- `internalAddSkillToEmployee`: Assigns skills with proper validation

**Employee Tools Integration** (`lib/ai/tools/office/employee.ts`):
- Integrated learn skill tool into all employee toolsets
- Available to all employees for organic skill development

### Benefits

- **Organic Learning**: No hardcoded workflows - agents learn naturally
- **Scalable Knowledge**: Unlimited skill development with documentation
- **Institutional Memory**: All learned skills become company knowledge
- **Dynamic Growth**: Skills evolve based on actual business needs
- **Knowledge Sharing**: Shareable skills enable cross-training
- **Performance Tracking**: Stats field ready for optimization metrics

### User Experience Updates

**Employee Profile Interface**:
- Updated empty states with helpful guidance
- Skills: "Say 'let me teach you a skill' to teach this employee a new workflow"
- Tools: "Contact HR to assign tools and access permissions"
- Removed add/assign buttons in favor of natural language interaction

This system transforms static AI employees into dynamic learners who grow their capabilities organically through user interaction, building a living knowledge base that scales with the business.

## Micro Apps System

### Overview
Implemented a dynamic micro apps system that provides specialized generative UI components for data dashboards and management interfaces. These micro apps are context-aware, role-based applications that agents can open to provide rich interactive experiences for specific business functions.

### Architecture

**Generative UI Approach**:
- Micro apps are dynamically generated UI components rather than static pages
- Created on-demand by AI agents based on contextual needs
- Seamlessly integrated into the chat interface as interactive artifacts
- Support for complex data visualization and management workflows

**Role-Based Access Control**:
- **CEO**: Full access to all micro apps (KPI Dashboard, Company Config, Employee Config)
- **Employee**: Limited access (KPI Dashboard, Employee Config)
- **HR**: Specialized access for people management
- Access levels enforced at the tool level with proper validation

### Available Micro Apps

#### 1. KPI Dashboard
**Purpose**: Real-time performance monitoring and analytics
**Features**:
- Live metrics display for business performance
- Interactive charts and graphs
- Key performance indicator tracking
- Data visualization for decision making
- Customizable dashboard views

#### 2. Company Configuration (CEO Only)
**Purpose**: High-level company settings and management
**Features**:
- Company-wide policy management
- Organizational structure configuration
- System-level settings and preferences
- Strategic planning interfaces
- Administrative controls

#### 3. Employee Configuration
**Purpose**: Individual employee management and profiles
**Features**:
- Comprehensive employee profile viewing
- Skills management and tracking
- Tool assignment and access control
- Performance monitoring and analytics
- Training and development tracking

#### 4. Employee Drive
**Purpose**: Comprehensive file and resource management for employees
**Features**:
- Access to both documentation and data files
- Skill-based file organization and browsing
- Search and filter capabilities across all file types
- AI-generated workflow documentation
- Team drive data files and environment resources
- Company knowledge base access
- Real-time searchability status
- File type indicators (Documentation vs Data Files)

### Technical Implementation

**Tool Integration** (`lib/ai/tools/advanced/office-micro-app.ts`):
- `createOpenOfficeMicroAppTool`: Factory function for role-specific micro app access
- Context-injected with kpiScopeAndId for proper data scoping
- Type-safe parameters with Zod validation
- Custom title support for specialized use cases

**Parameters**:
- `name`: Enum of available micro app types based on role
- `title`: Optional custom title for the micro app interface
- Returns microAppType and scoping information for UI rendering

**Agent Integration**:
- Available to all AI employees through their tool sets
- Context-aware recommendations based on conversation needs
- Automatic micro app suggestions for relevant data interactions
- Seamless handoff from chat to specialized interfaces

### User Experience

**Natural Language Activation**:
- Agents can open micro apps contextually during conversations
- Example: "Let me open the KPI dashboard to show you our performance"
- Users can also directly request specific micro apps
- Intelligent app selection based on conversation context

**Interface Integration**:
- Micro apps appear as rich artifacts in the chat interface
- Maintain conversation context while providing specialized functionality
- Support for both read-only viewing and interactive management
- Smooth transitions between chat and micro app interactions

**Responsive Design**:
- Mobile-friendly interfaces for all micro apps
- Adaptive layouts based on available screen space
- Touch-optimized controls for mobile devices
- Consistent design language with the main application

### Benefits

- **Contextual**: Agents open relevant interfaces based on conversation needs
- **Efficient**: Specialized UIs for complex data interactions
- **Secure**: Role-based access ensures appropriate permissions
- **Scalable**: Easy to add new micro app types as business needs evolve
- **Integrated**: Seamless experience within the chat workflow
- **Generative**: Dynamic UI creation based on real-time data and context

### Future Enhancements

**Planned Micro Apps**:
- Project management dashboards
- Financial reporting interfaces
- Customer relationship management
- Inventory and resource tracking
- Performance analytics and reporting

**Technical Improvements**:
- Real-time collaboration within micro apps
- Advanced data visualization libraries
- Mobile app support for micro app interfaces
- API integrations for external data sources
- Advanced customization and personalization options

## Toolset Management System

### Overview
Restructured the system to use **toolsets** instead of individual tools. Toolsets are logical collections of related functionality (like "File Management" or "Python Interpreter") that contain multiple individual tools. This better matches how MCP servers and built-in modules are actually deployed and used.

### Built-in Employee Roles
Extended the employee schema to support built-in system roles beyond job titles:
- **CEO**: Full access to all micro apps and company configuration
- **HR**: Employee management and human resources functions
- **IT**: Toolset configuration and system administration
- **Office Manager**: Facility and operational management

These roles provide specific permissions and access to specialized micro apps and toolsets.

### Toolset vs Tool Structure

**Toolsets** (collections of related functionality):
- **Artifact Management**: Create, update, manage documents/code
- **Planning System**: Tasks, todos, project management  
- **Memory Management**: Contextual storage and retrieval
- **Human Collaboration**: Approval, review, questions
- **Learning System**: Dynamic skill learning from user teaching
- **Office Management**: Micro applications and dashboards
- **File Management**: Upload, organize, company files
- **KPI Management**: Create, track business metrics
- **Python Interpreter**: Code execution, data analysis
- **Web Search**: Research, browsing capabilities
- **Computer Use**: UI automation, system interaction

**Tools** (individual functions within toolsets):
- `createArtifact`, `updateArtifact` (within Artifact Management)
- `uploadFile`, `searchFiles` (within File Management)
- `createTask`, `addTodo` (within Planning System)

### Toolset Configuration Types

**Built-in Toolsets**:
- Defined in the codebase (`/lib/ai/tools/`)
- No configuration required (unlike individual tools)
- Automatically available with core functionality

**MCP Toolsets**:
- External integrations via Model Context Protocol
- Support for SSE (Server-Sent Events) and stdio connections
- Single configuration per logical grouping of functions
- Enable integration with external APIs and services

### Company Toolset Config Micro App

**Purpose**: IT manager interface for managing company-wide toolset registry
**Access**: Available to employees with "it" built-in role and CEOs

**Features**:
- **Toolset Directory**: View all registered toolsets with type, category, and status
- **Add Toolset Interface**: Modal forms for configuring new built-in or MCP toolsets
- **Toolset Statistics**: Dashboard showing total toolsets, built-in vs MCP ratios
- **Type-specific Configuration**: Simple forms for built-in (no config) vs MCP (connection details)

**Built-in Toolsets Included**:
- Artifact Management (Content Creation)
- Planning System (Project Management)
- Memory Management (Data Management)
- Human Collaboration (Collaboration)
- Learning System (Learning)
- Office Management (Office Management)
- File Management (Content Management)
- KPI Management (Analytics)

### Toolset Assignment System

**Assignment Management**:
- IT managers assign toolsets (not individual tools) to employees
- Employees get access to all tools within assigned toolsets
- Assignment at the capability level ("File Management access")
- Simplified permission model

**Database Structure**:
- `toolsets` table with simplified configuration (only MCP needs config)
- `tools` table for individual functions within toolsets
- `employeeToToolsets` junction table for assignments
- Type-safe schema with proper separation of concerns

**API Functions**:
- `assignToolsetToEmployee`: Assign toolset capabilities to employees
- `removeToolsetFromEmployee`: Remove toolset access
- `getToolsetsForEmployee`: Get all toolsets assigned to an employee
- `getEmployeesWithToolset`: Get all employees with specific toolset access
- `getToolsInToolset`: Get individual tools within a toolset

### Migration System

**Migration Functions**:
- `migrateToolsToToolsets`: Converts old tool structure to toolsets
- `cleanupOldToolsData`: Removes old data after successful migration
- Intelligent mapping of old tools to appropriate toolsets
- Preserves all existing assignments and configurations

### Benefits

- **Intuitive Model**: Matches how tools are actually deployed (MCP servers, modules)
- **Simplified Assignment**: "Give Sarah file management" vs 12 individual functions
- **Better Organization**: Related functionality grouped logically
- **Easier Configuration**: One config per logical capability
- **Reduced Complexity**: Less granular permission management
- **Scalable**: Easy to add new toolsets and MCP integrations
- **Type Safety**: Proper TypeScript types throughout
- **Migration Support**: Smooth transition from old structure

## Next Steps

### Immediate
- Connect stats HUD to real backend metrics (agent count, revenue, efficiency)
- Implement respond/dismiss functionality for user tasks
- Backend implementation for artifact saveAsDocumentation functionality
- Enhance micro app data integration with real-time business metrics
- Test toolset assignment workflow end-to-end
- Assign IT role to an employee and test Company Toolset Config micro app
- Seed built-in toolsets for existing companies
- Test MCP toolset integration

### Future Features
- Skill performance tracking and optimization
- Skill recommendation system based on job roles
- Skill certification and validation workflows
- Advanced skill analytics and progression tracking
- Cross-employee skill transfer and mentoring
- Expand micro apps system with project management and CRM interfaces
- Real-time collaborative editing within micro apps
- Mobile-optimized micro app experiences
- Toolset usage analytics and performance monitoring
- Automated toolset recommendations based on employee roles
- Toolset versioning and update management
- Additional built-in toolsets (Python Interpreter, Web Search, Computer Use)
- MCP toolset marketplace and discovery 