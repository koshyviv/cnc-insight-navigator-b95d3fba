import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ContextualData, MachinedPart, AnomalyIssue } from "@/types";
import Dashboard from "@/components/Dashboard";
import Chatbot from "@/components/Chatbot";
import { getDashboardSensorData, machinedParts, anomalyIssues } from "@/data/mockData";
import { getSensorsFromReading, generateInsightsFromSensors } from "@/utils/sensorUtils";
import PartDetail from "@/components/PartDetail";
import { Search, ChevronUp, ChevronDown } from "lucide-react";
import { recordSystemState } from "@/services/historyService";

const Index = () => {
  const [selectedPart, setSelectedPart] = useState<MachinedPart | null>(null);
  const [contextData, setContextData] = useState<ContextualData>(() => {
    // Initialize with current sensor data, insights, AND anomalies
    const reading = getDashboardSensorData();
    const sensors = getSensorsFromReading(reading);
    const insights = generateInsightsFromSensors(sensors);
    
    // Find the corresponding anomaly based on the reading's issueId
    const currentAnomaly = anomalyIssues.find(a => a.id === reading.issueId);
    const initialAnomalies: AnomalyIssue[] = currentAnomaly && currentAnomaly.severity !== 'normal' 
      ? [currentAnomaly] 
      : []; // Only include if it's not 'normal'
      
    console.log("Initial Context Data:", { sensorReadings: [reading], insights, anomalies: initialAnomalies });

    return {
      sensorReadings: [reading],
      insights,
      anomalies: initialAnomalies // Add anomalies to initial state
    };
  });
  const [showPart, setShowPart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Initialize history system with current state
  useEffect(() => {
    if (contextData.sensorReadings && contextData.sensorReadings.length > 0) {
      // Record the initial system state
      recordSystemState(contextData.sensorReadings[0]);
      
      // Simulate some past states for demonstration
      const pastTimestamps = [
        new Date(Date.now() - 3600000), // 1 hour ago
        new Date(Date.now() - 7200000), // 2 hours ago
        new Date(Date.now() - 14400000)  // 4 hours ago
      ];
      
      // Make a deep copy of the initial reading to avoid modifying it
      const initialReading = { ...contextData.sensorReadings[0] };
      
      // Create history entries with some different anomalies to represent past states
      // Tooling vibration issue (id 3)
      const issue1 = { ...initialReading, issueId: 3 };
      // Coolant pump issue (id 5)
      const issue2 = { ...initialReading, issueId: 5 };
      // Normal operation (id 8)
      const issue3 = { ...initialReading, issueId: 8 };
      
      // Record these past states (with timestamps in the past)
      recordSystemState(issue1, machinedParts[0]);
      recordSystemState(issue2);
      recordSystemState(issue3, machinedParts[1]);
    }
  }, []);
  
  // Handle searching for parts
  const handleSearch = () => {
    if (!searchTerm) return;
    
    const foundPart = machinedParts.find(
      part => part.id.toLowerCase() === searchTerm.toLowerCase() || 
              part.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    if (foundPart) {
      setSelectedPart(foundPart);
      setShowPart(true);
    } else {
      // Could add toast notification here
      console.log("Part not found");
    }
  };
  
  // Update context when part changes
  const handleContextChange = (data: ContextualData) => {
    setContextData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10 flex-shrink-0">
        <div className="container mx-auto py-3 px-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 9L12 5L21 9L12 13L3 9Z" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 9V14M21 9V14" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 13V18" stroke="#1a73e8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-xl font-bold">CNC Insight Navigator</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                className="w-full md:w-64 pl-3 pr-10 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-cnc-blue"
              />
              <button 
                onClick={handleSearch}
                className="absolute inset-y-0 right-0 px-3 flex items-center"
              >
                <Search className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto p-4 overflow-hidden flex flex-col">
        <div className="flex flex-grow gap-6 h-full overflow-hidden">
          {/* Main Dashboard */}
          <div className="flex-grow h-full overflow-auto">
            <Dashboard />
          </div>
          
          {/* Chatbot */}
          <div className="w-96 flex-shrink-0 h-full">
            <Chatbot contextData={contextData} />
          </div>
        </div>
        
        {/* Part Detail Section */}
        {selectedPart && (
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">Part Details</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowPart(!showPart)}
                className="text-cnc-gray"
              >
                {showPart ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    <span>Show</span>
                  </>
                )}
              </Button>
            </div>
            
            <Separator className="my-2" />
            
            {showPart && (
              <PartDetail part={selectedPart} onContextChange={handleContextChange} />
            )}
          </div>
        )}
      </main>
      
      {/* <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          CNC Insight Navigator v1.0 • © 2023 Advanced Manufacturing Solutions
        </div>
      </footer> */}
    </div>
  );
};

export default Index;
