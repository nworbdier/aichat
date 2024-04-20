import { Ionicons } from '@expo/vector-icons'; // Import Ionicons
import { RouteProp, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';

import { RootStackParamList } from '../navigation';

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;

type Key = {
  data: {
    credits: number;
    usage: number;
    limit: number | null;
    is_free_tier: boolean;
    rate_limit: {
      requests: number;
      interval: string;
    };
  };
};

export default function Details() {
  const [keyDetails, setKeyDetails] = useState<Key | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize instances with API key
  const openRouterKey = process.env.EXPO_PUBLIC_OPEN_ROUTER_API_KEY;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${openRouterKey}`,
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch key details');
        }
        const data: Key = await response.json();
        setKeyDetails(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching key details:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch key details');
      }
      const data: Key = await response.json();
      setKeyDetails(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching key details:', error);
      setLoading(false);
    }
  };

  return (
    <View style={styles.content}>
      <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
        <Ionicons name="refresh" size={24} color="black" />
      </TouchableOpacity>
      {loading ? (
        <ActivityIndicator size="large" color="black" />
      ) : keyDetails ? (
        <View>
          <Text style={styles.text}>Usage: ${keyDetails.data.usage.toFixed(3)}</Text>
          <Text style={styles.text}>Limit: {keyDetails.data.limit || 'Unlimited'}</Text>
          <Text style={styles.text}>
            Is Free Tier: {keyDetails.data.is_free_tier ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.text}>
            Rate Limit: {keyDetails.data.rate_limit.requests} every{' '}
            {keyDetails.data.rate_limit.interval}
          </Text>
        </View>
      ) : (
        <Text>No key details available</Text>
      )}
    </View>
  );
}

export const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5EA',
  },
  refreshButton: {
    position: 'absolute',
    top: 10,
    right: 25,
    zIndex: 1,
  },
  text: {
    fontSize: 20,
  },
});
