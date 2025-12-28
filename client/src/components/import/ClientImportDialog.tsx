import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { useToast } from "../../hooks/use-toast";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

interface ClientImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programs: Array<{ id: string; name: string }>;
  onImportComplete: () => void;
}

export function ClientImportDialog({ open, onOpenChange, programs, onImportComplete }: ClientImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV or Excel file (.csv, .xlsx, .xls)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      setFile(selectedFile);
      setImportResult(null);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No File Selected",
        description: "Please select a file to import",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProgram) {
      toast({
        title: "Program Required",
        description: "Please select a program for the imported clients",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('program_id', selectedProgram);

      // Get auth token for the upload request
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || localStorage.getItem('auth_token') || localStorage.getItem('authToken');

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8081';
      const response = await fetch(`${apiBaseUrl}/api/clients/import`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Import failed');
      }

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.success > 0) {
        toast({
          title: "Import Successful",
          description: `Successfully imported ${result.success} client(s). ${result.failed > 0 ? `${result.failed} failed.` : ''}`,
          variant: "default",
        });
        onImportComplete();
      }

      if (result.failed > 0 && result.errors.length > 0) {
        // Show errors in a more detailed way
        const errorMessages = result.errors.slice(0, 5).map(e => `Row ${e.row}: ${e.error}`).join('\n');
        toast({
          title: "Import Completed with Errors",
          description: `${result.success} imported, ${result.failed} failed. ${result.errors.length > 5 ? 'Showing first 5 errors...' : ''}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import clients. Please check the file format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setSelectedProgram("");
      setImportResult(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-2xl card-neu" 
        style={{ backgroundColor: 'var(--background)', border: 'none' }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold" style={{ color: 'var(--foreground)' }}>
            Import Clients
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Program Selection */}
          <div className="space-y-2">
            <Label htmlFor="program" className="font-medium" style={{ fontSize: '16px' }}>
              Program *
            </Label>
            <Select value={selectedProgram} onValueChange={setSelectedProgram}>
              <SelectTrigger 
                className="card-neu-flat [&]:shadow-none" 
                style={{ backgroundColor: 'var(--background)', border: 'none' }}
              >
                <SelectValue placeholder="Select a program" />
              </SelectTrigger>
              <SelectContent className="card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                {programs.map((program) => (
                  <SelectItem 
                    key={program.id} 
                    value={program.id}
                    className="hover:card-neu-flat"
                  >
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              All imported clients will be assigned to this program
            </p>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="font-medium" style={{ fontSize: '16px' }}>
              CSV/Excel File *
            </Label>
            {!file ? (
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer card-neu-flat hover:card-neu transition-all"
                style={{ 
                  backgroundColor: 'var(--background)', 
                  borderColor: 'var(--border)',
                  border: '2px dashed var(--border)'
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                  Click to upload or drag and drop
                </p>
                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  CSV or Excel files only (max 10MB)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg card-neu" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" style={{ color: 'var(--muted-foreground)' }} />
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                      {file.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  className="h-8 w-8 p-0 card-neu-flat hover:card-neu [&]:shadow-none"
                  style={{ backgroundColor: 'var(--background)', border: 'none' }}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Expected Format Info */}
          <div className="p-4 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
              Expected CSV Format:
            </p>
            <p className="text-xs font-mono mb-2" style={{ color: 'var(--muted-foreground)' }}>
              first_name,last_name,email,phone,street_address,city,state,zip_code
            </p>
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              Required fields: <strong>first_name</strong>, <strong>last_name</strong>
              <br />
              Optional fields: email, phone, street_address, city, state, zip_code, date_of_birth, emergency_contact_name, emergency_contact_phone
            </p>
          </div>

          {/* Import Results */}
          {importResult && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--completed)' }} />
                ) : (
                  <AlertCircle className="h-5 w-5" style={{ color: 'var(--cancelled)' }} />
                )}
                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  Import Results: {importResult.success} successful, {importResult.failed} failed
                </p>
              </div>
              {importResult.errors.length > 0 && (
                <div className="max-h-40 overflow-y-auto p-3 rounded-lg card-neu-flat" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--foreground)' }}>Errors:</p>
                  {importResult.errors.slice(0, 10).map((error, index) => (
                    <p key={index} className="text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>
                      Row {error.row}: {error.error}
                    </p>
                  ))}
                  {importResult.errors.length > 10 && (
                    <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                      ... and {importResult.errors.length - 10} more errors
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="card-neu-flat hover:card-neu [&]:shadow-none"
            style={{ backgroundColor: 'var(--background)', border: 'none' }}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            className="card-neu hover:card-neu [&]:shadow-none"
            style={{ 
              backgroundColor: 'var(--background)', 
              border: 'none',
              boxShadow: '0 0 12px rgba(122, 255, 254, 0.2)',
              fontWeight: 400,
              color: '#7afffe',
              textShadow: '0 0 8px rgba(122, 255, 254, 0.4), 0 0 12px rgba(122, 255, 254, 0.2)'
            }}
            disabled={!file || !selectedProgram || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" style={{ color: '#7afffe' }} />
                <span>Importing...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" style={{ color: '#7afffe' }} />
                <span>Import Clients</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

