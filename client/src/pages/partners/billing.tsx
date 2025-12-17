import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { DollarSign, FileText } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { PermissionGuard } from "../../components/PermissionGuard";

export default function PartnersBillingPage() {
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
          <DollarSign className="w-8 h-8" />
          <div>
            <h1 className="text-3xl font-bold">Billing/Contracts</h1>
            <p className="text-muted-foreground">
              Manage billing and contracts with partners (future expansion)
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Contracts</CardTitle>
            <CardDescription>
              This page will be used for managing billing and contracts with corporate clients (partners).
              This is a future expansion area.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Billing/Contracts page - Coming soon</p>
              <p className="text-sm mt-2">
                This feature is planned for future implementation.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}




