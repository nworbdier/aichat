import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { View, SafeAreaView, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';

import { BackButton } from '../components/BackButton';
import Details from '../screens/details';
import ChatScreen from '../screens/overview';

export type RootStackParamList = {
  Overview: undefined;
  Details: { name: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootStack() {
  return (
    <View style={styles.app}>
      <StatusBar style="auto" />
      {Platform.OS !== 'ios' && <View style={styles.customTopView} />}
      <SafeAreaView style={styles.appTop} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Overview">
            <Stack.Screen
              name="Overview"
              component={ChatScreen}
              options={{ headerShown: false }} // Set headerShown to false
            />
            <Stack.Screen
              name="Details"
              component={Details}
              options={{ headerShown: false }} // Set headerShown to false
            />
          </Stack.Navigator>
        </NavigationContainer>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: 'white',
  },
  appTop: {
    backgroundColor: '#E5E5EA',
  },
  customTopView: {
    width: '100%',
    height: '5%',
    backgroundColor: '#E5E5EA',
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: 'black',
  },
});
