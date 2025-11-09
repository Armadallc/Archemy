import express from "express";
import { 
  requireSupabaseAuth, 
  requireSupabaseRole,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { corporateClientsStorage, programsStorage, tripsStorage, driversStorage, clientsStorage, clientGroupsStorage } from "../minimal-supabase";
import { vehiclesStorage } from "../vehicles-storage";

const router = express.Router();

// ============================================================================
// CORPORATE DASHBOARD ROUTES
// ============================================================================

// Get all corporate clients (for corporate dashboard)
router.get("/corporate-clients", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const corporateClients = await corporateClientsStorage.getAllCorporateClients();
    
    // For each corporate client, fetch their programs
    const corporateClientsWithPrograms = await Promise.all(
      corporateClients.map(async (client) => {
        try {
          const programs = await programsStorage.getProgramsByCorporateClient(client.corporate_client_id);
          return {
            ...client,
            programs: programs.map(program => ({
              program_id: program.program_id,
              program_name: program.program_name
            }))
          };
        } catch (error) {
          console.error(`Error fetching programs for client ${client.corporate_client_id}:`, error);
          return {
            ...client,
            programs: []
          };
        }
      })
    );
    
    res.json({ corporateClients: corporateClientsWithPrograms });
  } catch (error) {
    console.error("Error fetching corporate clients:", error);
    res.status(500).json({ message: "Failed to fetch corporate clients" });
  }
});

// Get specific corporate client by ID
router.get("/corporate-clients/:id", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const corporateClient = await corporateClientsStorage.getCorporateClient(id);
    
    if (!corporateClient) {
      return res.status(404).json({ message: "Corporate client not found" });
    }
    
    res.json(corporateClient);
  } catch (error) {
    console.error("Error fetching corporate client:", error);
    res.status(500).json({ message: "Failed to fetch corporate client" });
  }
});

// Get all programs (for corporate dashboard)
router.get("/programs", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const programs = await programsStorage.getAllPrograms();
    res.json(programs);
  } catch (error) {
    console.error("Error fetching programs:", error);
    res.status(500).json({ message: "Failed to fetch programs" });
  }
});

// Get universal trips (all trips across all programs)
router.get("/trips/universal", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    console.log('🔍 Fetching universal trips...');
    const trips = await tripsStorage.getAllTrips();
    console.log('✅ Universal trips fetched:', trips?.length || 0, 'trips');
    res.json(trips || []);
  } catch (error) {
    console.error("❌ Error fetching universal trips:", error);
    res.status(500).json({ message: "Failed to fetch universal trips" });
  }
});

// Get all vehicles (for corporate dashboard)
router.get("/vehicles", requireSupabaseAuth, requireSupabaseRole(['super_admin', 'corporate_admin']), async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const vehicles = await vehiclesStorage.getAllVehicles();
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

// ============================================================================
// PROGRAM-SPECIFIC API ENDPOINTS FOR DASHBOARD
// ============================================================================

// Get trips for a specific program
router.get("/trips/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const trips = await tripsStorage.getTripsByProgram(programId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching program trips:", error);
    res.status(500).json({ message: "Failed to fetch program trips" });
  }
});

// Get trips for a specific corporate client (all programs under that client)
router.get("/trips/corporate-client/:corporateClientId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { corporateClientId } = req.params;
    const trips = await tripsStorage.getTripsByCorporateClient(corporateClientId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching corporate client trips:", error);
    res.status(500).json({ message: "Failed to fetch corporate client trips" });
  }
});

// Get drivers for a specific program
router.get("/drivers/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const drivers = await driversStorage.getDriversByProgram(programId);
    res.json(drivers);
  } catch (error) {
    console.error("Error fetching program drivers:", error);
    res.status(500).json({ message: "Failed to fetch program drivers" });
  }
});

// Get clients for a specific program
router.get("/clients/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clients = await clientsStorage.getClientsByProgram(programId);
    res.json(clients);
  } catch (error) {
    console.error("Error fetching program clients:", error);
    res.status(500).json({ message: "Failed to fetch program clients" });
  }
});

// Get client groups for a specific program
router.get("/client-groups/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const clientGroups = await clientGroupsStorage.getClientGroupsByProgram(programId);
    res.json(clientGroups);
  } catch (error) {
    console.error("Error fetching program client groups:", error);
    res.status(500).json({ message: "Failed to fetch program client groups" });
  }
});

// Get vehicles for a specific program
router.get("/vehicles/program/:programId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { programId } = req.params;
    const vehicles = await vehiclesStorage.getVehiclesByProgram(programId);
    res.json(vehicles);
  } catch (error) {
    console.error("Error fetching program vehicles:", error);
    res.status(500).json({ message: "Failed to fetch program vehicles" });
  }
});

// Get trips for a specific driver
router.get("/trips/driver/:driverId", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const { driverId } = req.params;
    const trips = await tripsStorage.getTripsByDriver(driverId);
    res.json(trips);
  } catch (error) {
    console.error("Error fetching driver trips:", error);
    res.status(500).json({ message: "Failed to fetch driver trips" });
  }
});

export default router;
