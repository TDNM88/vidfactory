export abstract class BaseWorkflow {
  abstract processRequest(req: Request): Promise<Response>;
  protected commonValidation() { /* ... */ }
} 