import { format } from 'date-fns';

export interface ExportOptions {
  filename?: string;
  includeHeaders?: boolean;
  dateFormat?: string;
  delimiter?: string;
}

export interface ExportColumn {
  key: string;
  label: string;
  formatter?: (value: any) => string;
}

export class ExportService {
  /**
   * Export data to CSV format
   */
  static exportToCSV<T>(
    data: T[],
    columns: ExportColumn[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.csv`,
      includeHeaders = true,
      delimiter = ','
    } = options;

    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    // Create CSV content
    let csvContent = '';

    // Add headers
    if (includeHeaders) {
      const headers = columns.map(col => this.escapeCSVValue(col.label)).join(delimiter);
      csvContent += headers + '\n';
    }

    // Add data rows
    data.forEach((item) => {
      const row = columns.map(col => {
        const value = (item as any)[col.key];
        const formattedValue = col.formatter ? col.formatter(value) : String(value || '');
        return this.escapeCSVValue(formattedValue);
      }).join(delimiter);
      csvContent += row + '\n';
    });

    // Download file
    this.downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Export data to JSON format
   */
  static exportToJSON<T>(
    data: T[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.json`
    } = options;

    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Export data to Excel format (CSV with .xlsx extension)
   */
  static exportToExcel<T>(
    data: T[],
    columns: ExportColumn[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = `export-${format(new Date(), 'yyyy-MM-dd-HH-mm-ss')}.xlsx`
    } = options;

    // For now, we'll export as CSV with .xlsx extension
    // In a real implementation, you'd use a library like xlsx
    this.exportToCSV(data, columns, { ...options, filename });
  }

  /**
   * Generate a trip report
   */
  static exportTripReport(
    trips: any[],
    options: ExportOptions = {}
  ): void {
    const columns: ExportColumn[] = [
      { key: 'id', label: 'Trip ID' },
      { key: 'client_name', label: 'Client Name' },
      { key: 'pickup_address', label: 'Pickup Address' },
      { key: 'dropoff_address', label: 'Dropoff Address' },
      { key: 'scheduled_pickup_time', label: 'Scheduled Pickup', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '' },
      { key: 'actual_pickup_time', label: 'Actual Pickup', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : '' },
      { key: 'status', label: 'Status' },
      { key: 'driver_name', label: 'Driver' },
      { key: 'distance_miles', label: 'Distance (miles)' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' }
    ];

    this.exportToCSV(trips, columns, {
      filename: `trip-report-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ...options
    });
  }

  /**
   * Generate a driver report
   */
  static exportDriverReport(
    drivers: any[],
    options: ExportOptions = {}
  ): void {
    const columns: ExportColumn[] = [
      { key: 'id', label: 'Driver ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status' },
      { key: 'license_number', label: 'License Number' },
      { key: 'license_expiry', label: 'License Expiry', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' }
    ];

    this.exportToCSV(drivers, columns, {
      filename: `driver-report-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ...options
    });
  }

  /**
   * Generate a client report
   */
  static exportClientReport(
    clients: any[],
    options: ExportOptions = {}
  ): void {
    const columns: ExportColumn[] = [
      { key: 'id', label: 'Client ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'status', label: 'Status' },
      { key: 'emergency_contact_name', label: 'Emergency Contact' },
      { key: 'emergency_contact_phone', label: 'Emergency Phone' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' }
    ];

    this.exportToCSV(clients, columns, {
      filename: `client-report-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ...options
    });
  }

  /**
   * Generate a financial report
   */
  static exportFinancialReport(
    trips: any[],
    options: ExportOptions = {}
  ): void {
    const columns: ExportColumn[] = [
      { key: 'id', label: 'Trip ID' },
      { key: 'client_name', label: 'Client' },
      { key: 'scheduled_pickup_time', label: 'Date', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' },
      { key: 'distance_miles', label: 'Distance (miles)' },
      { key: 'fuel_cost', label: 'Fuel Cost', formatter: (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? format(new Date(value), 'MMM dd, yyyy') : '' }
    ];

    this.exportToCSV(trips, columns, {
      filename: `financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`,
      ...options
    });
  }

  /**
   * Escape CSV values to handle commas, quotes, and newlines
   */
  private static escapeCSVValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Download a file to the user's device
   */
  private static downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get export statistics
   */
  static getExportStats(data: any[]): {
    totalRecords: number;
    exportSize: string;
    estimatedTime: string;
  } {
    const totalRecords = data.length;
    const avgRecordSize = 100; // Estimated bytes per record
    const totalSize = totalRecords * avgRecordSize;
    const exportSize = this.formatBytes(totalSize);
    const estimatedTime = totalRecords < 1000 ? '< 1 second' : 
                         totalRecords < 10000 ? '1-3 seconds' : 
                         '3-10 seconds';

    return {
      totalRecords,
      exportSize,
      estimatedTime
    };
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}







