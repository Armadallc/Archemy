// Test script for export functionality
const fs = require('fs');
const path = require('path');

// Mock the ExportService functionality for testing
class TestExportService {
  static exportToCSV(data, columns, options = {}) {
    const { filename = 'export.csv', includeHeaders = true, delimiter = ',' } = options;
    
    if (data.length === 0) {
      console.warn('No data to export');
      return;
    }

    let csvContent = '';

    if (includeHeaders) {
      const headers = columns.map(col => this.escapeCSVValue(col.label)).join(delimiter);
      csvContent += headers + '\n';
    }

    data.forEach((item) => {
      const row = columns.map(col => {
        const value = item[col.key];
        const formattedValue = col.formatter ? col.formatter(item) : String(value || '');
        return this.escapeCSVValue(formattedValue);
      }).join(delimiter);
      csvContent += row + '\n';
    });

    // Write to file
    fs.writeFileSync(filename, csvContent);
    console.log(`✅ CSV file created: ${filename}`);
  }

  static exportToJSON(data, options = {}) {
    const { filename = 'export.json' } = options;
    const jsonContent = JSON.stringify(data, null, 2);
    fs.writeFileSync(filename, jsonContent);
    console.log(`✅ JSON file created: ${filename}`);
  }

  static exportTripReport(trips, options = {}) {
    const columns = [
      { key: 'id', label: 'Trip ID' },
      { key: 'client_name', label: 'Client Name', formatter: (trip) => `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim() },
      { key: 'pickup_address', label: 'Pickup Address' },
      { key: 'dropoff_address', label: 'Dropoff Address' },
      { key: 'scheduled_pickup_time', label: 'Scheduled Pickup', formatter: (value) => value ? new Date(value).toLocaleString() : '' },
      { key: 'actual_pickup_time', label: 'Actual Pickup', formatter: (value) => value ? new Date(value).toLocaleString() : '' },
      { key: 'status', label: 'Status' },
      { key: 'driver_name', label: 'Driver', formatter: (trip) => trip.driver?.license_number || 'Unassigned' },
      { key: 'program_name', label: 'Program', formatter: (trip) => trip.program?.name || 'Unknown' },
      { key: 'corporate_client_name', label: 'Corporate Client', formatter: (trip) => trip.corporate_client?.name || 'N/A' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? new Date(value).toLocaleDateString() : '' }
    ];

    this.exportToCSV(trips, columns, {
      filename: options.filename || `trip-report-${new Date().toISOString().split('T')[0]}.csv`
    });
  }

  static exportDriverReport(drivers, options = {}) {
    const columns = [
      { key: 'id', label: 'Driver ID' },
      { key: 'name', label: 'Name', formatter: (driver) => `${driver.first_name} ${driver.last_name}` },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'license_number', label: 'License Number' },
      { key: 'license_expiry', label: 'License Expiry', formatter: (value) => value ? new Date(value).toLocaleDateString() : 'N/A' },
      { key: 'vehicle_info', label: 'Vehicle Info' },
      { key: 'is_active', label: 'Status', formatter: (value) => value ? 'Active' : 'Inactive' },
      { key: 'is_available', label: 'Available', formatter: (value) => value ? 'Yes' : 'No' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? new Date(value).toLocaleDateString() : '' }
    ];

    this.exportToCSV(drivers, columns, {
      filename: options.filename || `driver-report-${new Date().toISOString().split('T')[0]}.csv`
    });
  }

  static exportClientReport(clients, options = {}) {
    const columns = [
      { key: 'id', label: 'Client ID' },
      { key: 'name', label: 'Name', formatter: (client) => `${client.first_name} ${client.last_name}` },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'address', label: 'Address' },
      { key: 'is_active', label: 'Status', formatter: (value) => value ? 'Active' : 'Inactive' },
      { key: 'emergency_contact_name', label: 'Emergency Contact' },
      { key: 'emergency_contact_phone', label: 'Emergency Phone' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? new Date(value).toLocaleDateString() : '' }
    ];

    this.exportToCSV(clients, columns, {
      filename: options.filename || `client-report-${new Date().toISOString().split('T')[0]}.csv`
    });
  }

  static exportFinancialReport(trips, options = {}) {
    const columns = [
      { key: 'id', label: 'Trip ID' },
      { key: 'client_name', label: 'Client', formatter: (trip) => `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim() },
      { key: 'scheduled_pickup_time', label: 'Date', formatter: (value) => value ? new Date(value).toLocaleDateString() : '' },
      { key: 'distance_miles', label: 'Distance (miles)' },
      { key: 'fuel_cost', label: 'Fuel Cost', formatter: (value) => value ? `$${Number(value).toFixed(2)}` : '$0.00' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created', formatter: (value) => value ? new Date(value).toLocaleDateString() : '' }
    ];

    this.exportToCSV(trips, columns, {
      filename: options.filename || `financial-report-${new Date().toISOString().split('T')[0]}.csv`
    });
  }

  static getExportStats(data) {
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

  static formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static escapeCSVValue(value) {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// Sample data for testing
const sampleTrips = [
  {
    id: '1',
    client: { first_name: 'John', last_name: 'Doe' },
    pickup_address: '123 Main St',
    dropoff_address: '456 Oak Ave',
    scheduled_pickup_time: '2025-01-15T10:00:00Z',
    actual_pickup_time: '2025-01-15T10:05:00Z',
    status: 'completed',
    driver: { license_number: 'DL123456' },
    program: { name: 'Test Program' },
    corporate_client: { name: 'Test Corp' },
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    client: { first_name: 'Jane', last_name: 'Smith' },
    pickup_address: '789 Pine St',
    dropoff_address: '321 Elm St',
    scheduled_pickup_time: '2025-01-16T14:00:00Z',
    actual_pickup_time: null,
    status: 'scheduled',
    driver: { license_number: 'DL789012' },
    program: { name: 'Test Program' },
    corporate_client: { name: 'Test Corp' },
    created_at: '2025-01-02T00:00:00Z'
  }
];

const sampleDrivers = [
  {
    id: '1',
    first_name: 'Alice',
    last_name: 'Johnson',
    email: 'alice@example.com',
    phone: '555-0123',
    license_number: 'DL123456',
    license_expiry: '2026-12-31',
    vehicle_info: 'Toyota Camry 2020',
    is_active: true,
    is_available: true,
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    first_name: 'Bob',
    last_name: 'Wilson',
    email: 'bob@example.com',
    phone: '555-0456',
    license_number: 'DL789012',
    license_expiry: '2025-06-30',
    vehicle_info: 'Honda Accord 2019',
    is_active: true,
    is_available: false,
    created_at: '2025-01-02T00:00:00Z'
  }
];

const sampleClients = [
  {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-0789',
    address: '123 Main St, City, State',
    is_active: true,
    emergency_contact_name: 'Jane Doe',
    emergency_contact_phone: '555-0987',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: '2',
    first_name: 'Jane',
    last_name: 'Smith',
    email: 'jane@example.com',
    phone: '555-0321',
    address: '456 Oak Ave, City, State',
    is_active: true,
    emergency_contact_name: 'John Smith',
    emergency_contact_phone: '555-0654',
    created_at: '2025-01-02T00:00:00Z'
  }
];

console.log('🧪 Testing Export Service...\n');

// Test 1: Export Statistics
console.log('📊 Testing Export Statistics:');
const tripStats = TestExportService.getExportStats(sampleTrips);
console.log('Trip Stats:', tripStats);

const driverStats = TestExportService.getExportStats(sampleDrivers);
console.log('Driver Stats:', driverStats);

const clientStats = TestExportService.getExportStats(sampleClients);
console.log('Client Stats:', clientStats);

// Test 2: CSV Export
console.log('\n📄 Testing CSV Export:');
try {
  TestExportService.exportToCSV(sampleTrips, [
    { key: 'id', label: 'Trip ID' },
    { key: 'client_name', label: 'Client Name', formatter: (trip) => `${trip.client?.first_name || ''} ${trip.client?.last_name || ''}`.trim() },
    { key: 'pickup_address', label: 'Pickup Address' },
    { key: 'dropoff_address', label: 'Dropoff Address' },
    { key: 'status', label: 'Status' }
  ], { filename: 'test-trips.csv' });
} catch (error) {
  console.error('❌ Trip CSV export failed:', error.message);
}

// Test 3: JSON Export
console.log('\n📄 Testing JSON Export:');
try {
  TestExportService.exportToJSON(sampleDrivers, { filename: 'test-drivers.json' });
} catch (error) {
  console.error('❌ Driver JSON export failed:', error.message);
}

// Test 4: Specialized Reports
console.log('\n📊 Testing Specialized Reports:');
try {
  TestExportService.exportTripReport(sampleTrips, { filename: 'test-trip-report.csv' });
} catch (error) {
  console.error('❌ Trip report export failed:', error.message);
}

try {
  TestExportService.exportDriverReport(sampleDrivers, { filename: 'test-driver-report.csv' });
} catch (error) {
  console.error('❌ Driver report export failed:', error.message);
}

try {
  TestExportService.exportClientReport(sampleClients, { filename: 'test-client-report.csv' });
} catch (error) {
  console.error('❌ Client report export failed:', error.message);
}

try {
  TestExportService.exportFinancialReport(sampleTrips, { filename: 'test-financial-report.csv' });
} catch (error) {
  console.error('❌ Financial report export failed:', error.message);
}

console.log('\n🎉 Export service testing completed!');
console.log('\n📁 Generated files:');
try {
  const files = fs.readdirSync('.').filter(f => f.startsWith('test-') && (f.endsWith('.csv') || f.endsWith('.json')));
  files.forEach(file => {
    const stats = fs.statSync(file);
    console.log(`  - ${file} (${TestExportService.formatBytes(stats.size)})`);
  });
} catch (error) {
  console.log('  No test files found');
}