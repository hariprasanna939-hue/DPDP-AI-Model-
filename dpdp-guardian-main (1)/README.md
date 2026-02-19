# AI Chat Assistant

A modern React-based AI chat application that allows users to converse with ChatGPT and Gemini AI models.

## Features

- **Dual AI Models**: Choose between ChatGPT (OpenAI) and Gemini (Google) for responses
- **Real-time Chat**: Interactive chat interface with message history
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Responsive Design**: Works on desktop and mobile devices
- **Session Management**: Save and load chat sessions

## Setup

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
   - Copy `.env.txt` and ensure it contains your API keys:
     ```
     VITE_OPENAI_API_KEY=your_openai_api_key
     VITE_GEMINI_API_KEY=your_gemini_api_key
     ```

4. Start the backend server:
```bash
cd public
node server.js
```

5. Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:8080`

## API Keys

You'll need to obtain API keys from:

- **OpenAI**: https://platform.openai.com/api-keys
- **Google AI (Gemini)**: https://makersuite.google.com/app/apikey

## Usage

1. Open the application in your browser
2. Select your preferred AI model (ChatGPT or Gemini) using the buttons in the header
3. Type your message in the input field
4. Press Enter or click Send to get a response
5. Continue the conversation - the AI will remember the context

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **AI Integration**: OpenAI API and Google Generative AI
- **Database**: Supabase (for session management)
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
