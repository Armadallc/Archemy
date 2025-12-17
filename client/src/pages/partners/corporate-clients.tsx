import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Building2, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PermissionGuard } from "../../components/PermissionGuard";

export default function PartnersCorporateClientsPage() {
  const { user } = useAuth();

  return (
    <PermissionGuard permission="partners:manage_global" fallback={
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              Partner Management is only available to Super Admins.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Building2 className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Partners (Corporate Clients)</h1>
            <p className="text-muted-foreground">
              Manage business relationships and contracts with corporate clients
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partner Management</CardTitle>
            <CardDescription>
              This page is for Super Admins to manage business relationships with corporate clients (partners).
              All tenants are always visible here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Partner Management page - Coming soon</p>
              <p className="text-sm mt-2">
                This section manages business relationships, not operational data.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}





