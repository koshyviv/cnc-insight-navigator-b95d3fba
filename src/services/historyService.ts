import { SensorReading, AnomalyIssue, MachinedPart } from '@/types';
import { anomalyIssues } from '@/data/mockData';

// Define a type to represent a system state record
export interface SystemStateRecord {
  timestamp: Date;
  reading: SensorReading;
  anomaly?: AnomalyIssue;
  activePart?: MachinedPart;
  formattedTime: string;
}

// Store last N system states
const MAX_HISTORY_LENGTH = 20;
const systemHistory: SystemStateRecord[] = [];

/**
 * Add a new system state to the history
 */
export const recordSystemState = (
  reading: SensorReading, 
  activePart?: MachinedPart
): SystemStateRecord => {
  // Find the corresponding anomaly
  const anomaly = anomalyIssues.find(a => a.id === reading.issueId);

  const now = new Date();
  const record: SystemStateRecord = {
    timestamp: now,
    reading,
    anomaly: anomaly?.severity !== 'normal' ? anomaly : undefined,
    activePart,
    formattedTime: now.toLocaleTimeString() + ' ' + now.toLocaleDateString()
  };

  // Add to history and maintain max length
  systemHistory.unshift(record);
  if (systemHistory.length > MAX_HISTORY_LENGTH) {
    systemHistory.pop();
  }

  console.log("Recorded system state", record);
  return record;
};

/**
 * Get the latest N system records, or all available if less than N
 */
export const getSystemHistory = (count: number = MAX_HISTORY_LENGTH): SystemStateRecord[] => {
  return systemHistory.slice(0, Math.min(count, systemHistory.length));
};

/**
 * Format system history as a string for LLM context
 */
export const formatSystemHistoryForLLM = (): string => {
  if (systemHistory.length === 0) return "No system history available.";

  // First, separate records into those with anomalies and those without
  const anomalyRecords = systemHistory.filter(record => record.anomaly);
  
  let formattedHistory = "\nSYSTEM HISTORY:\n";
  
  // First include records with anomalies (most relevant for troubleshooting)
  if (anomalyRecords.length > 0) {
    formattedHistory += "\nDetected Issues:\n";
    
    anomalyRecords.forEach(record => {
      const partInfo = record.activePart 
        ? `for part ${record.activePart.name} (${record.activePart.id})` 
        : "with no specific part selected";
      
      formattedHistory += `- ${record.formattedTime}: ${record.anomaly?.severity.toUpperCase()} - ${record.anomaly?.name} ` +
        `${partInfo}. ${record.anomaly?.description}.\n`;
    });
  }
  
  // Add latest overall status even if no anomalies
  const latestRecord = systemHistory[0];
  formattedHistory += `\nCurrent System State (as of ${latestRecord.formattedTime}):\n`;
  
  if (latestRecord.anomaly) {
    formattedHistory += `- Current Issue: ${latestRecord.anomaly.name} (${latestRecord.anomaly.severity.toUpperCase()})\n`;
  } else {
    formattedHistory += "- No active issues detected\n";
  }
  
  return formattedHistory;
}; 