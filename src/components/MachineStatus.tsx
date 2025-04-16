
import { Sensor } from "@/types";
import { Progress } from "@/components/ui/progress";
import { getMostCriticalIssue } from "@/utils/sensorUtils";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";

interface MachineStatusProps {
  sensors: Sensor[];
}

const MachineStatus = ({ sensors }: MachineStatusProps) => {
  const abnormalSensors = sensors.filter(s => s.issueId !== 8);
  const criticalSensors = abnormalSensors.filter(s => 
    s.issueId === 0 || s.issueId === 5 || s.issueId === 6
  );
  
  const normalPercentage = ((sensors.length - abnormalSensors.length) / sensors.length) * 100;
  const mostCriticalIssue = getMostCriticalIssue(sensors);
  
  let statusColor = "bg-cnc-success";
  let statusText = "Operational";
  let StatusIcon = CheckCircle;
  
  if (criticalSensors.length > 0) {
    statusColor = "bg-cnc-error";
    statusText = "Critical Alert";
    StatusIcon = AlertCircle;
  } else if (abnormalSensors.length > 0) {
    statusColor = "bg-cnc-warning";
    statusText = "Warning";
    StatusIcon = AlertTriangle;
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className={`h-4 w-4 rounded-full ${statusColor}`}></div>
          <h3 className="font-medium">Status: {statusText}</h3>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm">System health:</span>
          <Progress value={normalPercentage} className="w-24 h-2" />
          <span className="text-sm font-medium">{Math.round(normalPercentage)}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className={`px-4 py-3 rounded-md border ${
          criticalSensors.length > 0 ? 'border-cnc-error bg-red-50' : 
          abnormalSensors.length > 0 ? 'border-cnc-warning bg-amber-50' : 
          'border-cnc-success bg-green-50'
        }`}>
          <div className="flex items-center space-x-2">
            <StatusIcon className={`h-5 w-5 ${
              criticalSensors.length > 0 ? 'text-cnc-error' : 
              abnormalSensors.length > 0 ? 'text-cnc-warning' : 
              'text-cnc-success'
            }`} />
            <span className="font-medium">Machine Status</span>
          </div>
          <p className="text-sm mt-1">
            {criticalSensors.length > 0
              ? `${criticalSensors.length} critical issue${criticalSensors.length > 1 ? 's' : ''} detected`
              : abnormalSensors.length > 0
              ? `${abnormalSensors.length} warning${abnormalSensors.length > 1 ? 's' : ''} detected`
              : "All systems normal"}
          </p>
        </div>
        
        <div className="px-4 py-3 rounded-md border">
          <h4 className="font-medium">Active Operations</h4>
          <p className="text-sm mt-1">
            No active machining operations
          </p>
        </div>
        
        <div className="px-4 py-3 rounded-md border">
          <h4 className="font-medium">Status Summary</h4>
          <p className="text-sm mt-1">
            {mostCriticalIssue && mostCriticalIssue.id !== 8
              ? mostCriticalIssue.description
              : "All parameters within normal ranges"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MachineStatus;
