
export interface Sensor {
  id: string;
  name: string;
  value: number;
  unit: string;
  normalRange: {
    min: number;
    max: number;
  };
  criticalRange: {
    min?: number;
    max?: number;
  };
  issueId: number;
}

export interface SensorReading {
  timestamp: number;
  servoMotorVoltage: number;
  servoMotorSpeed: number;
  servoMotorVibration: number;
  toolingVibration: number;
  toolWearLevel: number;
  toolCoolantSupplyLevel: number;
  coolantReservoirLevel: number;
  coolantFlowRate: number;
  basePlatePressure: number;
  basePlateVibration: number;
  basePlateCoolantDistribution: number;
  issueId: number;
}

export interface MachinedPart {
  id: string;
  name: string;
  material: string;
  lastMachined: Date;
  operationTime: number;
  issueHistory: number[];
  imageUrl: string;
}

export interface AnomalyIssue {
  id: number;
  name: string;
  description: string;
  severity: 'normal' | 'warning' | 'critical';
  affectedComponent: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ContextualData {
  part?: MachinedPart;
  sensorReadings?: SensorReading[];
  anomalies?: AnomalyIssue[];
  insights?: string[];
}
