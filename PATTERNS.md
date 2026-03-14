# Code Patterns & Conventions

This document outlines the established patterns and conventions used throughout the Pomodoro app codebase. Following these patterns ensures consistency and makes future development easier.

## Table of Contents
- [Plus Feature Pattern](#plus-feature-pattern)
- [Modal System](#modal-system)
- [Component Structure](#component-structure)
- [State Management](#state-management)
- [Development & Testing](#development--testing)
- [Session Tracking](#session-tracking)
- [Styling Conventions](#styling-conventions)

---

## Plus Feature Pattern

### Overview
All Plus (premium) features follow a consistent pattern for gating access and displaying upgrade prompts.

### Core Components

#### 1. PadlockIcon Component
**Location:** `components/PadlockIcon.js`

Reusable padlock icon for Plus features. Single source of truth for all padlock visuals.

```javascript
import PadlockIcon from './PadlockIcon';

// Usage
<PadlockIcon
  size={28}           // Container size (default: 28)
  iconSize={14}       // SVG icon size (default: 14)
  backgroundColor="#9C27B0"  // Background color (default: purple)
  iconColor="#FFFFFF"        // Icon color (default: white)
  style={styles.padlock}     // Additional styles
/>
```

#### 2. PlusMenuItem Component
**Location:** `components/PlusMenuItem.js`

Menu item wrapper with automatic Plus feature gating. Use for hamburger menu items or any menu that needs Plus access control.

```javascript
import PlusMenuItem from './PlusMenuItem';

// Usage
<PlusMenuItem
  label="Progress"
  isPlusFeature={true}
  testPlusMode={testPlusMode}  // Optional: for testing
  onPress={() => {
    // This only executes if user has Plus access
    // Otherwise, upgrade modal is shown automatically
  }}
  style={styles.customStyle}  // Optional
/>
```

**Features:**
- Automatically shows padlock icon on the LEFT side when user doesn't have Plus
- Automatically triggers upgrade modal when clicked by free users
- Supports test mode override for development

#### 3. Test Mode Support
All Plus features support `testPlusMode` prop for development testing.

```javascript
export default function MyComponent({ testPlusMode = false }) {
  const { isPlusMember: actualIsPlusMember, setShowUpgradeModal } = useMembership();

  // Standard pattern: allow test mode override in dev
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;

  // Use isPlusMember for conditional rendering
  if (!isPlusMember) {
    return <UpgradePrompt />;
  }

  return <PlusFeatureContent />;
}
```

### Implementing a New Plus Feature

**Step-by-step:**

1. **Import dependencies:**
```javascript
import { useMembership } from '../contexts/MembershipContext';
import PadlockIcon from './PadlockIcon';
```

2. **Add testPlusMode prop:**
```javascript
export default function MyFeature({ testPlusMode = false }) {
  const { isPlusMember: actualIsPlusMember, setShowUpgradeModal } = useMembership();
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;
  // ...
}
```

3. **Gate the feature:**
```javascript
// For buttons that should show upgrade modal
{!isPlusMember ? (
  <TouchableOpacity onPress={() => setShowUpgradeModal(true)}>
    <PadlockIcon />
    <Text>Feature Name</Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity onPress={handleFeature}>
    <Text>Feature Name</Text>
  </TouchableOpacity>
)}

// Or use PlusMenuItem for menu items
<PlusMenuItem
  label="My Feature"
  isPlusFeature={true}
  testPlusMode={testPlusMode}
  onPress={handleFeature}
/>
```

4. **Pass testPlusMode down:**
```javascript
// In App.js or parent component
<MyFeature testPlusMode={testPlusMode} />
```

---

## Modal System

### Overview
The app uses a standardized modal system with consistent styling and behavior.

### Modal Components

#### 1. StandardModal
**Location:** `components/StandardModal.js`

Base modal for most use cases. Full-screen modal with header, close button, and scrollable content.

```javascript
import StandardModal from './StandardModal';

<StandardModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  title="Modal Title"
  subtitle="Optional subtitle"
  showCloseButton={true}       // Default: true
  scrollable={true}             // Default: true
  headerStyle={{}}              // Optional custom header styles
  contentStyle={{}}             // Optional custom content styles
  showMembershipBadge={<MembershipBadge />}  // Optional badge
>
  {/* Your content here */}
</StandardModal>
```

#### 2. FormModal
**Location:** `components/FormModal.js`

Modal for forms with Cancel/Save actions.

```javascript
import FormModal from './FormModal';

<FormModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  onSave={handleSave}
  title="Edit Category"
  saveLabel="Save"      // Optional, default: "Save"
  cancelLabel="Cancel"  // Optional, default: "Cancel"
>
  {/* Form content */}
</FormModal>
```

### Modal Layering Best Practice

**IMPORTANT:** When opening a modal from another modal, always close the first modal before opening the second.

```javascript
// ❌ WRONG - Modals will stack incorrectly
<TouchableOpacity onPress={() => setShowUpgradeModal(true)}>
  <Text>Upgrade</Text>
</TouchableOpacity>

// ✅ CORRECT - Close current modal first
<TouchableOpacity onPress={() => {
  onClose();  // Close current modal
  setShowUpgradeModal(true);  // Then open new modal
}}>
  <Text>Upgrade</Text>
</TouchableOpacity>
```

**Why:** React Native modals are full-screen and can conflict if multiple are visible. Closing the first ensures the second appears on top.

### Modal Constants
**Location:** `constants/modalStyles.js`

All modal dimensions, colors, and styles are centralized here.

```javascript
import { MODAL_CONSTANTS, COMMON_MODAL_STYLES } from '../constants/modalStyles';

// Use constants for consistency
const styles = StyleSheet.create({
  header: {
    paddingTop: MODAL_CONSTANTS.HEADER_PADDING_TOP,
    // ...
  }
});
```

---

## Component Structure

### Standard Component Template

```javascript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

/**
 * ComponentName - Brief description
 *
 * Props:
 * - propName: Description
 * - optionalProp: Description (default: value)
 */
export default function ComponentName({
  requiredProp,
  optionalProp = defaultValue,
}) {
  // 1. Font loading
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // 2. State
  const [localState, setLocalState] = useState(initialValue);

  // 3. Context (if needed)
  const { contextValue } = useContext(SomeContext);

  // 4. Font loading guard
  if (!fontsLoaded) {
    return null;
  }

  // 5. Handlers
  const handleAction = () => {
    // ...
  };

  // 6. Render
  return (
    <View style={styles.container}>
      {/* Component content */}
    </View>
  );
}

// 7. Styles at bottom
const styles = StyleSheet.create({
  container: {
    // ...
  },
});
```

### Component Documentation

Always include JSDoc comments at the top of components:

```javascript
/**
 * PlusMenuItem - Menu item component with automatic Plus feature gating
 *
 * Props:
 * - label: Text to display
 * - onPress: Function to call when clicked (only if user has access)
 * - isPlusFeature: Whether this is a Plus-only feature (default: false)
 * - testPlusMode: Override for testing (default: false)
 * - style: Additional styles for the container
 */
```

---

## State Management

### MembershipContext
**Location:** `contexts/MembershipContext.js`

Centralized state for Plus membership and custom categories.

```javascript
import { useMembership } from '../contexts/MembershipContext';

function MyComponent() {
  const {
    isPlusMember,           // Boolean: true if user has Plus
    customCategories,       // Array: user's custom categories
    addCustomCategory,      // Function: add new category
    deleteCustomCategory,   // Function: delete category
    upgradeToPlus,         // Function: upgrade user to Plus
    showUpgradeModal,      // Boolean: upgrade modal visibility
    setShowUpgradeModal,   // Function: toggle upgrade modal
  } = useMembership();

  // Use these values/functions throughout your component
}
```

### AsyncStorage Keys

**Location:** Various files

Standard keys used for local storage:

```javascript
// Session tracking
const COMPLETED_SESSIONS_KEY = '@completed_sessions';
// Data structure: { "2025-10-24": [{ category, minutes, timestamp }] }

// Test mode settings
const TEST_PLUS_MODE_KEY = '@test_plus_mode';      // Boolean
const TEST_PAGES_KEY = '@test_pages';              // Boolean

// Custom categories
const CUSTOM_CATEGORIES_KEY = '@custom_categories';
// Data structure: [{ name, color, defaultMinutes, isCustom: true }]
```

### Loading/Saving Pattern

```javascript
// Load from AsyncStorage
const loadData = async () => {
  try {
    const data = await AsyncStorage.getItem(KEY);
    if (data) {
      const parsed = JSON.parse(data);
      setState(parsed);
    }
  } catch (error) {
    console.log('Error loading data:', error);
  }
};

// Save to AsyncStorage
const saveData = async (value) => {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(value));
  } catch (error) {
    console.log('Error saving data:', error);
  }
};

// Use in useEffect
useEffect(() => {
  loadData();
}, []);
```

---

## Development & Testing

### Test Mode Pattern

The app includes development-only test modes for Plus features and hidden pages.

#### Test Settings Access
**Location:** `components/TestSettingsModal.js`

Access via Hamburger Menu → Test (only visible in dev builds)

#### Test Mode Implementation

```javascript
// 1. In App.js - manage test mode state
const [testPlusMode, setTestPlusMode] = useState(false);
const [showTestPages, setShowTestPages] = useState(false);

// 2. Load/save test settings
useEffect(() => {
  const loadTestSettings = async () => {
    const plusMode = await AsyncStorage.getItem('@test_plus_mode');
    const testPages = await AsyncStorage.getItem('@test_pages');
    setTestPlusMode(plusMode === 'true');
    setShowTestPages(testPages === 'true');
  };
  loadTestSettings();
}, []);

// 3. Pass to child components
<MyComponent testPlusMode={testPlusMode} />

// 4. In child component - override membership
const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;
```

#### Development-Only Features

Use `__DEV__` to hide features in production:

```javascript
{__DEV__ && (
  <>
    <View style={styles.separator} />
    <TouchableOpacity onPress={handleDevFeature}>
      <Text style={styles.devText}>Dev Only Feature</Text>
    </TouchableOpacity>
  </>
)}
```

**Example:** Test menu in hamburger, test animations button

---

## Session Tracking

### Completed Sessions Pattern
**Location:** `App.js`

Sessions are saved when the timer reaches 0 (not when paused/cancelled).

```javascript
// Save session
const saveCompletedSession = async (category, minutes) => {
  try {
    const today = new Date().toISOString().split('T')[0]; // "2025-10-24"
    const session = {
      category,
      minutes,
      timestamp: Date.now(),
    };

    // Load existing sessions
    const existingData = await AsyncStorage.getItem('@completed_sessions');
    const sessions = existingData ? JSON.parse(existingData) : {};

    // Add to today's sessions
    if (!sessions[today]) {
      sessions[today] = [];
    }
    sessions[today].push(session);

    // Save back
    await AsyncStorage.setItem('@completed_sessions', JSON.stringify(sessions));
  } catch (error) {
    console.log('Error saving session:', error);
  }
};

// Call when timer completes
if (timeLeft === 0) {
  saveCompletedSession(selectedCategory, sessionStartMinutes);
}
```

### Retrieving Sessions

```javascript
const loadCompletedSessions = async () => {
  try {
    const data = await AsyncStorage.getItem('@completed_sessions');
    if (data) {
      const sessions = JSON.parse(data);
      setSessionData(sessions);
    }
  } catch (error) {
    console.log('Error loading sessions:', error);
  }
};

// Calculate total for a specific day and category
const getTotalMinutes = (date, category) => {
  const dateString = date.toISOString().split('T')[0];
  const sessions = sessionData[dateString] || [];

  const filteredSessions = category === 'All'
    ? sessions
    : sessions.filter(s => s.category === category);

  return filteredSessions.reduce((total, session) => total + session.minutes, 0);
};
```

---

## Styling Conventions

### Color Palette

```javascript
// Primary colors
const COLORS = {
  PURPLE: '#9C27B0',           // Plus features, primary actions
  BEIGE: '#F5F1ED',            // Background
  DARK_TEXT: '#2C3E50',        // Primary text
  GRAY: '#8B8B8B',             // Secondary text, borders
  GREEN: '#4CAF50',            // Success, selected states
  ORANGE: '#FF7A59',           // Timer, highlights
  RED: '#FF0000',              // Delete, destructive actions
};
```

### Typography

```javascript
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

// Font usage
const styles = StyleSheet.create({
  regularText: {
    fontFamily: 'Poppins_400Regular',  // Body text
    fontSize: 16,
  },
  semiBoldText: {
    fontFamily: 'Poppins_600SemiBold',  // Headings, buttons
    fontSize: 18,
  },
  boldText: {
    fontFamily: 'Poppins_700Bold',      // Emphasis, prices
    fontSize: 20,
  },
});
```

### Touch Targets

For mobile-friendly tap targets:

```javascript
// Minimum touch target: 44x44 points (accessibility)
const styles = StyleSheet.create({
  button: {
    paddingVertical: 20,    // Generous padding for fingers
    paddingHorizontal: 24,
  },
  icon: {
    width: 44,    // Accessibility minimum
    height: 44,
  },
});
```

### Common Patterns

```javascript
// Semi-transparent backgrounds
backgroundColor: 'rgba(139, 139, 139, 0.15)',

// Border radius for cards
borderRadius: 25,  // Large cards
borderRadius: 15,  // Medium cards
borderRadius: 12,  // Small elements

// Shadows (iOS)
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.15,
shadowRadius: 8,
elevation: 5,  // Android shadow
```

---

## Category System

### Default Categories
**Location:** `App.js`

```javascript
const DEFAULT_CATEGORIES = [
  { name: 'Work', color: '#FF7A59', defaultMinutes: 25, isCustom: false },
  { name: 'Study', color: '#4CAF50', defaultMinutes: 25, isCustom: false },
  { name: 'Exercise', color: '#2196F3', defaultMinutes: 25, isCustom: false },
  { name: 'Reading', color: '#9C27B0', defaultMinutes: 25, isCustom: false },
];
```

### Custom Categories (Plus Feature)

```javascript
// Custom categories have isCustom: true
const customCategory = {
  name: 'My Category',
  color: '#FFEB3B',
  defaultMinutes: 30,
  isCustom: true,  // Important for edit/delete functionality
};

// Combine default + custom
const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

// Show edit/delete only for custom categories
{category.isCustom && isPlusMember && (
  <View style={styles.categoryActions}>
    <TouchableOpacity onPress={() => handleEdit(category)}>
      <Text>Edit</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => handleDelete(category.name)}>
      <Text>Delete</Text>
    </TouchableOpacity>
  </View>
)}
```

---

## Quick Reference Checklist

When adding a new feature, use this checklist:

### For Plus Features:
- [ ] Import `useMembership` and `PadlockIcon`
- [ ] Add `testPlusMode` prop with default `false`
- [ ] Implement test mode override: `__DEV__ && testPlusMode ? true : actualIsPlusMember`
- [ ] Use `PadlockIcon` component (not inline SVG)
- [ ] Use `PlusMenuItem` for menu items
- [ ] Close current modal before opening upgrade modal
- [ ] Pass `testPlusMode` from parent component

### For Modals:
- [ ] Use `StandardModal` or `FormModal`
- [ ] Import from `components/`
- [ ] Add close handler
- [ ] If opening from another modal, close current first
- [ ] Consider scrollable content (default: true)

### For Components:
- [ ] Add JSDoc comment with prop descriptions
- [ ] Load Poppins fonts at top
- [ ] Return null if fonts not loaded
- [ ] Place styles at bottom
- [ ] Use MODAL_CONSTANTS for modal dimensions
- [ ] Follow touch target minimum sizes (44x44)

### For State:
- [ ] Use meaningful AsyncStorage keys with `@` prefix
- [ ] Handle JSON parse/stringify
- [ ] Add try/catch for AsyncStorage operations
- [ ] Consider loading state in useEffect

---

## Getting Help

When in doubt:
1. Check existing components for patterns (e.g., `PlusMenuItem.js`, `CategorySelectionModal.js`)
2. Look at `MODAL_CONSTANTS` for standard dimensions
3. Follow the component template structure
4. Use test mode to verify Plus features
5. Refer to this document for established patterns

**Remember:** Consistency is key. When you see a pattern used multiple times, that's the pattern to follow.
