import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ProgressScreen from '../screens/ProgressScreen';
import SettingsScreen from '../screens/SettingsScreen';
import CharacterTestScreen from '../screens/CharacterTestScreen';
import SuccessScreen from '../screens/SuccessScreen';
import FailScreen from '../screens/FailScreen';
import BreakScreen from '../screens/BreakScreen';
import UpgradeScreen from '../screens/UpgradeScreen';
import CategorySelectionScreen from '../screens/CategorySelectionScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F5F1ED' },
      }}
    >
      {/* Main Timer Screen */}
      <Stack.Screen
        name="Home"
        component={HomeScreen}
      />

      {/* Full Screen Modals */}
      <Stack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="CharacterTest"
        component={CharacterTestScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="Upgrade"
        component={UpgradeScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="CategorySelection"
        component={CategorySelectionScreen}
        options={{
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{
          presentation: 'modal',
        }}
      />

      {/* Overlay Modals */}
      <Stack.Screen
        name="Success"
        component={SuccessScreen}
        options={{
          presentation: 'transparentModal',
        }}
      />

      <Stack.Screen
        name="Fail"
        component={FailScreen}
        options={{
          presentation: 'transparentModal',
        }}
      />

      <Stack.Screen
        name="Break"
        component={BreakScreen}
        options={{
          presentation: 'transparentModal',
        }}
      />
    </Stack.Navigator>
  );
}
