import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building } from "lucide-react";
import { useOrganization } from "@/hooks/useOrganization";
import { apiRequest } from "@/lib/queryClient";

export default function OrganizationSelector() {
  const { currentOrganization, setCurrentOrganization } = useOrganization();

  const { data: organizationsData } = useQuery({
    queryKey: ["/api/organizations"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/organizations");
      return await response.json();
    },
  });

  const organizations = Array.isArray(organizationsData) ? organizationsData : [];
  const currentOrgName = organizations.find(org => org.id === currentOrganization)?.name || "Select Organization";

  return (
    <div className="flex items-center gap-2">
      <Building className="w-4 h-4 text-gray-500" />
      <Select value={currentOrganization} onValueChange={setCurrentOrganization}>
        <SelectTrigger className="w-64 bg-white border-gray-200">
          <SelectValue placeholder="Select Organization">
            {currentOrgName}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org: any) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}