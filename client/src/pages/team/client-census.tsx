import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, BarChart3 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";

export default function TeamClientCensusPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <BarChart3 className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Client Census</h1>
          <p className="text-muted-foreground">
            Demographic view for capacity planning and census reporting
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Census</CardTitle>
          <CardDescription>
            This page provides a demographic view for capacity planning, distinct from the transactional "Clients for Trips" view in Operations.
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Program/Location assignment tracking</li>
              <li>Room/Bed assignments</li>
              <li>Census reporting (NOT trip management)</li>
              <li>Demographic data for capacity planning</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Client Census page - Coming soon</p>
            <p className="text-sm mt-2 text-amber-600 dark:text-amber-400">
              Note: This is different from Operations → Clients, which is for trip management
            </p>
            {user?.role === 'corporate_admin' && (
              <p className="text-sm mt-2">Viewing data for: {selectedCorporateClient || 'Your Corporate Client'}</p>
            )}
            {user?.role === 'super_admin' && (
              <p className="text-sm mt-2">Tenant filter will be available here</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




