# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a multi-POS (Point of Sale) system with a full-stack architecture:
- **Frontend**: Next.js 16 with React 19, TypeScript, and Tailwind CSS v4
- **Backend**: ASP.NET Core 8.0 Web API with minimal API architecture

## Repository Structure

```
multi-pos/
├── frontend/          # Next.js frontend application
│   ├── app/          # Next.js App Router pages and layouts
│   ├── public/       # Static assets
│   └── package.json
├── Backend/          # ASP.NET Core backend API
│   ├── Program.cs    # Main API entry point and endpoint definitions
│   └── Backend.csproj
└── multi-pos.sln     # Visual Studio solution file
```

## Development Commands

### Frontend (Next.js)

Navigate to the `frontend/` directory for all frontend commands:

```bash
cd frontend

# Development
npm run dev          # Start dev server at http://localhost:3000

# Production
npm run build        # Build for production
npm start            # Start production server

# Code quality
npm run lint         # Run ESLint
```

### Backend (.NET)

Navigate to the `Backend/` directory for backend commands:

```bash
cd Backend

# Development
dotnet run           # Run the API (default: https://localhost:5001)
dotnet watch         # Run with hot reload

# Build
dotnet build         # Build the project
dotnet build -c Release  # Build for production

# Testing
dotnet test          # Run tests (when added)

# Solution-level commands (from root)
cd ..
dotnet build multi-pos.sln     # Build entire solution
dotnet run --project Backend   # Run backend from root
```

## Architecture Notes

### Frontend Architecture

- **Framework**: Next.js 16 with App Router (not Pages Router)
- **Styling**: Tailwind CSS v4 with PostCSS
- **Fonts**: Uses Geist Sans and Geist Mono via `next/font/google`
- **Path Aliases**: `@/*` maps to the root directory (configured in `tsconfig.json`)
- **TypeScript**: Strict mode enabled with ES2017 target

Key files:
- `app/layout.tsx` - Root layout with font configuration
- `app/page.tsx` - Homepage
- `app/globals.css` - Global styles and Tailwind directives

### Backend Architecture

- **Framework**: ASP.NET Core 8.0 using minimal API pattern (not controllers)
- **API Documentation**: Swagger/OpenAPI enabled in development
- **Pattern**: Endpoints defined inline in `Program.cs` using `app.MapGet()`, `app.MapPost()`, etc.
- **Configuration**: Uses standard ASP.NET Core configuration (`appsettings.json`)

Current endpoints:
- `GET /weatherforecast` - Example weather forecast endpoint

### Project Conventions

- The frontend is a standalone Next.js project with its own `package.json` and `node_modules`
- The backend is a single .NET project within a Visual Studio solution
- Both projects are currently in early setup phase with template/starter code
- No shared code or cross-project dependencies yet established

## TypeScript Configuration

The frontend uses these key TypeScript settings:
- `jsx: "react-jsx"` - Uses the new JSX transform (no need to import React)
- `moduleResolution: "bundler"` - Modern module resolution for bundlers
- `strict: true` - All strict type-checking enabled
- Path alias `@/*` for imports

## Development Workflow

1. **Running both projects**: Open two terminal windows, one for frontend (`cd frontend && npm run dev`) and one for backend (`cd Backend && dotnet watch`)
2. **Adding frontend features**: Create pages/components in the `app/` directory following App Router conventions
3. **Adding backend endpoints**: Define new endpoints in `Backend/Program.cs` following the minimal API pattern
4. **API documentation**: Access Swagger UI at the backend URL + `/swagger` when running in development

## Important Notes

- This appears to be a POS (Point of Sale) system in early development stages
- Both frontend and backend are currently at template/boilerplate stage
- No database or data persistence layer configured yet
- No authentication/authorization implemented yet
- Frontend and backend run as separate processes and will need CORS configuration for communication
