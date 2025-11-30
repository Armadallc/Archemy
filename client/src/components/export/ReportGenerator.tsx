import React, { useState } from 'react';
import { Download, FileText, Calendar, Users, Car, DollarSign, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ExportService } from '../../services/exportService';
import { format } from 'date-fns';

interface ReportGeneratorProps {
  trips?: any[];
  drivers?: any[];
  clients?: any[];
  className?: string;
}

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  data: any[];
  generator: (data: any[], options?: any) => void;
  color: string;
}

export default function ReportGenerator({ 
  trips = [], 
  drivers = [], 
  clients = [], 
  className 
}: ReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  const reportTypes: ReportType[] = [
    {
      id: 'trips',
      name: 'Trip Report',
      description: 'Detailed trip information with pickup/dropoff times',
      icon: <Car className="h-5 w-5" />,
      data: trips,
      generator: ExportService.exportTripReport,
      color: ''
    },
    {
      id: 'drivers',
      name: 'Driver Report',
      description: 'Driver information and status details',
      icon: <Users className="h-5 w-5" />,
      data: drivers,
      generator: ExportService.exportDriverReport,
      color: 'bg-green-500'
    },
    {
      id: 'clients',
      name: 'Client Report',
      description: 'Client information and contact details',
      icon: <Users className="h-5 w-5" />,
      data: clients,
      generator: ExportService.exportClientReport,
      color: 'bg-purple-500'
    },
    {
      id: 'financial',
      name: 'Financial Report',
      description: 'Revenue and cost analysis by trip',
      icon: <DollarSign className="h-5 w-5" />,
      data: trips,
      generator: ExportService.exportFinancialReport,
      color: 'bg-yellow-500'
    }
  ];

  const handleGenerateReport = async (reportType: ReportType) => {
    if (reportType.data.length === 0) {
      console.warn(`No data available for ${reportType.name}`);
      return;
    }

    setIsGenerating(reportType.id);

    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing time
      reportType.generator(reportType.data, {
        filename: `${reportType.id}-report-${format(new Date(), 'yyyy-MM-dd')}`
      });
    } catch (error) {
      console.error(`Failed to generate ${reportType.name}:`, error);
    } finally {
      setIsGenerating(null);
    }
  };

  const getDataCount = (reportType: ReportType) => {
    return reportType.data.length;
  };

  const getDataStatus = (reportType: ReportType) => {
    const count = getDataCount(reportType);
    if (count === 0) return { text: 'No data', variant: 'secondary' as const };
    if (count < 10) return { text: 'Limited data', variant: 'secondary' as const };
    return { text: 'Ready', variant: 'default' as const };
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Report Generator</span>
          </CardTitle>
          <CardDescription>
            Generate comprehensive reports for your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTypes.map((reportType) => {
              const dataCount = getDataCount(reportType);
              const dataStatus = getDataStatus(reportType);
              const isGeneratingThis = isGenerating === reportType.id;

              return (
                <div
                  key={reportType.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`p-2 rounded-lg text-white ${reportType.color}`}
                        style={reportType.color === '' ? { backgroundColor: 'var(--blue-9)' } : {}}
                      >
                        {reportType.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{reportType.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {reportType.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant={dataStatus.variant}>
                      {dataStatus.text}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {dataCount} records available
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReport(reportType)}
                      disabled={dataCount === 0 || isGeneratingThis}
                    >
                      {isGeneratingThis ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {isGeneratingThis ? 'Generating...' : 'Generate'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Export Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Total Trips</div>
                <div className="font-semibold">{trips.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Drivers</div>
                <div className="font-semibold">{drivers.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Clients</div>
                <div className="font-semibold">{clients.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Last Updated</div>
                <div className="font-semibold">{format(new Date(), 'MMM dd, HH:mm')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}







