
import { ChatMessage, ContextualData, SensorReading } from "../types";
import { anomalyIssues } from "../data/mockData";

// Interface for LLM configuration
interface LLMConfig {
  modelAssetPath: string;
  maxTokens: number;
  temperature: number;
  topK: number;
  randomSeed: number;
}

// Default configuration
const defaultConfig: LLMConfig = {
  modelAssetPath: '/assets/gemma3-1b-it-int4.task',
  maxTokens: 1000,
  temperature: 0.7,
  topK: 40,
  randomSeed: 42
};

let llmInference: any = null;
let genai: any = null;

// Initialize the LLM
export async function initializeLLM(config: Partial<LLMConfig> = {}) {
  try {
    // For browsers that don't support the module import
    if (typeof window !== 'undefined' && 'FilesetResolver' in window) {
      // @ts-ignore - Using the global variable
      genai = await window.FilesetResolver.forGenAiTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-genai@latest/wasm"
      );
      
      // @ts-ignore - Using the global variable
      llmInference = await window.LlmInference.createFromOptions(genai, {
        baseOptions: {
          modelAssetPath: config.modelAssetPath || defaultConfig.modelAssetPath,
        },
        maxTokens: config.maxTokens || defaultConfig.maxTokens,
        temperature: config.temperature || defaultConfig.temperature,
        topK: config.topK || defaultConfig.topK,
        randomSeed: config.randomSeed || defaultConfig.randomSeed
      });
      
      console.log("LLM initialized successfully");
      return true;
    } else {
      console.warn("LLM initialization failed: FilesetResolver not found");
      return false;
    }
  } catch (error) {
    console.error("Error initializing LLM:", error);
    return false;
  }
}

// Generate a prompt for the LLM based on chat history and contextual data
function generatePrompt(messages: ChatMessage[], contextData?: ContextualData): string {
  let prompt = "You are an AI assistant for CNC machine technicians. ";
  prompt += "You help analyze machine data, identify anomalies, and provide insights about CNC operations. ";
  prompt += "You have access to historical sensor data and can identify potential issues.\n\n";
  prompt += "IMPORTANT: In your responses, directly highlight and point out specific areas of concern or interest. ";
  prompt += "Be direct and specific about what the technician should look at. Use clear indicators like 'You should look at X' or 'Pay attention to Y'.\n\n";
  
  // Add context about sensor readings if available
  if (contextData?.sensorReadings && contextData.sensorReadings.length > 0) {
    prompt += "Here is the most recent sensor data:\n";
    
    const latestReading = contextData.sensorReadings[0];
    prompt += `- Servo Motor Voltage: ${latestReading.servoMotorVoltage}V (Normal: 46-50V)\n`;
    prompt += `- Servo Motor Speed: ${latestReading.servoMotorSpeed}RPM (Normal: 1500-3000RPM)\n`;
    prompt += `- Servo Motor Vibration: ${latestReading.servoMotorVibration}mm/s (Normal: 0.5-2mm/s)\n`;
    prompt += `- Tool Vibration: ${latestReading.toolingVibration}mm/s (Normal: 1-3mm/s)\n`;
    prompt += `- Tool Wear Level: ${latestReading.toolWearLevel}% (Normal: >80%)\n`;
    prompt += `- Coolant Supply Level: ${latestReading.toolCoolantSupplyLevel}% (Normal: >70%)\n`;
    prompt += `- Coolant Reservoir Level: ${latestReading.coolantReservoirLevel}% (Normal: >80%)\n`;
    prompt += `- Coolant Flow Rate: ${latestReading.coolantFlowRate}L/min (Normal: 5-8L/min)\n`;
    
    // Add info about anomalies if any
    if (latestReading.issueId !== 8) {
      const issue = anomalyIssues.find(i => i.id === latestReading.issueId);
      if (issue) {
        prompt += `\nCurrent anomaly detected: ${issue.name} - ${issue.description}\n`;
        prompt += `Severity: ${issue.severity}, Affected Component: ${issue.affectedComponent}\n`;
      }
    } else {
      prompt += "\nNo anomalies detected in current readings.\n";
    }
  }
  
  // Add context about the machined part if available
  if (contextData?.part) {
    const part = contextData.part;
    prompt += `\nInformation about the machined part:\n`;
    prompt += `- Part ID: ${part.id}\n`;
    prompt += `- Part Name: ${part.name}\n`;
    prompt += `- Material: ${part.material}\n`;
    prompt += `- Last Machined: ${part.lastMachined.toLocaleDateString()}\n`;
    prompt += `- Operation Time: ${part.operationTime} minutes\n`;
    
    // Add issue history
    if (part.issueHistory.length > 0) {
      prompt += `- Historical issues: `;
      const issueNames = part.issueHistory.map(id => {
        const issue = anomalyIssues.find(i => i.id === id);
        return issue ? issue.name : "Unknown";
      }).join(", ");
      prompt += `${issueNames}\n`;
    }
  }
  
  // Add insights if available
  if (contextData?.insights && contextData.insights.length > 0) {
    prompt += "\nAnalysis insights:\n";
    contextData.insights.forEach(insight => {
      prompt += `- ${insight}\n`;
    });
  }
  
  // Add chat history
  prompt += "\nConversation history:\n";
  messages.forEach(msg => {
    if (msg.role === 'user') {
      prompt += `User: ${msg.content}\n`;
    } else {
      prompt += `Assistant: ${msg.content}\n`;
    }
  });
  
  // Add final instruction
  prompt += "\nAssistant: ";
  
  return prompt;
}

