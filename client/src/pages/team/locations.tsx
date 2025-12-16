import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { MapPin, Building } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useHierarchy } from "../../hooks/useHierarchy";

export default function TeamLocationsPage() {
  const { user } = useAuth();
  const { level, selectedCorporateClient, selectedProgram } = useHierarchy();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <MapPin className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Locations</h1>
          <p className="text-muted-foreground">
            Manage locations, room inventory, bed assignments, and location-specific data
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Locations Management</CardTitle>
          <CardDescription>
            This page will display location management features including:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Location Census (Clients, Staff)</li>
              <li>Staff List & Hierarchy</li>
              <li>Location Purpose Tags (residence, meetings, QMAP, etc.)</li>
              <li>Room Inventory + Capacity</li>
              <li>Room/Bed Assignments</li>
              <li>Example: "Program: Monarch → Location: Lowell 5245 → Room: 1 → Bed: 3"</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Locations management page - Coming soon</p>
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
