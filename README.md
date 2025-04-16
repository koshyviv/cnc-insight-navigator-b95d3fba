
# CNC Insight Navigator

A comprehensive tool for CNC machine monitoring, analysis, and troubleshooting.

## Features

- Real-time sensor monitoring dashboard
- AI-powered chatbot for machine diagnostics
- Historical data visualization
- Anomaly detection and alerting
- Part-specific performance analysis

## Getting Started

### Running with Docker

The easiest way to run the application is using Docker:

```bash
# Clone the repository
git clone <repository-url>
cd cnc-insight-navigator

# Download the model
mkdir -p public/assets
wget -O public/assets/gemma3-1b-it-int4.task https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-int4.task

# Start the application
docker-compose up -d
```

Then access the application at http://localhost:8080

### Development Setup

```bash
# Install dependencies
npm install

# Create the assets directory and download the model
mkdir -p public/assets
wget -O public/assets/gemma3-1b-it-int4.task https://huggingface.co/litert-community/Gemma3-1B-IT/resolve/main/gemma3-1b-it-int4.task

# Start the development server
npm run dev
```

## Technology Stack

- React with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- Gemma 3 1B Instruction-Tuned model for AI chatbot
- MediaPipe GenAI for on-device AI inference
