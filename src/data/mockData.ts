
import { AnomalyIssue, MachinedPart, SensorReading } from "../types";

// Mock anomaly issues
export const anomalyIssues: AnomalyIssue[] = [
  { id: 0, name: "Power Fluctuation", description: "Voltage supply to servo motor outside normal operating range", severity: "critical", affectedComponent: "Servo Motor" },
  { id: 1, name: "Motor Overload", description: "Servo motor operating outside normal speed range", severity: "warning", affectedComponent: "Servo Motor" },
  { id: 2, name: "Excessive Tool Vibration", description: "Servo motor vibration outside normal operation parameters", severity: "warning", affectedComponent: "Servo Motor" },
  { id: 3, name: "Inadequate Cooling", description: "Tooling vibration outside normal operation parameters", severity: "warning", affectedComponent: "Tooling" },
  { id: 4, name: "Base Plate Instability", description: "Tool wear level indicating replacement required soon", severity: "warning", affectedComponent: "Tooling" },
  { id: 5, name: "Coolant Pump Malfunction", description: "Coolant supply level below recommended threshold", severity: "critical", affectedComponent: "Coolant Pump" },
  { id: 6, name: "Overheating and Expansion", description: "Coolant reservoir level below recommended threshold", severity: "warning", affectedComponent: "Coolant Pump" },
  { id: 7, name: "Tool Misalignment", description: "Coolant flow rate outside normal parameters", severity: "warning", affectedComponent: "Coolant Pump" },
  { id: 8, name: "Normal", description: "All parameters within normal operating ranges", severity: "normal", affectedComponent: "System" }
];

// Mock machined parts
export const machinedParts: MachinedPart[] = [
  {
    id: "PT-7843-A",
    name: "Precision Gear Assembly",
    material: "Stainless Steel 316L",
    lastMachined: new Date(2023, 3, 15),
    operationTime: 94.5,
    issueHistory: [8, 8, 8, 2, 8, 8],
    imageUrl: "/lovable-uploads/d6b2bb20-107c-45e5-beab-f5a4963ba28b.png"
  },
  {
    id: "PT-6392-B",
    name: "Turbine Impeller",
    material: "Titanium Ti-6Al-4V",
    lastMachined: new Date(2023, 4, 22),
    operationTime: 127.3,
    issueHistory: [8, 1, 8, 8, 5, 8],
    imageUrl: "/lovable-uploads/3d141fcc-942a-45a1-a2c8-12d397cd006c.png"
  },
  {
    id: "PT-9201-C",
    name: "Hydraulic Valve Housing",
    material: "Aluminum 7075-T6",
    lastMachined: new Date(2023, 5, 8),
    operationTime: 68.7,
    issueHistory: [0, 8, 8, 8, 8, 8],
    imageUrl: "/placeholder.svg"
  },
  {
    id: "PT-5127-D",
    name: "Transmission Coupling",
    material: "Alloy Steel 4340",
    lastMachined: new Date(2023, 5, 17),
    operationTime: 83.2,
    issueHistory: [8, 8, 3, 8, 8, 8],
    imageUrl: "/placeholder.svg"
  },
  {
    id: "PT-3476-E",
    name: "Medical Implant Component",
    material: "Titanium Ti-6Al-4V ELI",
    lastMachined: new Date(2023, 6, 5),
    operationTime: 105.9,
    issueHistory: [8, 8, 8, 8, 8, 8],
    imageUrl: "/placeholder.svg"
  }
];

// Generate mock sensor readings
export const generateMockSensorReadings = (count: number, anomalyChance: number = 0.1): SensorReading[] => {
  const readings: SensorReading[] = [];
  
  const now = Date.now();
  const hourInMs = 3600000;
  
  for (let i = 0; i < count; i++) {
    // Determine if this reading should have an anomaly
    const hasAnomaly = Math.random() < anomalyChance;
    const anomalyType = hasAnomaly ? Math.floor(Math.random() * 8) : 8; // 8 is normal
    
    // Create a reading where most values are normal, but potentially introduce an anomaly
    const reading: SensorReading = {
      timestamp: now - (i * hourInMs),
      servoMotorVoltage: generateValue(46, 50, anomalyType === 0 ? 0.5 : 0.1),
      servoMotorSpeed: generateValue(1500, 3000, anomalyType === 1 ? 0.5 : 0.1),
      servoMotorVibration: generateValue(0.5, 2, anomalyType === 2 ? 0.5 : 0.1),
      toolingVibration: generateValue(1, 3, anomalyType === 3 ? 0.5 : 0.1),
      toolWearLevel: generateValue(80, 100, anomalyType === 4 ? 0.5 : 0.1),
      toolCoolantSupplyLevel: generateValue(70, 100, anomalyType === 5 ? 0.5 : 0.1),
      coolantReservoirLevel: generateValue(80, 100, anomalyType === 6 ? 0.5 : 0.1),
      coolantFlowRate: generateValue(5, 8, anomalyType === 7 ? 0.5 : 0.1),
      basePlatePressure: generateValue(50, 70, 0.1),
      basePlateVibration: generateValue(0.5, 1.5, 0.1),
      basePlateCoolantDistribution: generateValue(80, 100, 0.1),
      issueId: anomalyType
    };
    
    readings.push(reading);
  }
  
  return readings;
};

// Helper to generate values within a range with some randomness
function generateValue(min: number, max: number, anomalyChance: number): number {
  const hasAnomaly = Math.random() < anomalyChance;
  
  if (hasAnomaly) {
    // For anomalies, generate values outside the normal range
    const isLow = Math.random() < 0.5;
    if (isLow) {
      return min - (min * Math.random() * 0.5); // Up to 50% below min
    } else {
      return max + (max * Math.random() * 0.5); // Up to 50% above max
    }
  }
  
  // Normal values within range
  return min + Math.random() * (max - min);
}

// Get historical readings for a specific part
export function getPartHistoricalReadings(partId: string): SensorReading[] {
  // In a real application, this would fetch from a database
  // Here we just generate mock data based on the part ID to ensure consistency
  const seed = partId.charCodeAt(0) + partId.charCodeAt(partId.length - 1);
  const anomalyChance = (seed % 10) / 100; // Between 0.01 and 0.09
  
  return generateMockSensorReadings(50, anomalyChance);
}

// Get sensor data for dashboard display
export function getDashboardSensorData() {
  // Generate a small set of current readings
  return generateMockSensorReadings(1, 0.2)[0];
}
