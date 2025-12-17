import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Building2, FolderTree } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";

export default function TeamProgramsPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <FolderTree className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Programs</h1>
          <p className="text-muted-foreground">
            Manage programs, census data, staff hierarchy, and operational details
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Programs Management</CardTitle>
          <CardDescription>
            This page will display program management features including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Program Census + Staff Hierarchy</li>
              <li>Address/Contact Info</li>
              <li>Licensures with Expiry Alerts</li>
              <li>Staff Certification Tracking</li>
              <li>Staff Scheduling & Time-off</li>
              <li>Forms/Templates</li>
              <li>Tasks</li>
              <li>Curriculum/Syllabus Reference</li>
              <li>Staff Onboarding</li>
              <li>Client Onboarding + Client Rights</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Programs management page - Coming soon</p>
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




