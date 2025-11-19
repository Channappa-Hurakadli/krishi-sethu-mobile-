import { Tabs } from 'expo-router';
import React from 'react';
// Import all the icons we need
import { Leaf, History, UserCircle, PlusSquare, CheckSquare } from 'lucide-react-native';

// This component defines the bottom tab navigator for the main part of your app.
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Hides the header title for tab screens
        tabBarActiveTintColor: '#16a34a', // A green color from your theme
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
        }
      }}>
      <Tabs.Screen
        name="index" // This links to app/(tabs)/index.tsx
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Leaf color={color} size={focused ? 28 : 24} />
          ),
        }}
      />
      <Tabs.Screen
        name="history" // This links to app/(tabs)/history.tsx
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <History color={color} size={focused ? 28 : 24} />
          ),
        }}
      />
      
      {/* --- FIX: Added "New Prediction" Tab --- */}
      <Tabs.Screen
        name="predict" // This links to app/(tabs)/predict.tsx
        options={{
          title: 'New Prediction',
          tabBarIcon: ({ color, focused }) => (
            <PlusSquare color={color} size={focused ? 28 : 24} />
          ),
        }}
      />

      {/* --- FIX: Added "Results" Tab --- */}
      <Tabs.Screen
        name="result" // This links to app/(tabs)/result.tsx
        options={{
          title: 'Results',
          tabBarIcon: ({ color, focused }) => (
            <CheckSquare color={color} size={focused ? 28 : 24} />
          ),
          // --- Hides this tab from the bar ---
          // A "Results" page doesn't make sense to show all the time
          // It only appears AFTER a prediction.
          // This href: null hides it from the tab bar.
          href: null, 
        }}
      />
      <Tabs.Screen
        name="predictionModal" // This links to app/(tabs)/result.tsx
        options={{
          title: 'Results',
          tabBarIcon: ({ color, focused }) => (
            <CheckSquare color={color} size={focused ? 28 : 24} />
          ),
          // --- Hides this tab from the bar ---
          // A "Results" page doesn't make sense to show all the time
          // It only appears AFTER a prediction.
          // This href: null hides it from the tab bar.
          href: null, 
        }}
      />
       
       <Tabs.Screen
        name="profile" // This links to app/(tabs)/profile.tsx
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserCircle color={color} size={focused ? 28 : 24} />
          ),
        }}
      /> 
    </Tabs>
  );
}