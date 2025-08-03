# Ollama Chat Interface

A modern, ChatGPT-like interface for Ollama AI models built with Next.js, React, and Tailwind CSS.

## Features

- 🚀 **Real-time streaming** responses from Ollama models
- 💬 **Modern chat interface** with message bubbles
- 🎨 **Beautiful UI** built with Tailwind CSS
- 📱 **Responsive design** that works on all devices
- ⚡ **Fast and efficient** with Next.js 14

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd ollama-chat
```

2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## API Configuration

The app is configured to work with the Ollama API at `https://ollama.hritikadhikari.com.np/api/chat`.

To use a different Ollama instance, update the API URL in `src/app/api/chat/route.ts`.

## Deployment

This project is optimized for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

The Next.js API routes will handle CORS and proxy requests to your Ollama instance.

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   └── chat/       # Chat API endpoint
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ChatInterface.tsx
│   ├── LoadingIndicator.tsx
│   └── MessageBubble.tsx
└── index.css          # Global styles
```

## Technologies Used

- **Next.js 14** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## License

MIT
