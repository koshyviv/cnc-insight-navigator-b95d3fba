
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ContextualData, MachinedPart } from "@/types";
import Dashboard from "@/components/Dashboard";
import Chatbot from "@/components/Chatbot";
import { getDashboardSensorData, machinedParts } from "@/data/mockData";
import { getSensorsFromReading, generateInsightsFromSensors } from "@/utils/sensorUtils";
import PartDetail from "@/components/PartDetail";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

const Index = () => {
  const [selectedPart, setSelectedPart] = useState<MachinedPart | null>(null);
  const [contextData, setContextData] = useState<ContextualData>(() => {
    // Initialize with current sensor data
    const reading = getDashboardSensorData();
    const sensors = getSensorsFromReading(reading);
    const insights = generateInsightsFromSensors(sensors);
    
    return {
      sensorReadings: [reading],
      insights
    };
  });
  const [showPart, setShowPart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
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
      
      <main className="flex-grow container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dashboard */}
          <div className="lg:col-span-2">
            <Dashboard />
          </div>
          
          {/* Chatbot */}
          <div className="h-[calc(100vh-10rem)]">
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
      
      <footer className="bg-white border-t py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          CNC Insight Navigator v1.0 • © 2023 Advanced Manufacturing Solutions
        </div>
      </footer>
    </div>
  );
};

export default Index;
