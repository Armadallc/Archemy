import express from "express";

// ============================================================================
// SHARED MIDDLEWARE
// ============================================================================

// Add middleware to ensure API routes are handled correctly
export const apiLogger = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(`🔍 API Route called: ${req.method} ${req.originalUrl}`);
  res.setHeader('Content-Type', 'application/json');
  next();
};

// Error handling middleware
export const errorHandler = (error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
};

// 404 handler for API routes
export const notFoundHandler = (req: express.Request, res: express.Response) => {
  res.status(404).json({ 
    error: 'API endpoint not found',
    path: req.originalUrl 
  });
};















