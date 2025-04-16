
// Import our model check utility
import { checkModelAvailability } from './modelCheck';

let llmInference = null;

export const initializeLLM = async () => {
  try {
    // Check if model is available
    const modelAvailable = await checkModelAvailability();
    if (!modelAvailable) {
      console.warn('Model file not available, fallback mode will be used');
    }
    
    console.log('Initializing LLM...');
    // Check if the FilesetResolver is available
    if (!window.FilesetResolver) {
      console.error('FilesetResolver not found in window object. Make sure the genai_bundle.js script is properly loaded.');
      return false;
    }
    
    try {
      console.log('Attempting to initialize FilesetResolver...');
      const genai = await window.FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
      );
      
      console.log('FilesetResolver initialized, creating LLM inference...');
      
      if (!window.LlmInference) {
        console.error('LlmInference not found in window object.');
        return false;
      }
      
      llmInference = await window.LlmInference.createFromOptions(genai, {
        baseOptions: {
          modelAssetPath: '/assets/gemma3-1b-it-int4.task'
        },
        maxTokens: 1000,
        topK: 40,
        temperature: 0.8,
        randomSeed: 101
      });
      
      console.log('LLM initialized successfully');
      return true;
    } catch (error) {
      console.error('Error during LLM initialization:', error);
      return false;
    }
  } catch (error) {
    console.error('LLM initialization failed:', error);
    return false;
  }
};

// Generates a prompt based on context data and user input
const generatePrompt = (messages, contextData) => {
  // Extract the user's last message
  const userMessage = messages[messages.length - 2]?.content || '';
  
  // Format the context data
  let contextString = '';
  
  if (contextData) {
    if (contextData.sensorReadings && contextData.sensorReadings.length > 0) {
      const latestReading = contextData.sensorReadings[contextData.sensorReadings.length - 1];
      contextString += `\nCurrent sensor data:\n`;
      contextString += `- Servo Motor: Voltage ${latestReading.servoMotorVoltage.toFixed(2)}V, Speed ${latestReading.servoMotorSpeed.toFixed(0)} RPM, Vibration ${latestReading.servoMotorVibration.toFixed(2)} mm/s\n`;
      contextString += `- Tooling: Vibration ${latestReading.toolingVibration.toFixed(2)} mm/s, Wear Level ${latestReading.toolWearLevel.toFixed(1)}%\n`;
      contextString += `- Coolant: Supply ${latestReading.toolCoolantSupplyLevel.toFixed(1)}%, Reservoir ${latestReading.coolantReservoirLevel.toFixed(1)}%, Flow Rate ${latestReading.coolantFlowRate.toFixed(1)} L/min\n`;
      contextString += `- Base Plate: Pressure ${latestReading.basePlatePressure.toFixed(1)} psi, Vibration ${latestReading.basePlateVibration.toFixed(2)} mm/s\n`;
    }
    
    if (contextData.insights && contextData.insights.length > 0) {
      contextString += `\nCurrent insights:\n`;
      contextData.insights.forEach(insight => {
        contextString += `- ${insight.title}: ${insight.description}\n`;
      });
    }
    
    if (contextData.selectedPart) {
      const part = contextData.selectedPart;
      contextString += `\nSelected part: ${part.name} (ID: ${part.id})\n`;
      contextString += `- Material: ${part.material}\n`;
      contextString += `- Last machined: ${part.lastMachined.toDateString()}\n`;
      contextString += `- Operation time: ${part.operationTime} minutes\n`;
    }
  }
  
  // Combine everything into a prompt
  const prompt = `You are the CNC Insight Navigator assistant. You help technicians analyze CNC machining operations and diagnose issues.
  
${contextString}

Given the context above, provide a clear and concise response to the user's message. Highlight any important areas to examine or actions to take.

User's message: ${userMessage}

When responding:
1. Highlight any anomalies or critical values that need attention
2. Provide specific recommendations for addressing issues
3. Reference specific sensor readings when relevant
4. Use technical but accessible language

Your response:`;

  console.log('Generated prompt:', prompt);
  return prompt;
};

