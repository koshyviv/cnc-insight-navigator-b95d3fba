
import { MachinedPart } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Check, AlertTriangle } from "lucide-react";

interface MachinedPartListProps {
  parts: MachinedPart[];
}

const MachinedPartList = ({ parts }: MachinedPartListProps) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {parts.map(part => {
        const hasAnomalies = part.issueHistory.some(issue => issue !== 8);
        
        return (
          <Card key={part.id} className="overflow-hidden">
            <div className="grid md:grid-cols-2">
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{part.name}</h3>
                <div className="space-y-2">
                  <p className="text-sm flex justify-between">
                    <span className="text-muted-foreground">Part ID:</span>
                    <span className="font-medium">{part.id}</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-muted-foreground">Material:</span>
                    <span>{part.material}</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-muted-foreground">Last Machined:</span>
                    <span>{formatDate(part.lastMachined)}</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-muted-foreground">Operation Time:</span>
                    <span>{part.operationTime} min</span>
                  </p>
                  <p className="text-sm flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="flex items-center">
                      {hasAnomalies ? (
                        <>
                          <AlertTriangle className="text-cnc-warning h-4 w-4 mr-1" />
                          <span>Issues detected</span>
                        </>
                      ) : (
                        <>
                          <Check className="text-cnc-success h-4 w-4 mr-1" />
                          <span>Normal</span>
                        </>
                      )}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="bg-muted flex items-center justify-center p-2">
                <img 
                  src={part.imageUrl} 
                  alt={part.name} 
                  className="object-contain max-h-48 w-full"
                />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default MachinedPartList;
