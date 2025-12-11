import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Info } from 'lucide-react';

export default function GanttPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaeaea] to-[#f5f5f5] dark:from-[#26282b] dark:to-[#383b3e] pt-4 md:pt-6">
      <div className="container mx-auto px-4 md:px-6 pb-4 md:pb-6 space-y-6">
        <div className="gantt-header">
          <h1 className="text-3xl font-bold text-[#26282b] dark:text-[#eaeaea]">Gantt Chart</h1>
          <p className="text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-2">
            Visualize project timelines and dependencies
          </p>
        </div>

        <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Gantt Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Gantt chart functionality is coming soon. This feature will allow you to visualize project timelines, dependencies, and milestones.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}






