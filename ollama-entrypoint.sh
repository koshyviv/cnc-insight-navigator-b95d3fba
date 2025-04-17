#!/bin/sh
set -e # Exit immediately if a command exits with a non-zero status.

echo "Starting Ollama server in background..."
# Start the server process in the background
ollama serve &
SERVER_PID=$!

echo "Waiting for Ollama server to be ready..."
# Wait a few seconds or implement a more robust check
attempt=0
max_attempts=15 # Increased attempts

# Loop until `ollama list` succeeds or timeout
while ! ollama list > /dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ $attempt -ge $max_attempts ]; then
    echo "Ollama server failed to start check after $max_attempts attempts. Proceeding with pull anyway..."
    # Optionally kill the server process if check fails definitively
    # kill $SERVER_PID
    # exit 1
    break # Exit loop and try pulling
  fi
  echo "Waiting for server... (attempt $attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -lt $max_attempts ]; then
    echo "Ollama server is ready."
fi

echo "Ensuring model gemma3:1b is available..."
# Now run the pull command
ollama pull gemma3:1b
echo "Model gemma3:1b pull attempt finished."

echo "Bringing Ollama server to foreground..."
# Wait for the background server process. This keeps the script alive.
# If the server process stops, the script (and container) will exit.
wait $SERVER_PID 