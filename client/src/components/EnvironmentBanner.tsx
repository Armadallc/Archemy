import { ENVIRONMENT } from "@/lib/environment";

export function EnvironmentBanner() {
  if (ENVIRONMENT.isProduction) {
    return null; // No banner in production
  }

  return (
    <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-center">
      <span className="text-sm font-medium text-amber-800">
        Development Environment - Demo Data Active
      </span>
    </div>
  );
}