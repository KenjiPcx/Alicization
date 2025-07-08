# Advanced Tool Patterns

## Generalized KPI Tools

The KPI tools have been generalized to work across different scopes (company, team, employee) using the `createXXXTool` pattern for context injection.

### Why This Pattern?

Instead of making the AI figure out which IDs to use, we inject them based on the user's context:

- **CEO**: Automatically gets company-scoped KPIs
- **Team Lead**: Automatically gets team-scoped KPIs  
- **Employee**: Automatically gets personal KPIs

### Available KPI Tools

All tools are created via factory functions that inject the appropriate scope and IDs:

- `createKPIDashboardTool` - View KPI dashboard with summary
- `createKPITool` - Create new KPIs
- `createUpdateKPITool` - Update KPI progress
- `createRemoveKPITool` - Remove KPIs
- `createListKPIsTool` - List all KPIs

### Usage Examples

#### For CEOs (Company-level KPIs)
```typescript
import { createCEOTools } from "../office/ceo";

// At runtime, inject company context
const ceoTools = await createCEOTools(ctx, userId);
// Now ceoTools.createKPI automatically creates company KPIs
```

#### For Team Leads (Team-level KPIs)
```typescript
import { createTeamLeadTools } from "../office/team-lead";

// At runtime, inject team context
const teamTools = await createTeamLeadTools(ctx, teamId, userId);
// Now teamTools.createKPI automatically creates team KPIs
```

#### For Employees (Personal KPIs)
```typescript
import { createEmployeeTools } from "../office/employee";

// At runtime, inject employee context
const employeeTools = await createEmployeeTools(ctx, employeeId, userId);
// Now employeeTools.createKPI automatically creates personal KPIs
```

### Helper Functions

- `resolveCompanyScope(ctx, userId)` - Gets company ID for user
- `resolveTeamScope(teamId)` - Creates team scope
- `resolveEmployeeScope(employeeId)` - Creates employee scope
- `createKPIToolset(ctx, scope, userId)` - Creates complete KPI toolset

### Benefits

1. **No ID Confusion**: AI doesn't need to figure out which company/team/employee ID to use
2. **Type Safety**: Proper TypeScript types for each scope
3. **Reusability**: Same KPI logic works for all scopes
4. **Context Awareness**: Tools automatically know their scope
5. **Scalability**: Easy to add new scopes or tools

### Schema Integration

Uses the centralized schema validators from `convex/schema.ts`:
- `vKpiScopes` - company/team/employee
- `vKpiQuarters` - Q1/Q2/Q3/Q4
- `vKpiStatuses` - pending/in-progress/completed/failed
- `vKpi` - Complete KPI object structure 