// Get response from LLM
export async function getResponseFromLLM(messages: ChatMessage[], contextData?: ContextualData): Promise<string> {
  // If LLM is not initialized, return a fallback response
  if (!llmInference) {
    return getFallbackResponse(messages, contextData);
  }
  
  try {
    const prompt = generatePrompt(messages, contextData);
    console.log("Sending prompt to LLM:", prompt);
    
    const response = await llmInference.generateResponse(prompt);
    console.log("LLM response:", response);
    
    return response;
  } catch (error) {
    console.error("Error getting response from LLM:", error);
    return getFallbackResponse(messages, contextData);
  }
}

// Streaming version for real-time responses
export async function streamResponseFromLLM(
  messages: ChatMessage[],
  contextData: ContextualData | undefined,
  onUpdate: (text: string, done: boolean) => void
): Promise<void> {
  // If LLM is not initialized, return a fallback response
  if (!llmInference) {
    const fallback = getFallbackResponse(messages, contextData);
    
    // Simulate streaming by sending chunks
    let sent = 0;
    const chunkSize = 10;
    const intervalId = setInterval(() => {
      const chunk = fallback.slice(sent, sent + chunkSize);
      sent += chunkSize;
      
      onUpdate(chunk, sent >= fallback.length);
      
      if (sent >= fallback.length) {
        clearInterval(intervalId);
      }
    }, 50);
    
    return;
  }
  
  try {
    const prompt = generatePrompt(messages, contextData);
    console.log("Sending prompt to LLM:", prompt);
    
    let fullResponse = "";
    
    await llmInference.generateResponse(
      prompt,
      (partialResult: string, done: boolean) => {
        fullResponse += partialResult;
        onUpdate(partialResult, done);
      }
    );
    
    console.log("LLM streaming response complete:", fullResponse);
  } catch (error) {
    console.error("Error streaming response from LLM:", error);
    onUpdate(getFallbackResponse(messages, contextData), true);
  }
}

