import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Info } from 'lucide-react';

export default function KanbanPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaeaea] to-[#f5f5f5] dark:from-[#26282b] dark:to-[#383b3e] pt-4 md:pt-6">
      <div className="container mx-auto px-4 md:px-6 pb-4 md:pb-6 space-y-6">
        <div className="kanban-header">
          <h1 className="text-3xl font-bold text-[#26282b] dark:text-[#eaeaea]">Kanban Board</h1>
          <p className="text-[#26282b]/70 dark:text-[#eaeaea]/70 mt-2">
            Manage tasks and workflows with Kanban boards
          </p>
        </div>

        <Card className="bg-white/25 dark:bg-[#2f3235]/25 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle>Kanban Board</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Kanban board functionality is under development. The components are available but need to be integrated with the backend API.
              </AlertDescription>
            </Alert>
            {/* TODO: Add KanbanExample component here once backend is ready */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




