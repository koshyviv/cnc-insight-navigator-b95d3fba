
import { anomalyIssues } from "../data/mockData";
import { Sensor, SensorReading } from "../types";

// Convert raw reading to sensor objects with metadata
export function getSensorsFromReading(reading: SensorReading): Sensor[] {
  return [
    {
      id: "servo-motor-voltage",
      name: "Servo Motor Voltage",
      value: reading.servoMotorVoltage,
      unit: "V",
      normalRange: { min: 46, max: 50 },
      criticalRange: { min: 46, max: 50 },
      issueId: reading.servoMotorVoltage < 46 || reading.servoMotorVoltage > 50 ? 0 : 8
    },
    {
      id: "servo-motor-speed",
      name: "Servo Motor Speed",
      value: reading.servoMotorSpeed,
      unit: "RPM",
      normalRange: { min: 1500, max: 3000 },
      criticalRange: { min: 1400, max: 3200 },
      issueId: reading.servoMotorSpeed < 1400 || reading.servoMotorSpeed > 3200 ? 1 : 8
    },
    {
      id: "servo-motor-vibration",
      name: "Servo Motor Vibration",
      value: reading.servoMotorVibration,
      unit: "mm/s (RMS)",
      normalRange: { min: 0.5, max: 2 },
      criticalRange: { max: 3 },
      issueId: reading.servoMotorVibration > 3 ? 2 : 8
    },
    {
      id: "tooling-vibration",
      name: "Tool Vibration",
      value: reading.toolingVibration,
      unit: "mm/s (RMS)",
      normalRange: { min: 1, max: 3 },
      criticalRange: { max: 4 },
      issueId: reading.toolingVibration > 4 ? 3 : 8
    },
    {
      id: "tool-wear-level",
      name: "Tool Wear Level",
      value: reading.toolWearLevel,
      unit: "% of Life",
      normalRange: { min: 80, max: 100 },
      criticalRange: { min: 20, max: 30 },
      issueId: reading.toolWearLevel < 30 ? 4 : 8
    },
    {
      id: "tool-coolant-supply",
      name: "Tool Coolant Supply Level",
      value: reading.toolCoolantSupplyLevel,
      unit: "% level",
      normalRange: { min: 70, max: 100 },
      criticalRange: { min: 50 },
      issueId: reading.toolCoolantSupplyLevel < 50 ? 5 : 8
    },
    {
      id: "coolant-reservoir-level",
      name: "Coolant Reservoir Level",
      value: reading.coolantReservoirLevel,
      unit: "% Capacity",
      normalRange: { min: 80, max: 100 },
      criticalRange: { min: 50 },
      issueId: reading.coolantReservoirLevel < 50 ? 6 : 8
    },
    {
      id: "coolant-flow-rate",
      name: "Coolant Flow Rate",
      value: reading.coolantFlowRate,
      unit: "L/min",
      normalRange: { min: 5, max: 8 },
      criticalRange: { min: 3, max: 10 },
      issueId: reading.coolantFlowRate < 3 || reading.coolantFlowRate > 10 ? 7 : 8
    },
    {
      id: "base-plate-pressure",
      name: "Base Plate Pressure",
      value: reading.basePlatePressure,
      unit: "psi",
      normalRange: { min: 50, max: 70 },
      criticalRange: { min: 40, max: 80 },
      issueId: reading.basePlatePressure < 40 || reading.basePlatePressure > 80 ? 4 : 8
    },
    {
      id: "base-plate-vibration",
      name: "Base Plate Vibration",
      value: reading.basePlateVibration,
      unit: "mm/s (RMS)",
      normalRange: { min: 0.5, max: 1.5 },
      criticalRange: { max: 2 },
      issueId: reading.basePlateVibration > 2 ? 4 : 8
    },
    {
      id: "base-plate-coolant",
      name: "Base Plate Coolant Distribution",
      value: reading.basePlateCoolantDistribution,
      unit: "% Coverage",
      normalRange: { min: 80, max: 100 },
      criticalRange: { min: 50 },
      issueId: reading.basePlateCoolantDistribution < 50 ? 5 : 8
    }
  ];
}

// Get sensor severity level
export function getSensorSeverity(sensor: Sensor): 'normal' | 'warning' | 'critical' {
  const issue = anomalyIssues.find(i => i.id === sensor.issueId);
  return issue ? issue.severity : 'normal';
}

// Format sensor value with appropriate precision
export function formatSensorValue(sensor: Sensor): string {
  if (sensor.unit === 'mm/s (RMS)') {
    return sensor.value.toFixed(2) + ' ' + sensor.unit;
  } else if (sensor.unit === 'V' || sensor.unit === 'L/min') {
    return sensor.value.toFixed(1) + ' ' + sensor.unit;
  } else if (sensor.unit === 'RPM' || sensor.unit === 'psi') {
    return Math.round(sensor.value) + ' ' + sensor.unit;
  } else {
    return sensor.value.toFixed(1) + ' ' + sensor.unit;
  }
}

// Check if a sensor reading is within normal range
export function isInNormalRange(sensor: Sensor): boolean {
  return sensor.value >= sensor.normalRange.min && 
         sensor.value <= sensor.normalRange.max;
}

// Generate insights from sensor data
export function generateInsightsFromSensors(sensors: Sensor[]): string[] {
  const insights: string[] = [];
  const anomalies = sensors.filter(s => s.issueId !== 8);
  
  if (anomalies.length === 0) {
    insights.push("All sensor readings are within normal operating parameters.");
    return insights;
  }
  
  // Group anomalies by component
  const componentIssues: Record<string, Sensor[]> = {};
  anomalies.forEach(sensor => {
    const issue = anomalyIssues.find(i => i.id === sensor.issueId);
    if (issue) {
      if (!componentIssues[issue.affectedComponent]) {
        componentIssues[issue.affectedComponent] = [];
      }
      componentIssues[issue.affectedComponent].push(sensor);
    }
  });
  
  // Generate insights for each component
  Object.entries(componentIssues).forEach(([component, issues]) => {
    insights.push(`${component} shows ${issues.length} anomalies that require attention.`);
    
    issues.forEach(sensor => {
      const issue = anomalyIssues.find(i => i.id === sensor.issueId);
      if (issue) {
        insights.push(`${issue.name}: ${sensor.name} reading of ${formatSensorValue(sensor)} is outside normal range of ${sensor.normalRange.min}-${sensor.normalRange.max} ${sensor.unit}.`);
      }
    });
  });
  
  // Add recommendations
  if (Object.keys(componentIssues).length > 0) {
    insights.push("Recommended action: Perform a diagnostic check on the affected components before the next operation.");
  }
  
  return insights;
}

// Get the most critical issue from a list of sensors
export function getMostCriticalIssue(sensors: Sensor[]) {
  // Find sensors with issues
  const sensorIssues = sensors.filter(s => s.issueId !== 8);
  
  if (sensorIssues.length === 0) {
    return anomalyIssues[8]; // Normal
  }
  
  // Find the most critical issue
  let mostCritical = sensorIssues[0];
  for (const sensor of sensorIssues) {
    const currentIssue = anomalyIssues.find(i => i.id === sensor.issueId);
    const mostCriticalIssue = anomalyIssues.find(i => i.id === mostCritical.issueId);
    
    if (currentIssue && mostCriticalIssue) {
      if (currentIssue.severity === 'critical' && mostCriticalIssue.severity !== 'critical') {
        mostCritical = sensor;
      }
    }
  }
  
  return anomalyIssues.find(i => i.id === mostCritical.issueId);
}