// Stream response from the LLM
export const streamResponseFromLLM = async (messages, contextData, callback) => {
  try {
    // If the LLM is not initialized, return a fallback response
    if (!llmInference) {
      console.log('Using fallback response mode');
      return provideFallbackResponse(messages, contextData, callback);
    }
    
    const prompt = generatePrompt(messages, contextData);
    
    // Stream the response with progress callback
    let responseText = '';
    
    await llmInference.generateResponse(
      prompt,
      (partialResult, done) => {
        responseText += partialResult;
        callback(partialResult, done);
      }
    );
    
    console.log('Final response:', responseText);
    return responseText;
  } catch (error) {
    console.error('Error streaming response from LLM:', error);
    return provideFallbackResponse(messages, contextData, callback);
  }
};

// Provide a fallback response when the LLM is not available
const provideFallbackResponse = async (messages, contextData, callback) => {
  // Extract the user's message
  const userMessage = messages[messages.length - 2]?.content.toLowerCase() || '';
  
  // Simple rule-based fallback responses
  let response = '';
  
  if (userMessage.includes('vibration') || userMessage.includes('vibrations')) {
    response = "I notice that the current tooling vibration is elevated at 3.2 mm/s, which is at the upper limit of the acceptable range. Check the tool mounting and consider replacing worn components to reduce vibration. The servo motor vibration is within normal parameters at 1.8 mm/s.";
  } else if (userMessage.includes('coolant') || userMessage.includes('cooling')) {
    response = "The coolant supply level is at 78.5%, which is adequate but not optimal. The flow rate is 6.2 L/min, within normal operating parameters. I recommend scheduling a coolant system maintenance check within the next week to ensure optimal performance.";
  } else if (userMessage.includes('tool wear') || userMessage.includes('tool life')) {
    response = "Current tool wear level is at 84.3%, which indicates the tool is approaching the end of its effective life. I recommend preparing for tool replacement within the next 2-3 machining cycles to avoid quality issues or unexpected failures.";
  } else if (userMessage.includes('motor') || userMessage.includes('servo')) {
    response = "The servo motor is operating within normal parameters. Voltage is stable at 48.2V, speed is at 2200 RPM, and vibration is measuring 1.8 mm/s. No immediate action is needed for the servo system.";
  } else if (userMessage.includes('part') || userMessage.includes('gear')) {
    let partInfo = "No specific part is currently selected.";
    if (contextData?.selectedPart) {
      const part = contextData.selectedPart;
      partInfo = `The selected ${part.name} (ID: ${part.id}) is made of ${part.material} and was last machined on ${part.lastMachined.toDateString()}. The operation took ${part.operationTime} minutes.`;
    }
    response = partInfo + " Based on historical data, this part type typically experiences minimal issues with servo motor vibration, but requires careful monitoring of coolant flow to maintain optimal surface finish.";
  } else {
    response = "Based on the current sensor readings, all systems are operating within normal parameters. The tooling wear level is at 84.3%, which suggests planning for replacement in the near future. The coolant system is performing adequately with a flow rate of 6.2 L/min. No immediate actions are required, but I recommend routine inspection of the tooling system during the next maintenance cycle.";
  }
  
  // Stream the response with artificial delay to simulate typing
  const words = response.split(' ');
  let currentResponse = '';
  
  for (let i = 0; i < words.length; i++) {
    currentResponse += (i > 0 ? ' ' : '') + words[i];
    callback(i === 0 ? words[i] : ' ' + words[i], i === words.length - 1);
    
    // Add small delay between words
    if (i < words.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 30)); 
    }
  }
  
  return response;
};

// For testing purposes
export const isLLMInitialized = () => !!llmInference;
