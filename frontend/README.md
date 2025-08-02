# Smart Text Lens 🔍

> A React-based text analysis application that extracts entities (people, organizations, countries) and generates summaries from uploaded documents (.txt, .docx) or pasted text using an external AI-powered API.

## ✨ Features

- 🔐 **User Authentication** - Secure signup and login system
- 📄 **Multi-format Support** - Upload .txt, .docx, and .pdf files
- ✏️ **Text Input** - Paste text directly for analysis
- 🏢 **Entity Extraction** - Identify people, organizations, and countries
- 📝 **Text Summarization** - Generate concise summaries
- 🌍 **Language & Nationality Detection** - Automatic language identification and nationality extraction
- 💾 **Export Results** - Download analysis as JSON
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Real-time Processing** - Fast analysis with progress indicators

## 🛠️ Tech Stack

- **Frontend Framework**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with custom CSS variables
- **State Management**: TanStack React Query v5 for server state
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form with Zod validation
- **Document Processing**: Mammoth.js for .docx files
- **Testing**: Vitest + React Testing Library + JSDOM
- **Icons**: Lucide React
- **Notifications**: Sonner + custom toast system
- **HTTP Client**: Native fetch with retry logic
- **Development**: ESLint + TypeScript for code quality

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd text-analyzer-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_ANALYZER_API_URL=https://your-api-endpoint.com
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## ⚙️ Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_ANALYZER_API_URL` | Base URL for the analysis API | `https://api.example.com` |

### Environment Files

- `.env.local` - Local development environment
- `.env.production` - Production environment (if needed)

**Important**: Environment variables prefixed with `VITE_` are exposed to the client-side code.

## 📜 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run build:dev` | Build for development environment |
| `npm run lint` | Run ESLint code analysis |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with Vitest UI |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Run tests with coverage report |

## 🏗️ Project Architecture

### Application Flow

1. **Authentication**: Users sign up or log in to access the application
2. **File Upload/Text Input**: Users can upload documents or paste text directly
3. **Analysis**: Content is sent to external API for processing
4. **Results Display**: Extracted entities and summary are displayed with enhanced UI

### Key Components

- **`Login.tsx`** - Handles user authentication (signup/login)
- **`TextAnalyzer.tsx`** - Main analysis interface with file upload and results
- **`useTextAnalysis.ts`** - React Query hook for API communication
- **`textAnalysisApi.ts`** - API service layer with error handling
- **`textProcessing.ts`** - Utilities for language detection and data mapping

### File Structure

```
src/
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── Login.tsx        # Authentication component
│   └── TextAnalyzer.tsx # Main analysis interface
├── hooks/               # Custom React hooks
│   └── useTextAnalysis.ts
├── services/            # API services
│   └── textAnalysisApi.ts
├── utils/               # Utility functions
│   ├── fileValidation.ts
│   └── textProcessing.ts
└── pages/               # Route components
    ├── Index.tsx
    └── NotFound.tsx
```

## 🔌 API Integration

### Authentication Endpoints

**Signup**
```
POST /signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login**
```
POST /login
Content-Type: application/json

{
  "email": "user@example.com", 
  "password": "password123"
}
```

### Analysis Endpoint

```
POST /analyze
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

FormData:
- file: File object (.txt, .docx)
- OR text: String content
- options: JSON analysis options
```

### Response Structure

The API returns:
```json
{
  "summary": "Generated summary text",
  "countries": ["Country1", "Country2"],
  "organizations": ["Org1", "Org2"],
  "people": ["Person1", "Person2"]
}
```

This is automatically mapped to the enhanced UI structure with:
- Language detection from analyzed text
- Nationality extraction from countries
- Enhanced visual presentation with icons

### File Support

- **Text files** (.txt) - Direct text processing
- **Word documents** (.docx) - Processed via Mammoth.js
- **File size limit** - 10MB maximum
- **Request timeout** - 30 seconds

## 🧪 Testing

### Test Framework

- **Vitest** - Fast unit test runner
- **React Testing Library** - Component testing utilities
- **JSDOM** - DOM environment for testing
- **@testing-library/user-event** - User interaction simulation

### Running Tests

```bash
# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests once
npm run test:run

# Generate coverage report
npm run test:coverage
```

### Test Structure

Tests are located in `__tests__/` directories alongside their respective components:
- `src/components/__tests__/` - Component tests
- `src/hooks/__tests__/` - Custom hook tests
- `src/services/__tests__/` - API service tests
- `src/utils/__tests__/` - Utility function tests

## 🚀 Deployment

### Production Build

1. **Set environment variables** for production
2. **Build the application**
   ```bash
   npm run build
   ```
3. **Deploy static files** from the `dist/` directory

### Environment Requirements

- HTTPS endpoint for API (required for production)
- Valid API key with proper permissions
- CORS configuration on API server for your domain

### Deployment Platforms

The built application can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Any static hosting service