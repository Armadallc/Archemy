import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { ExportService, ExportOptions } from '../../services/exportService';

interface ExportButtonProps<T> {
  data: T[];
  columns: Array<{ key: string; label: string; formatter?: (value: any) => string }>;
  filename?: string;
  disabled?: boolean;
  className?: string;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
}

export default function ExportButton<T>({
  data,
  columns,
  filename,
  disabled = false,
  className,
  onExportStart,
  onExportComplete,
  onExportError
}: ExportButtonProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel' | 'json', customOptions?: ExportOptions) => {
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      const options: ExportOptions = {
        filename: filename || `export-${new Date().toISOString().split('T')[0]}`,
        ...customOptions
      };

      switch (format) {
        case 'csv':
          ExportService.exportToCSV(data, columns, options);
          break;
        case 'excel':
          ExportService.exportToExcel(data, columns, options);
          break;
        case 'json':
          ExportService.exportToJSON(data, options);
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      onExportComplete?.();
    } catch (error) {
      console.error('Export failed:', error);
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  const getIcon = (format: string) => {
    switch (format) {
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileJson className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const stats = ExportService.getExportStats(data);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isExporting || data.length === 0}
          className={className}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm text-muted-foreground">
          <div>Export {stats.totalRecords} records</div>
          <div className="text-xs">~{stats.exportSize} • {stats.estimatedTime}</div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('csv')}>
          {getIcon('csv')}
          <span className="ml-2">CSV Format</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('excel')}>
          {getIcon('excel')}
          <span className="ml-2">Excel Format</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')}>
          {getIcon('json')}
          <span className="ml-2">JSON Format</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}







