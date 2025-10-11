import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../services/logger';
import { networkInspector } from '../../services/networkInspector';
import { LogLevel } from '../../services/logger';

export default function DebugScreen() {
  const [logs, setLogs] = useState<any[]>([]);
  const [networkRequests, setNetworkRequests] = useState<any[]>([]);
  const [networkStats, setNetworkStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'network' | 'stats'>('logs');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setLogs(logger.getRecentLogs(50));
    setNetworkRequests(networkInspector.getRecentRequests(20));
    setNetworkStats(networkInspector.getNetworkStats());
  };

  const clearLogs = () => {
    Alert.alert(
      'Clear Logs',
      'Are you sure you want to clear all logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            logger.clearLogs();
            refreshData();
          },
        },
      ]
    );
  };

  const clearNetworkRequests = () => {
    Alert.alert(
      'Clear Network Requests',
      'Are you sure you want to clear all network requests?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            networkInspector.clearRequests();
            refreshData();
          },
        },
      ]
    );
  };

  const exportData = async () => {
    try {
      const exportData = {
        logs: logger.getRecentLogs(100),
        networkRequests: networkInspector.getAllRequests(),
        networkStats: networkInspector.getNetworkStats(),
        timestamp: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      
      await Share.share({
        message: jsonString,
        title: 'Debug Data Export',
      });
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export debug data');
    }
  };

  const getLogLevelColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.DEBUG: return '#6B7280';
      case LogLevel.INFO: return '#3B82F6';
      case LogLevel.WARN: return '#F59E0B';
      case LogLevel.ERROR: return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status?: number) => {
    if (!status) return '#6B7280';
    if (status >= 200 && status < 300) return '#10B981';
    if (status >= 400) return '#EF4444';
    return '#F59E0B';
  };

  const renderLogs = () => (
    <ScrollView style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Recent Logs ({logs.length})</Text>
        <TouchableOpacity onPress={clearLogs} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      {logs.map((log, index) => (
        <View key={index} style={styles.logEntry}>
          <View style={styles.logHeader}>
            <Text style={[styles.logLevel, { color: getLogLevelColor(log.level) }]}>
              {log.level}
            </Text>
            <Text style={styles.logTime}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </Text>
          </View>
          <Text style={styles.logMessage}>{log.message}</Text>
          {log.component && (
            <Text style={styles.logComponent}>[{log.component}]</Text>
          )}
          {log.metadata && (
            <Text style={styles.logMetadata}>
              {JSON.stringify(log.metadata, null, 2)}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderNetwork = () => (
    <ScrollView style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Network Requests ({networkRequests.length})</Text>
        <TouchableOpacity onPress={clearNetworkRequests} style={styles.clearButton}>
          <Ionicons name="trash-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      {networkRequests.map((request, index) => (
        <View key={index} style={styles.networkEntry}>
          <View style={styles.networkHeader}>
            <Text style={[styles.networkMethod, { color: getStatusColor(request.status) }]}>
              {request.method}
            </Text>
            <Text style={styles.networkStatus}>
              {request.status || 'Pending'}
            </Text>
            <Text style={styles.networkTime}>
              {request.responseTime ? `${request.responseTime}ms` : '...'}
            </Text>
          </View>
          <Text style={styles.networkUrl}>{request.url}</Text>
          {request.error && (
            <Text style={styles.networkError}>Error: {request.error}</Text>
          )}
        </View>
      ))}
    </ScrollView>
  );

  const renderStats = () => (
    <ScrollView style={styles.content}>
      <Text style={styles.headerText}>Network Statistics</Text>
      
      {networkStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Requests</Text>
            <Text style={styles.statValue}>{networkStats.totalRequests}</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Successful</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>
              {networkStats.successfulRequests}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Failed</Text>
            <Text style={[styles.statValue, { color: '#EF4444' }]}>
              {networkStats.failedRequests}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Success Rate</Text>
            <Text style={styles.statValue}>
              {networkStats.successRate.toFixed(1)}%
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Response Time</Text>
            <Text style={styles.statValue}>
              {networkStats.avgResponseTime}ms
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>
            Logs
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'network' && styles.activeTab]}
          onPress={() => setActiveTab('network')}
        >
          <Text style={[styles.tabText, activeTab === 'network' && styles.activeTabText]}>
            Network
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stats' && styles.activeTab]}
          onPress={() => setActiveTab('stats')}
        >
          <Text style={[styles.tabText, activeTab === 'stats' && styles.activeTabText]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toolbar}>
        <TouchableOpacity onPress={refreshData} style={styles.toolbarButton}>
          <Ionicons name="refresh" size={20} color="#3B82F6" />
          <Text style={styles.toolbarButtonText}>Refresh</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={exportData} style={styles.toolbarButton}>
          <Ionicons name="download" size={20} color="#3B82F6" />
          <Text style={styles.toolbarButtonText}>Export</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'logs' && renderLogs()}
      {activeTab === 'network' && renderNetwork()}
      {activeTab === 'stats' && renderStats()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  toolbarButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  clearButton: {
    padding: 8,
  },
  logEntry: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  logTime: {
    fontSize: 12,
    color: '#666',
  },
  logMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  logComponent: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  logMetadata: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
  },
  networkEntry: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  networkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  networkMethod: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  networkStatus: {
    fontSize: 12,
    color: '#666',
  },
  networkTime: {
    fontSize: 12,
    color: '#666',
  },
  networkUrl: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  networkError: {
    fontSize: 12,
    color: '#EF4444',
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#333',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});
