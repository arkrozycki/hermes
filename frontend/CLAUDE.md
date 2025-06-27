# Hermes Frontend - CLAUDE.md

## Project Overview
This is a translation application built with Next.js and Electron (Nextron) that provides both web and desktop experiences. It's based on a Nextron boilerplate with Shadcn/ui components and TailwindCSS styling.

## Technology Stack
- **Framework**: Next.js 15.0.3 with App Router
- **Desktop**: Electron 33.2.0 (via Nextron 9.1.0)
- **UI Library**: Shadcn/ui with Radix UI components
- **Styling**: TailwindCSS with custom animations
- **Language**: TypeScript
- **Authentication**: Custom auth service
- **Forms**: React Hook Form with Zod validation
- **Theming**: Next-themes with light/dark mode support

## Project Structure
```
frontend/
├── app/                    # Electron main process files
├── main/                   # Electron TypeScript source
├── renderer/               # Next.js application
│   ├── app/               # Next.js App Router pages
│   │   ├── login/         # Authentication pages
│   │   ├── register/
│   │   └── translate/     # Main translation interface
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Shadcn/ui components
│   │   └── providers/    # Context providers
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and services
│   │   ├── services/     # API services (auth, translation)
│   │   ├── types/        # TypeScript type definitions
│   │   └── validations/  # Zod schemas
│   └── styles/           # Global styles
├── public/               # Static assets
└── resources/           # Build resources
```

## Key Features
- **Translation Interface**: Main feature for translating text
- **Authentication**: Login/register system with session management
- **Theme Support**: Light/dark mode toggle
- **Settings**: User preferences and configuration
- **History**: Translation history tracking
- **PWA Support**: Progressive Web App capabilities
- **Cross-platform**: Web and desktop builds

## Development Commands
```bash
# Development
npm run next:dev          # Start Next.js dev server
npm run electron:dev      # Start Electron app in dev mode

# Building
npm run next:build        # Build Next.js app
npm run electron:build-current  # Build Electron for current platform

# Code quality
npm run format           # Format code with Prettier and ESLint
```

## Configuration
- **API**: Configured via `NEXT_PUBLIC_API_URL` environment variable
- **Auth**: Enabled/disabled via `NEXT_PUBLIC_AUTH_ENABLED`
- **Themes**: Managed by next-themes provider
- **Icons**: Separate light/dark theme icon sets

## Key Services
- **auth.service.ts**: Authentication and session management
- **translation.service.ts**: Translation API integration
- **api-client.ts**: HTTP client configuration

## UI Components
- Uses Shadcn/ui component library
- Custom components for translation interface
- Theme-aware styling throughout
- Responsive design patterns

## Testing & Linting
- ESLint with TypeScript support
- Prettier for code formatting
- No test suite currently configured

## Recent Changes
- Added light/dark theme icon support
- Implemented PWA manifest
- Added authentication approval flow
- Created logout functionality
- Various UI improvements and settings

## Notes for Claude
- This is a translation application with authentication
- Uses environment variables for API configuration
- Follows Next.js App Router patterns
- Shadcn/ui components should be used for new UI
- Follow existing TypeScript patterns and file organization
- Code formatting is handled by Prettier + ESLint