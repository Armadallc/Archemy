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
import { useToast } from "../../hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../../lib/queryClient";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

interface OrderConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: {
    id: string;
    reference_id?: string;
    client?: { first_name: string; last_name: string };
    client_group?: { name: string };
    scheduled_pickup_time: string;
    trip_type: 'one_way' | 'round_trip';
    recurring_trip_id?: string;
    recurring_pattern?: any;
  };
  isRecurring?: boolean;
  recurringCount?: number;
}

export function OrderConfirmationDialog({
  open,
  onOpenChange,
  trip,
  isRecurring = false,
  recurringCount = 0,
}: OrderConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [showConfirmAll, setShowConfirmAll] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientName = trip.client
    ? `${trip.client.first_name} ${trip.client.last_name}`
    : trip.client_group?.name || "Client";

  const tripDate = format(parseISO(trip.scheduled_pickup_time), "MMM d, yyyy");
  const tripTime = format(parseISO(trip.scheduled_pickup_time), "h:mm a");

  const handleConfirm = async (confirmAll: boolean = false) => {
    setIsConfirming(true);

    try {
      const response = await apiRequest("POST", `/api/trips/${trip.id}/confirm-order`);
      const data = await response.json();

      if (response.ok) {
        toast({
          title: isRecurring && confirmAll
            ? `Standing Order Confirmed`
            : "Trip Order Confirmed",
          description: isRecurring && confirmAll
            ? `All ${data.trips?.length || recurringCount} instances of the standing order have been confirmed.`
            : "The trip order has been confirmed and is now scheduled.",
        });

        // Invalidate trips query to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
        onOpenChange(false);
      } else {
        throw new Error(data.message || "Failed to confirm order");
      }
    } catch (error: any) {
      toast({
        title: "Confirmation Failed",
        description: error.message || "Failed to confirm trip order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfirming(false);
      setShowConfirmAll(false);
    }
  };

  // If recurring and not yet showing confirm all prompt
  if (isRecurring && !showConfirmAll) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" style={{ color: '#F59E0B' }} />
              Confirm Standing Order
            </DialogTitle>
            <DialogDescription>
              This is a recurring trip (Standing Order) with {recurringCount} instances.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
              <p className="text-sm font-medium mb-2">Confirming will schedule all {recurringCount} instances:</p>
              <ul className="text-sm space-y-1 list-disc list-inside" style={{ color: 'var(--muted-foreground)' }}>
                <li>Client: {clientName}</li>
                <li>Start Date: {tripDate}</li>
                <li>Time: {tripTime}</li>
                <li>Trip Type: {trip.trip_type === 'round_trip' ? 'Round Trip' : 'One Way'}</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B' }}>
              <p className="text-sm" style={{ color: '#F59E0B' }}>
                <strong>Note:</strong> You cannot confirm individual instances. All instances must be confirmed together.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isConfirming}
              className="card-neu-flat hover:card-neu [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmAll(true)}
              disabled={isConfirming}
              className="card-neu hover:card-neu-pressed [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              Review Details
            </Button>
            <Button
              onClick={() => handleConfirm(true)}
              disabled={isConfirming}
              className="card-neu hover:card-neu-pressed [&]:shadow-none"
              style={{ backgroundColor: 'var(--background)', border: 'none' }}
            >
              {isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm All
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Single trip confirmation or confirm all prompt
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" style={{ color: '#10B981' }} />
            Confirm Trip Order
          </DialogTitle>
          <DialogDescription>
            {isRecurring
              ? `Confirm all ${recurringCount} instances of this standing order?`
              : "Confirm this trip order to schedule it."}
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
              <div>
                <strong>Trip Type:</strong> {trip.trip_type === 'round_trip' ? 'Round Trip' : 'One Way'}
              </div>
              {trip.reference_id && (
                <div>
                  <strong>Reference ID:</strong> {trip.reference_id}
                </div>
              )}
            </div>
          </div>

          {isRecurring && (
            <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid #F59E0B' }}>
              <p className="text-sm" style={{ color: '#F59E0B' }}>
                <strong>Standing Order:</strong> This will confirm all {recurringCount} instances from {tripDate} to the end date.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setShowConfirmAll(false);
            }}
            disabled={isConfirming}
            className="card-neu-flat hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleConfirm(isRecurring)}
            disabled={isConfirming}
            className="card-neu hover:card-neu-pressed [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirming...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isRecurring ? "Confirm All" : "Confirm"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

