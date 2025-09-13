import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertCircle, Calendar, Plus, Trash2, Eye, Activity } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useOrganization } from '@/hooks/useOrganization';
import { apiRequest } from '@/lib/queryClient';

interface WebhookIntegration {
  id: string;
  organization_id: string;
  name: string;
  provider: string;
  webhook_url?: string;
  filter_keywords: string[];
  filter_attendees: string[];
  status: 'active' | 'inactive' | 'error';
  last_sync?: string;
  created_at: string;
}

interface WebhookEventLog {
  id: string;
  integration_id: string;
  event_type: string;
  event_data: any;
  status: 'success' | 'error' | 'skipped';
  trips_created: string[];
  error_message?: string;
  created_at: string;
}

export default function IntegrationsPage() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedEventLog, setSelectedEventLog] = useState<WebhookEventLog | null>(null);

  // Fetch integrations
  const { data: integrations = [], isLoading: integrationsLoading } = useQuery({
    queryKey: ['/api/webhooks/integrations', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
  });

  // Fetch event logs
  const { data: eventLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['/api/webhooks/logs', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
  });

  // Create integration mutation
  const createIntegration = useMutation({
    mutationFn: (data: any) => apiRequest('/api/webhooks/integrations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks/integrations'] });
      setIsCreateDialogOpen(false);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentOrganization) {
    return <div className="p-6">Please select an organization first.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">CALENDAR INTEGRATIONS</h1>
          <p className="text-gray-600 mt-2">
            Connect your EHR/EMR calendar to automatically create transport trips
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Calendar Integration</DialogTitle>
            </DialogHeader>
            <CreateIntegrationForm 
              onSubmit={(data) => createIntegration.mutate(data)}
              isLoading={createIntegration.isPending}
              organizationId={currentOrganization.id}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Setup Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Ritten.io Integration Setup:</strong> Contact your Ritten.io support representative to configure webhook notifications. 
          You'll need to provide them with the webhook URL shown in your integration settings below.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="integrations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="integrations">
            <Calendar className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="w-4 h-4 mr-2" />
            Activity Log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="integrations" className="space-y-4">
          {integrationsLoading ? (
            <div className="text-center py-8">Loading integrations...</div>
          ) : integrations.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Calendar Integrations</h3>
                <p className="text-gray-600 mb-4">
                  Connect your Ritten.io calendar to automatically create transport trips from appointments.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Integration
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {integrations.map((integration: WebhookIntegration) => (
                <IntegrationCard 
                  key={integration.id} 
                  integration={integration}
                  onUpdate={() => queryClient.invalidateQueries({ queryKey: ['/api/webhooks/integrations'] })}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          {logsLoading ? (
            <div className="text-center py-8">Loading activity...</div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Recent Webhook Events</CardTitle>
              </CardHeader>
              <CardContent>
                {eventLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No webhook events received yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {eventLogs.map((log: WebhookEventLog) => (
                      <div 
                        key={log.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => setSelectedEventLog(log)}
                      >
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(log.status)}>
                            {log.status}
                          </Badge>
                          <div>
                            <div className="font-medium">{log.event_type}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(log.created_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {log.trips_created && log.trips_created.length > 0 && (
                            <Badge variant="outline">
                              {log.trips_created.length} trips created
                            </Badge>
                          )}
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Log Detail Dialog */}
      {selectedEventLog && (
        <Dialog open={!!selectedEventLog} onOpenChange={() => setSelectedEventLog(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Webhook Event Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Event Type</Label>
                  <div className="font-mono text-sm">{selectedEventLog.event_type}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(selectedEventLog.status)}>
                    {selectedEventLog.status}
                  </Badge>
                </div>
                <div>
                  <Label>Received</Label>
                  <div className="text-sm">{new Date(selectedEventLog.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <Label>Trips Created</Label>
                  <div className="text-sm">
                    {selectedEventLog.trips_created?.length || 0} trips
                  </div>
                </div>
              </div>
              
              {selectedEventLog.error_message && (
                <div>
                  <Label>Error Message</Label>
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {selectedEventLog.error_message}
                  </div>
                </div>
              )}
              
              <div>
                <Label>Raw Event Data</Label>
                <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-60">
                  {JSON.stringify(selectedEventLog.event_data, null, 2)}
                </pre>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Integration Card Component
function IntegrationCard({ integration, onUpdate }: { integration: WebhookIntegration; onUpdate: () => void }) {
  const webhookUrl = `${window.location.origin}/api/webhooks/webhook/${integration.id}`;
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <div>
              <CardTitle className="text-lg">{integration.name}</CardTitle>
              <div className="text-sm text-gray-600 capitalize">
                {integration.provider} integration
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(integration.status)}>
              {integration.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">Webhook URL</Label>
            <div className="text-xs font-mono bg-gray-100 p-2 rounded">
              {webhookUrl}
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium">Last Sync</Label>
            <div className="text-sm">
              {integration.last_sync ? new Date(integration.last_sync).toLocaleString() : 'Never'}
            </div>
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Filter Keywords</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {integration.filter_keywords.map((keyword, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Filter Attendees</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {integration.filter_attendees.map((attendee, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {attendee}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Create Integration Form Component
function CreateIntegrationForm({ 
  onSubmit, 
  isLoading, 
  organizationId 
}: { 
  onSubmit: (data: any) => void; 
  isLoading: boolean; 
  organizationId: string;
}) {
  const [formData, setFormData] = useState({
    name: '',
    provider: 'ritten',
    filter_keywords: '',
    filter_attendees: '',
    auto_create: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      organization_id: organizationId,
      name: formData.name,
      provider: formData.provider,
      filter_keywords: formData.filter_keywords.split(',').map(k => k.trim()).filter(Boolean),
      filter_attendees: formData.filter_attendees.split(',').map(a => a.trim()).filter(Boolean),
      status: 'inactive' // Start inactive until webhook URL is configured
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Integration Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Ritten Calendar Integration"
          required
        />
      </div>

      <div>
        <Label htmlFor="provider">Calendar Provider</Label>
        <Select value={formData.provider} onValueChange={(value) => setFormData({ ...formData, provider: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ritten">Ritten.io</SelectItem>
            <SelectItem value="google_calendar">Google Calendar</SelectItem>
            <SelectItem value="outlook">Outlook Calendar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="keywords">Filter Keywords (comma-separated)</Label>
        <Input
          id="keywords"
          value={formData.filter_keywords}
          onChange={(e) => setFormData({ ...formData, filter_keywords: e.target.value })}
          placeholder="transport, your name, etc."
        />
        <div className="text-xs text-gray-500 mt-1">
          Only events containing these keywords will create trips
        </div>
      </div>

      <div>
        <Label htmlFor="attendees">Filter Attendees (comma-separated)</Label>
        <Input
          id="attendees"
          value={formData.filter_attendees}
          onChange={(e) => setFormData({ ...formData, filter_attendees: e.target.value })}
          placeholder="Your Name, Transport Driver, etc."
        />
        <div className="text-xs text-gray-500 mt-1">
          Only events with these attendees will create trips
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={() => setFormData({ name: '', provider: 'ritten', filter_keywords: '', filter_attendees: '', auto_create: true })}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Integration'}
        </Button>
      </div>
    </form>
  );
}