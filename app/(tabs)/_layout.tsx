import { Tabs } from 'expo-router';
import React from 'react';
import { Leaf, History, UserCircle } from 'lucide-react-native';

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
      {/* We will create the history.tsx and profile.tsx files next */}
      {/* <Tabs.Screen
        name="history" 
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <History color={color} size={focused ? 28 : 24} />
          ),
        }}
      />
       <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <UserCircle color={color} size={focused ? 28 : 24} />
          ),
        }}
      /> 
      */}
    </Tabs>
  );
}

