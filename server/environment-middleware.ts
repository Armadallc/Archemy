import { Request, Response, NextFunction } from 'express';
import { isValidOrganization, ENVIRONMENT } from './environment-config';

// Middleware to validate organization access based on environment
export function validateOrganizationAccess(req: Request, res: Response, next: NextFunction) {
  const organizationId = req.params.organizationId || req.params.organization_id;
  
  if (!organizationId) {
    return next(); // Let other validation handle missing org ID
  }
  
  if (!isValidOrganization(organizationId)) {
    console.log(`🚫 Access denied to organization: ${organizationId} in ${ENVIRONMENT.nodeEnv} environment`);
    return res.status(403).json({ 
      message: `Organization access not allowed in ${ENVIRONMENT.nodeEnv} environment`,
      allowedOrganizations: ENVIRONMENT.isProduction ? 
        ['monarch_competency', 'monarch_mental_health', 'monarch_sober_living', 'monarch_launch'] :
        ['littlemonarch_org', 'demo_org_1', 'demo_org_2']
    });
  }
  
  next();
}

// Middleware to set default organization based on environment
export function setDefaultOrganization(req: Request, res: Response, next: NextFunction) {
  // If no organization specified in route, set environment-appropriate default
  if (!req.params.organizationId && !req.params.organization_id) {
    req.params.organizationId = ENVIRONMENT.isProduction ? 'monarch_competency' : 'littlemonarch_org';
  }
  next();
}