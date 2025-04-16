
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContextualData, MachinedPart, SensorReading } from "@/types";
import { useEffect, useState } from "react";
import { getPartHistoricalReadings } from "@/data/mockData";
import { generateInsightsFromSensors, getSensorsFromReading } from "@/utils/sensorUtils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PartDetailProps {
  part: MachinedPart | null;
  onContextChange: (data: ContextualData) => void;
}

const PartDetail = ({ part, onContextChange }: PartDetailProps) => {
  const [historicalData, setHistoricalData] = useState<SensorReading[]>([]);
  
  useEffect(() => {
    if (part) {
      const readings = getPartHistoricalReadings(part.id);
      setHistoricalData(readings);
      
      // Update context data with the part and its readings
      const sensors = readings.length > 0 ? getSensorsFromReading(readings[0]) : [];
      const insights = sensors.length > 0 ? generateInsightsFromSensors(sensors) : [];
      
      onContextChange({
        part,
        sensorReadings: readings,
        insights
      });
    }
  }, [part, onContextChange]);
  
  if (!part) {
    return null;
  }
  
  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Prepare data for charts
  const vibrationChartData = historicalData.slice(-20).map((reading, index) => ({
    name: `Reading ${index + 1}`,
    servoVibration: reading.servoMotorVibration,
    toolVibration: reading.toolingVibration,
    basePlateVibration: reading.basePlateVibration
  }));
  
  const coolantChartData = historicalData.slice(-20).map((reading, index) => ({
    name: `Reading ${index + 1}`,
    coolantLevel: reading.coolantReservoirLevel,
    coolantFlow: reading.coolantFlowRate * 10, // Scale to make visible on same chart
    toolCoolant: reading.toolCoolantSupplyLevel
  }));
  
  return (
    <Card className="h-full">
      <CardHeader className="pb-0">
        <CardTitle className="text-xl font-bold">{part.name}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Part ID: {part.id} • Last Machined: {formatDate(part.lastMachined)}
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="data-card">
                  <h3 className="text-sm font-medium text-muted-foreground">Material</h3>
                  <p className="text-lg font-semibold">{part.material}</p>
                </div>
                <div className="data-card">
                  <h3 className="text-sm font-medium text-muted-foreground">Operation Time</h3>
                  <p className="text-lg font-semibold">{part.operationTime} min</p>
                </div>
                <div className="data-card">
                  <h3 className="text-sm font-medium text-muted-foreground">Historical Issues</h3>
                  <p className="text-lg font-semibold">
                    {part.issueHistory.filter(issue => issue !== 8).length}
                  </p>
                </div>
                <div className="data-card">
                  <h3 className="text-sm font-medium text-muted-foreground">Last Run Status</h3>
                  <p className="text-lg font-semibold">
                    {part.issueHistory[0] !== 8 ? 'Warning' : 'Normal'}
                  </p>
                </div>
              </div>
              
              <Tabs defaultValue="vibration">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="vibration">Vibration History</TabsTrigger>
                  <TabsTrigger value="coolant">Coolant Systems</TabsTrigger>
                </TabsList>
                
                <TabsContent value="vibration" className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={vibrationChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="servoVibration" 
                        name="Servo Motor Vibration" 
                        stroke="#1a73e8" 
                        fill="#1a73e8" 
                        fillOpacity={0.2} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="toolVibration" 
                        name="Tool Vibration" 
                        stroke="#f29900" 
                        fill="#f29900" 
                        fillOpacity={0.2} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="basePlateVibration" 
                        name="Base Plate Vibration" 
                        stroke="#0d47a1" 
                        fill="#0d47a1" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
                
                <TabsContent value="coolant" className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={coolantChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={false} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="coolantLevel" 
                        name="Coolant Reservoir Level (%)" 
                        stroke="#1e8e3e" 
                        fill="#1e8e3e" 
                        fillOpacity={0.2} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="coolantFlow" 
                        name="Coolant Flow (scaled)" 
                        stroke="#1a73e8" 
                        fill="#1a73e8" 
                        fillOpacity={0.2} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="toolCoolant" 
                        name="Tool Coolant Level (%)" 
                        stroke="#d93025" 
                        fill="#d93025" 
                        fillOpacity={0.2} 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-2 flex items-center justify-center">
            <img 
              src={part.imageUrl} 
              alt={part.name} 
              className="max-h-64 object-contain w-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PartDetail;
