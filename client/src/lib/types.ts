export interface DashboardStats {
  todaysTrips: number;
  completedTrips: number;
  activeDrivers: number;
  totalClients: number;
}

export interface BookingForm {
  clientId: string;
  tripType: 'one_way' | 'round_trip';
  pickupAddress: string;
  dropoffAddress: string;
  scheduledPickupTime: string;
  passengerCount: number;
  driverId: string;
  specialRequirements?: string;
}

export interface AvailableDriver {
  userId: string;
  userName: string;
  licenseNumber: string;
  vehicleInfo: string;
  isAvailable: boolean;
}

export interface ClientWithServiceArea {
  id: string;
  first_name: string;
  last_name: string;
  service_area_id: string;
  program_id: string;
  location_id?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  medical_notes?: string | null;
  mobility_requirements?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
  serviceAreaNickname?: string;
}

export interface TripWithDetails {
  id: string;
  clientFirstName: string;
  clientLastName: string;
  driverName?: string;
  pickupAddress: string;
  dropoffAddress: string;
  scheduledPickupTime: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  passengerCount: number;
}
