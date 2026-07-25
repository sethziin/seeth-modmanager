# Entropic State - Mod Manager

## Objective
To serve as the entry point and primary navigation guide for the Entropic State Mod Manager documentation, providing a quick overview of the project and instructions for reading the documentation.

## Responsibility
This document is responsible for indexing all other documentation files, explaining how to navigate the documentation, and defining the recommended reading order for AI agents.

## Scope
This document covers the high-level project description, target audience, documentation index, and navigation instructions. It does not contain technical details, which are delegated to specialized documents.

## Project Overview
- **Project Name**: Entropic State - Mod Manager
- **Brief Description**: A desktop mod manager initially targeting GTA V, architectured for multi-game support.
- **Target Audience**: Small group of friends (not enterprise).

## Document Index
Below is the complete list of all documentation files in the `docs/` folder:

- **00-README.md** - Entry point and navigation guide
- **01-PROJECT_CONTEXT.md** - Complete project context and overview
- **02-STACK.md** - Technology stack with justifications
- **03-ARCHITECTURE.md** - System architecture and patterns
- **04-CODING_STANDARDS.md** - Code conventions and patterns
- **05-BACKEND.md** - Backend/main process architecture
- **06-IPC.md** - Inter-process communication strategy
- **07-FILE_SYSTEM.md** - File system operations and paths
- **08-GAME_SYSTEM.md** - Game provider system architecture
- **09-MOD_SYSTEM.md** - Mod management system
- **10-DOWNLOAD_SYSTEM.md** - Download manager architecture
- **11-FRONTEND.md** - Frontend/renderer architecture
- **12-COMPONENTS.md** - Component library specification
- **13-STATE.md** - State management strategy
- **14-THEMING.md** - Design system and theming
- **15-CONFIGURATION.md** - Configuration system
- **16-LOGGING.md** - Logging and error handling
- **17-TESTING.md** - Testing strategy
- **18-ROADMAP.md** - Development roadmap
- **19-CURRENT_TASK.md** - Current task tracker
- **20-DECISIONS.md** - Architectural decision log
- **21-CHECKLIST.md** - Implementation checklist
- **22-RELEASE.md** - Build and release process
- **AGENT.md** - AI agent rules and constraints
- **PROJECT_CONTEXT.md** - (Alias/Redirect for 01-PROJECT_CONTEXT)
- **CURRENT_TASK.md** - (Alias/Redirect for 19-CURRENT_TASK)
- **DECISIONS.md** - (Alias/Redirect for 20-DECISIONS)

## How to Navigate the Documentation
Each document in this repository follows a consistent structure, including sections like Objective, Responsibility, Scope, and Relation to Other Documents. Use this README as the central hub. Cross-references within documents will guide you to related topics.

## Reading Order for AI Agents
1. **00-README.md** (This file) - To understand what exists.
2. **AGENT.md** - To understand operational rules and constraints.
3. **01-PROJECT_CONTEXT.md** - For high-level project goals and scope.
4. **02-STACK.md** - To understand the technology choices.
5. **03-ARCHITECTURE.md** - For structural understanding.
6. **19-CURRENT_TASK.md** - To know what to work on right now.
7. Subsequent technical docs (04 through 17) based on the specific current task.

## Quick Start Instructions
**Read the docs first, never skip.** AI agents must parse the relevant context documents before writing code or proposing changes to ensure alignment with project principles.

## Dependencies
None.

## Criteria for Completion
This document is considered complete when all project documentation files are accurately listed and described, and reading instructions are clear.

## Next Steps
- Create `01-PROJECT_CONTEXT.md` and `02-STACK.md`.
- Generate the remaining structural documentation files.

## Relation to Other Documents
This is the root document that references all other documentation files in the `docs/` directory.
