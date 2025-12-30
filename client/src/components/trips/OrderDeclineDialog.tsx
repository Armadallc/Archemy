import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { Loader2, XCircle, AlertTriangle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface OrderDeclineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: {
    id: string;
    reference_id?: string;
    client?: { first_name: string; last_name: string };
    client_group?: { name: string };
    scheduled_pickup_time: string;
  };
}

const DECLINE_REASONS = [
  { value: 'conflict', label: 'Conflict' },
  { value: 'day_off', label: 'Day Off' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'vehicle_issue', label: 'Vehicle Issue' },
  { value: 'personal_emergency', label: 'Personal Emergency' },
  { value: 'too_far', label: 'Too Far' },
];

export function OrderDeclineDialog({
  open,
  onOpenChange,
  trip,
}: OrderDeclineDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [isDeclining, setIsDeclining] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientName = trip.client
    ? `${trip.client.first_name} ${trip.client.last_name}`
    : trip.client_group?.name || "Client";

  const tripDate = format(parseISO(trip.scheduled_pickup_time), "MMM d, yyyy");
  const tripTime = format(parseISO(trip.scheduled_pickup_time), "h:mm a");

  const handleDecline = async () => {
    if (!selectedReason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for declining the trip order.",
        variant: "destructive",
      });
      return;
    }

    setIsDeclining(true);

    try {
      const response = await apiRequest("POST", `/api/trips/${trip.id}/decline-order`, {
        reason: selectedReason,
      });
      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Order Declined",
          description: "The trip order has been declined. A super admin will be notified to assign a new driver.",
        });

        // Invalidate trips query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
        onOpenChange(false);
        setSelectedReason("");
      } else {
        throw new Error(data.message || "Failed to decline order");
      }
    } catch (error: any) {
      toast({
        title: "Decline Failed",
        description: error.message || "Failed to decline trip order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeclining(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5" style={{ color: '#EF4444' }} />
            Decline Trip Order
          </DialogTitle>
          <DialogDescription>
            Please provide a reason for declining this trip order. A super admin will be notified to assign a new driver.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Client:</strong> {clientName}
              </div>
              <div>
                <strong>Date:</strong> {tripDate}
              </div>
              <div>
                <strong>Time:</strong> {tripTime}
              </div>
              {trip.reference_id && (
                <div>
                  <strong>Reference ID:</strong> {trip.reference_id}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="decline-reason" className="text-sm font-medium">
              Reason for Declining *
            </Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger
                id="decline-reason"
                className="card-neu-flat [&]:shadow-none"
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                {DECLINE_REASONS.map((reason) => (
                  <SelectItem
                    key={reason.value}
                    value={reason.value}
                    className="hover:card-neu-flat"
                  >
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444' }}>
            <AlertTriangle className="h-4 w-4 mt-0.5" style={{ color: '#EF4444' }} />
            <p className="text-sm" style={{ color: '#EF4444' }}>
              <strong>Note:</strong> Declining this order will remove your assignment. The trip will remain in "Order" status and a super admin will be notified to assign a new driver.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedReason("");
            }}
            disabled={isDeclining}
            className="card-neu-flat hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDecline}
            disabled={isDeclining || !selectedReason}
            className="card-neu hover:card-neu-pressed [&]:shadow-none"
            style={{ 
              backgroundColor: 'var(--background)', 
              border: 'none',
              opacity: !selectedReason ? 0.5 : 1
            }}
          >
            {isDeclining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Declining...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-4 w-4" />
                Decline Order
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

