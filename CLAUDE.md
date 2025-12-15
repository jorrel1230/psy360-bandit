# CLAUDE.md - Human Trials

This file provides guidance to Claude Code (claude.ai/code) when working with the human trials component.

## Context

This is **part of a larger comparative decision-making study**. See `../CLAUDE.md` for the full project overview.

This subdirectory contains the **human participant web application** - one half of a two-part research project comparing human and LLM decision-making in multi-armed bandit problems.

## Project Overview

This is a **Multi-Armed Bandit experiment** built with SvelteKit, designed for psychological research. Players manage a $200 budget over 100 trials, choosing between 6 slot machines with different risk/reward profiles. The application collects behavioral data and stores it in Supabase.

**Important**: The machine configurations and data schema used here must match those in `../shared/data-schemas/` to enable valid comparison with LLM trials.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run type checking
npm run check

# Run linting and formatting
npm run lint
npm run format
```

## Architecture Overview

### Core Application Flow
1. **Entry** (`/`) - Player name validation and experiment introduction
2. **Game** (`/game`) - Main experiment interface with 6 slot machines
3. **Leaderboard** (`/leaderboard`) - Results display with player rankings
4. **Stats** (`/stats`) - Hidden analytics page for detailed player data analysis

### Key Components

**BanditArm** (`src/lib/components/BanditArm.svelte`)
- Handles both Gaussian and bimodal distributions
- Implements Box-Muller transformation for Gaussian sampling
- Supports variable costs per machine
- Returns structured `BanditResult` objects

**Machine Configuration** (`src/routes/game/+page.svelte`)
- 6 machines with different risk profiles:
  - Machines 1-3: Gaussian distributions
  - Machines 4-6: Bimodal distributions (mixture of two Gaussians)
- Each machine has: `id`, `mean/mean1/mean2`, `variance`, `cost`, `bimodal` flag
- Machines are shuffled per session using Fisher-Yates algorithm

### Data Architecture

**Database Schema** (Supabase `scores` table)
- `netid`: Player identifier (unique per session)
- `data`: JSONB containing:
  - `choices[]`: Array of machine IDs selected
  - `payoffs[]`: Array of payouts received
  - `total_trials`: Number of trials completed
  - `final_balance`: Ending balance
  - `session_completed`: Boolean completion status
  - `timestamp`: Session completion time

**Critical Data Recording**
- Records original machine IDs (1-6), not display positions (A-F)
- Machine shuffling affects display order but not data integrity
- Unique name enforcement prevents duplicate entries

### Environment Configuration

**Required Environment Variables**
- `VITE_PUBLIC_SUPABASE_URL`: Supabase project URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

**Security Model**
- Uses Supabase Row Level Security (RLS)
- Anonymous users can INSERT and SELECT only
- DELETE operations should be disabled at database level

### Chart Integration

**Stats Page** uses Chart.js for data visualization:
- Balance over time (line chart with detailed hover tooltips)
- Machine usage distribution (bar chart)
- Payoff frequency histogram (bar chart)
- Charts are created/destroyed dynamically when switching players

### Routing & Navigation

**Static Site Generation**
- Uses `@sveltejs/adapter-static` for deployment
- Configured for hosting at `jorrelrajan.com/psy360-bandit`
- All routes are pre-rendered

**Navigation Flow**
- Entry validation → Game session → Leaderboard (with player highlighting)
- Stats page is hidden/unlinked but accessible at `/stats`

## Machine Learning Implementation

The experiment implements proper statistical sampling:

- **Gaussian machines**: Box-Muller transformation for normal distribution sampling
- **Bimodal machines**: Weighted mixture model sampling between two Gaussians
- **Expected value calculations**: Account for machine costs in profit calculations

## Development Notes

- Uses TypeScript throughout with strict typing
- Tailwind CSS for styling with custom dark theme
- Form validation prevents duplicate player names
- Real-time balance tracking with 100-trial limit enforcement
- Responsive design works on desktop and mobile devices