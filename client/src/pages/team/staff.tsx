import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Users, UserCircle } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";

export default function TeamStaffPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <UserCircle className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Staff</h1>
          <p className="text-muted-foreground">
            Staff directory with program, location, and role filtering
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Directory</CardTitle>
          <CardDescription>
            This page will display staff management features including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Staff Directory with Filters</li>
              <li>Program + Location + Role filtering</li>
              <li>App Role vs Company Role distinction</li>
              <li>Non-app users included in hierarchy</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Staff directory page - Coming soon</p>
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




