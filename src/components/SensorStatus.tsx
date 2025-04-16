
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sensor } from "@/types";
import { getSensorSeverity, formatSensorValue, isInNormalRange } from "@/utils/sensorUtils";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface SensorStatusProps {
  sensor: Sensor;
}

const SensorStatus = ({ sensor }: SensorStatusProps) => {
  const severity = getSensorSeverity(sensor);
  const formattedValue = formatSensorValue(sensor);
  const isNormal = isInNormalRange(sensor);
  
  return (
    <Card className={`data-card ${
      severity === 'critical' ? 'border-cnc-error' : 
      severity === 'warning' ? 'border-cnc-warning' : 
      'border-cnc-success'
    }`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span>{sensor.name}</span>
          {isNormal ? (
            <CheckCircle className="text-cnc-success h-4 w-4" />
          ) : (
            <AlertTriangle className={`${
              severity === 'critical' ? 'text-cnc-error' : 'text-cnc-warning'
            } h-4 w-4`} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0">
        <p className="text-2xl font-semibold">{formattedValue}</p>
      </CardContent>
      <CardFooter className="pt-2">
        <p className="text-xs text-muted-foreground">
          Normal range: {sensor.normalRange.min}-{sensor.normalRange.max} {sensor.unit}
        </p>
      </CardFooter>
    </Card>
  );
};

export default SensorStatus;
