# An AI Office

An office simulation but the employees are actually real life agents.
Based on a WeWork environment, we have a floor of different teams, we can simulate an office and see our employees do work.

## Agents

- CEO Agent: The main proxy for the human user, able to assign tasks to teams based on KPIs
- Individual Businesses: Based on the users requirements, the CEO Agent is able to spawn teams and employees to solve the task.
- Personal Helper Agents: Just a UI honestly to see other AI tools doing work, eg: Meeting notes listener agent

## Agent UI

- We can click on a team, and it will bring up a window showing the tasks the team are doing, either threads where the agents are involved
- We can click on a single agent

## Agentic Architecture

- All Agents will use the LLM Compiler architecture when working on tasks
- All RAG workflows will be provided as tools, with hybrid RAG out of the box (Research Agents will use them)
- Multiagent systems will represent teams, each agent can route to another one
- Fixed workflows can be activated

## Agentic Tools

- Computer Use Agent with CodeAct
- Browser Using Agent for more UI based tools
- MCP Servers decided at compile time

## Primative Workflows

- Office Builder and Tester
  - We will have a dedicated team of agents maintaining the office and the creation of new agents and teams based on the user's needs
- Self Upgrade
  - We will have a dedicated team of agents monitoring performance and tracking KPIs
  - Even for the CEO agent
  - Team restructuring and company reorganization
- Eng Team
  - Build software / dedicated agents for agents to improve performance

## Office Simulation

- Kinda like a WeWork floor, lots of desks, some dividers, made in three.js
- We can pan around
- Employees sit on their desks to work, walk around and chill when idle