// Fallback responses when LLM is not available
function getFallbackResponse(messages: ChatMessage[], contextData?: ContextualData): string {
  const userMessage = messages[messages.length - 1]?.content?.toLowerCase() || '';
  
  // Check for anomalies in context data
  let hasAnomaly = false;
  let anomalyType = '';
  let anomalySeverity = '';
  let anomalyComponent = '';
  
  if (contextData?.sensorReadings && contextData.sensorReadings.length > 0) {
    const latestReading = contextData.sensorReadings[0];
    if (latestReading.issueId !== 8) {
      hasAnomaly = true;
      const issue = anomalyIssues.find(i => i.id === latestReading.issueId);
      if (issue) {
        anomalyType = issue.name;
        anomalySeverity = issue.severity;
        anomalyComponent = issue.affectedComponent;
      }
    }
  }
  
  // Part-specific information
  const partInfo = contextData?.part ? 
    `You're currently looking at the ${contextData.part.name} (ID: ${contextData.part.id}), made of ${contextData.part.material}.` :
    '';
  
  // Pattern match on common questions
  if (userMessage.includes('vibration') || userMessage.includes('vibrations')) {
    if (hasAnomaly && anomalyType.includes('Vibration')) {
      return `${partInfo} You should look specifically at the vibration readings in the sensor panel. I've detected excessive vibration that may indicate an issue with the tool alignment or balance. The ${anomalyComponent} shows concerning vibration patterns. Pay attention to the historical vibration graph in the part details section - notice how the peaks are becoming more pronounced over time.`;
    } else {
      return `${partInfo} Based on the current data, vibration readings are within normal operating parameters. The servo motor is showing vibration levels between 0.5-2 mm/s RMS, which is optimal for precision machining operations. However, I'd recommend keeping an eye on the tool vibration readings as they are trending toward the upper limit of normal range.`;
    }
  } else if (userMessage.includes('coolant') || userMessage.includes('cooling')) {
    if (hasAnomaly && (anomalyType.includes('Coolant') || anomalyType.includes('Cooling'))) {
      return `${partInfo} You need to immediately check the coolant system. Look at the coolant indicators in the sensor panel - they're highlighted in red. The ${anomalyComponent} is showing abnormal readings. The coolant level or flow rate is significantly outside normal parameters. Check the coolant reservoir and pump before continuing operations, as continued operation could lead to tool damage or poor surface finish.`;
    } else {
      return `${partInfo} The coolant system is functioning normally. The flow rate is within the expected range of 5-8 L/min, and the reservoir level is adequate for continued operation. If you look at the coolant systems tab in the part details section, you'll see consistent performance across recent operations.`;
    }
  } else if (userMessage.includes('tool wear') || userMessage.includes('tool life')) {
    if (hasAnomaly && anomalyType.includes('Tool Wear')) {
      return `${partInfo} Look at the tool wear indicator in the sensor panel - it's highlighted as a concern. The current tool is approaching the end of its useful life at less than 30% remaining. You should plan for a replacement before your next machining operation. Check the historical data in the part details section to see how quickly wear has been progressing.`;
    } else {
      return `${partInfo} The tool wear indicators show that the current tool has more than 80% of its useful life remaining. It's in good condition for continued operation. Based on historical wear patterns with this part, you should expect approximately 20-25 more hours of machining before replacement is recommended.`;
    }
  } else if (userMessage.includes('historical') || userMessage.includes('history') || userMessage.includes('previous')) {
    if (contextData?.part) {
      return `${partInfo} Looking at the historical data for this part, I can see that it has been machined with ${contextData.part.issueHistory.filter(id => id !== 8).length} anomalies detected during previous operations. Pay attention to the charts in the part details section - particularly the ${hasAnomaly ? anomalyComponent.toLowerCase() + " readings" : "vibration patterns"} which show some interesting patterns. The last operation completed on ${contextData.part.lastMachined.toLocaleDateString()} with a total operation time of ${contextData.part.operationTime} minutes.`;
    } else {
      return "To view historical performance data, please specify the part ID or name you're interested in, or select a part from the Machined Parts tab in the dashboard. Once you select a specific part, I can provide detailed historical analysis of its performance and any patterns of issues.";
    }
  } else {
    // Generic response
    if (hasAnomaly) {
      return `${partInfo} I've detected a ${anomalySeverity} anomaly: ${anomalyType}. You should immediately look at the ${anomalyComponent} readings in the sensor panel - they're highlighted with a warning indicator. This requires attention before proceeding with any machining operation. Check the System Insights tab for my specific recommendations on addressing this issue.`;
    } else {
      return `${partInfo} All systems are currently operating within normal parameters. The CNC machine is ready for operation. If you're planning to work with this part, the historical data shows consistent performance with no significant issues. Is there specific information you're looking for about the current setup or performance characteristics?`;
    }
  }
}
