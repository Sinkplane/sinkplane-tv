# Cursor Agents

This directory contains custom AI agents for Cursor IDE.

## Available Agents

### `lint-fix`
Automatically runs ESLint and fixes all linting errors in the codebase.

**How to use:**
1. Open Cursor's AI chat (Cmd+L or Ctrl+L)
2. Type: `@lint-fix` or mention the agent
3. The agent will automatically:
   - Run `npm run lint`
   - Identify all errors
   - Fix them systematically
   - Re-run the linter to verify
   - Report results

**Alternative methods:**
- Use Cursor's agent selector (click the agent icon in chat)
- Type: "Use the lint-fix agent to fix all linting errors"
- Create a custom keyboard shortcut in Cursor settings

## Creating New Agents

To create a new agent:
1. Create a new `.md` file in `.cursor/agents/`
2. Use this structure:
   ```markdown
   # Agent Name
   
   ## Description
   Brief description of what the agent does
   
   ## Instructions
   Detailed instructions for the AI on how to execute the task
   ```
3. The agent will be automatically available in Cursor

## Notes
- Agents are workspace-specific
- They provide context and instructions to guide the AI
- Best for repetitive, complex multi-step tasks

