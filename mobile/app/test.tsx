import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { apiClient } from '../services/api';

export default function TestScreen() {
  const testAPI = async () => {
    try {
      const response = await apiClient.healthCheck();
      alert(`API Response: ${JSON.stringify(response)}`);
    } catch (error) {
      alert(`API Error: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile App Test</Text>
      <Text style={styles.subtitle}>Testing connection to backend</Text>
      
      <TouchableOpacity style={styles.button} onPress={testAPI}>
        <Text style={styles.buttonText}>Test API Connection</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});






