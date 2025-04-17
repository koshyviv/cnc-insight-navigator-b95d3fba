import { anomalyIssues } from "@/data/mockData"; // Import anomalyIssues to map history IDs
import { formatSystemHistoryForLLM } from "./historyService";

// Generates the message payload for the Ollama /api/chat endpoint
const generateChatPayload = (messages, contextData) => {
  // Extract the user's last message
  const userMessage = messages[messages.length - 1]?.content || '';

  // Format the context data
  let contextString = '';
  if (contextData) {

    // Add System Insights if available
    if (contextData.insights && contextData.insights.length > 0) {
      contextString += `\nSYSTEM INSIGHTS:\n`;
      contextData.insights.forEach(insight => {
        contextString += `- ${insight}\n`;
      });
    }

    // Add Active Issues/Anomalies if available
    if (contextData.anomalies && contextData.anomalies.length > 0 && contextData.anomalies.some(a => a.severity !== 'normal')) {
      contextString += `\nCURRENT ALERTS/ISSUES:\n`;
      contextData.anomalies
        .filter(a => a.severity !== 'normal') // Filter out 'normal' status
        .forEach(anomaly => {
          contextString += `- Severity: ${anomaly.severity.toUpperCase()}\n`;
          contextString += `  - Name: ${anomaly.name}\n`;
          contextString += `  - Description: ${anomaly.description}\n`;
          contextString += `  - Affected Component: ${anomaly.affectedComponent}\n`;
        });
    } else {
       contextString += `\nCURRENT STATUS: No active alerts or issues reported.\n`;
    }
    
    // Add recent Sensor Data if available (last 5 readings)
    if (contextData.sensorReadings && contextData.sensorReadings.length > 0) {
      const readingsToShow = contextData.sensorReadings.slice(-5); // Get last 5 or fewer
      contextString += `\nRECENT SENSOR DATA (${readingsToShow.length} readings):\n`;
      readingsToShow.forEach((reading, index) => {
        const readingDate = new Date(reading.timestamp);
        contextString += `Reading ${index + 1} (${readingDate.toLocaleTimeString()}):
`;
        contextString += `  - Servo Motor: V=${reading.servoMotorVoltage.toFixed(2)}V, Speed=${reading.servoMotorSpeed.toFixed(0)}RPM, Vib=${reading.servoMotorVibration.toFixed(2)}mm/s\n`;
        contextString += `  - Tooling: Vib=${reading.toolingVibration.toFixed(2)}mm/s, Wear=${reading.toolWearLevel.toFixed(1)}%\n`;
        contextString += `  - Coolant: Supply=${reading.toolCoolantSupplyLevel.toFixed(1)}%, Res=${reading.coolantReservoirLevel.toFixed(1)}%, Flow=${reading.coolantFlowRate.toFixed(1)}L/min\n`;
        contextString += `  - Base Plate: Press=${reading.basePlatePressure.toFixed(1)}psi, Vib=${reading.basePlateVibration.toFixed(2)}mm/s\n`;
      });
    }

    // Add Machined Part Details if available
    if (contextData.part) {
      const part = contextData.part;
      contextString += `\nCURRENT PART DETAILS:\n`;
      contextString += `- ID: ${part.id}\n`;
      contextString += `- Name: ${part.name}\n`;
      contextString += `- Material: ${part.material}\n`;
      contextString += `- Last Machined: ${part.lastMachined.toLocaleDateString()} ${part.lastMachined.toLocaleTimeString()}\n`;
      contextString += `- Total Operation Time: ${part.operationTime} minutes\n`;
    }

    // Add Historical Notes using our dynamic history service
    contextString += formatSystemHistoryForLLM();
  }

  // Construct the messages array for Ollama /api/chat
  // We can include context within a system message or prepend it to the user message.
  // Let's try prepending to the user message for simplicity here.
  const systemPrompt = `You are a helpful CNC machine assistant. Answer the user's question based *only* on the provided Context, give relevant information and insights. If the context doesn't contain the answer, say so.`;

  const chatMessages = [
      {
          role: "system",
          content: systemPrompt
      },
      // Spread the previous messages into the array
      ...messages.slice(0, -1).map(msg => ({ role: msg.role, content: msg.content })),
      {
          role: "user",
          content: `Context:
${contextString}
User Question: ${userMessage}`
      }
  ];


  console.log('Generated chat payload messages:', chatMessages);
  return chatMessages;
};

// Stream response from the Ollama LLM using /api/chat
export const streamResponseFromLLM = async (messages, contextData, callback) => {
  const chatMessages = generateChatPayload(messages, contextData);
  const ollamaUrl = '/api/chat'; // Using proxy path defined in nginx.conf for /api/chat

  try {
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gemma3:1b', // Use the desired model
        messages: chatMessages, // Use the messages array
        stream: true
        // Removed options - temperature etc. can be set via Ollama config or potentially model parameters if needed
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Ollama API request failed with status ${response.status}: ${errorBody}`);
    }

    if (!response.body) {
        throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let accumulatedResponse = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        console.log('Stream finished.');
        // Ensure the final callback indicates completion if it wasn't already sent by a 'done: true' message
        // callback("", true); // May not be needed if last message had done: true
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        try {
          const parsedLine = JSON.parse(line);
          // Check if there is content in the message part of the response
          if (parsedLine.message && parsedLine.message.content) {
            const contentChunk = parsedLine.message.content;
            accumulatedResponse += contentChunk;
            // Pass the partial response chunk and done status to the callback
            callback(contentChunk, parsedLine.done || false);
          }
          
          // Check the top-level done flag
          if (parsedLine.done) {
            console.log('Ollama signaled completion.');
             // If the last message had no content but signaled done, ensure callback reflects completion
            if (!parsedLine.message || !parsedLine.message.content) {
                 callback("", true);
            }
            // Return the full response accumulated so far (optional, depends on caller needs)
            // return accumulatedResponse; 
            // Exit the loop as Ollama signaled completion
            return accumulatedResponse; 
          }
        } catch (e) {
          console.error('Error parsing JSON line:', line, e);
          // Handle parsing errors - perhaps send an error message via callback?
          // callback(`Error parsing LLM response: ${e.message}`, true);
        }
      }
    }
    console.log('Final accumulated response:', accumulatedResponse);
    return accumulatedResponse; // Return accumulated response if loop finishes without done: true (should not happen with Ollama stream)
  } catch (error) {
    console.error('Error streaming response from Ollama:', error);
    callback(`Error contacting LLM: ${error.message}`, true);
    return `Error: ${error.message}`;
  }
};

// Removed initializeLLM, provideFallbackResponse, isLLMInitialized, and MediaPipe imports
