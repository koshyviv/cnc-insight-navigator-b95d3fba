
import { useEffect, useState } from "react";
import { getDashboardSensorData, machinedParts } from "../data/mockData";
import { SensorReading } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SensorStatus from "./SensorStatus";
import MachinedPartList from "./MachinedPartList";
import { getSensorsFromReading, generateInsightsFromSensors, getMostCriticalIssue } from "@/utils/sensorUtils";
import MachineStatus from "./MachineStatus";
import { AlertTriangle, Check } from "lucide-react";

const Dashboard = () => {
  const [sensorData, setSensorData] = useState<SensorReading | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Simulate periodic data updates
  useEffect(() => {
    const fetchData = () => {
      const data = getDashboardSensorData();
      setSensorData(data);
    };

    fetchData();
    
    // Set up interval for refreshing data
    const intervalId = setInterval(() => {
      fetchData();
      setRefreshCounter(prev => prev + 1);
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(intervalId);
  }, []);

  // Convert raw data to sensor objects with metadata
  const sensors = sensorData ? getSensorsFromReading(sensorData) : [];
  const insights = sensors.length > 0 ? generateInsightsFromSensors(sensors) : [];
  const mostCriticalIssue = sensors.length > 0 ? getMostCriticalIssue(sensors) : null;
  
  return (
    <div className="dashboard-container">
      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="col-span-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl font-bold">CNC Machine Status</CardTitle>
            <span className="text-xs text-muted-foreground">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </CardHeader>
          <CardContent>
            <MachineStatus sensors={sensors} />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="sensors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensors">Sensor Readings</TabsTrigger>
          <TabsTrigger value="parts">Machined Parts</TabsTrigger>
          <TabsTrigger value="insights">System Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="sensors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sensors.map(sensor => (
              <SensorStatus key={sensor.id} sensor={sensor} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="parts">
          <MachinedPartList parts={machinedParts} />
        </TabsContent>
        
        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {mostCriticalIssue && mostCriticalIssue.severity !== 'normal' ? (
                  <>
                    <AlertTriangle className="text-cnc-warning" size={20} />
                    <span>System Insights & Recommendations</span>
                  </>
                ) : (
                  <>
                    <Check className="text-cnc-success" size={20} />
                    <span>System Status Normal</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.length > 0 ? (
                  <ul className="space-y-2">
                    {insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-cnc-blue mt-0.5">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Loading system insights...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
