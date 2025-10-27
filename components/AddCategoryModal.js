import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useMembership } from '../contexts/MembershipContext';
import { useModal, useModalManager } from '../contexts/ModalContext';
import StandardModal from './StandardModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Predefined color options
const COLOR_OPTIONS = [
  '#FF6B6B', // Red
  '#FF7A59', // Orange
  '#FFC107', // Yellow
  '#4CAF50', // Green
  '#00BCD4', // Cyan
  '#5B9BD5', // Blue
  '#9C27B0', // Purple
  '#E91E63', // Pink
  '#795548', // Brown
  '#607D8B', // Blue Grey
];

export default function AddCategoryModal() {
  const { visible, params, close, isTop } = useModal('AddCategory');
  const { openModal } = useModalManager();
  const { addCustomCategory, updateCustomCategory } = useMembership();

  const { onAdd, onDelete, editingCategory = null } = params;

  const [categoryName, setCategoryName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [defaultMinutes, setDefaultMinutes] = useState('25');
  const [error, setError] = useState('');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // Initialize form fields when modal opens
  useEffect(() => {
    if (visible) {
      if (editingCategory) {
        // Edit mode - populate with existing data
        setCategoryName(editingCategory.name);
        setSelectedColor(editingCategory.color);
        setDefaultMinutes(String(editingCategory.defaultMinutes));
      } else {
        // Add mode - use defaults
        setCategoryName('');
        setSelectedColor(COLOR_OPTIONS[0]);
        setDefaultMinutes('25');
      }
      setError('');
    }
  }, [visible, editingCategory]);

  // Only render if this modal is the top-most modal
  if (!fontsLoaded || !visible || !isTop) {
    return null;
  }

  const handleSave = async () => {
    // Validate inputs
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (categoryName.length > 20) {
      setError('Category name must be 20 characters or less');
      return;
    }

    const minutes = parseInt(defaultMinutes, 10);
    if (isNaN(minutes) || minutes < 5 || minutes > 180) {
      setError('Duration must be between 5 and 180 minutes');
      return;
    }

    const newCategory = {
      name: categoryName.trim(),
      color: selectedColor,
      defaultMinutes: minutes,
      isCustom: true,
    };

    let success;
    if (editingCategory) {
      success = await updateCustomCategory(editingCategory.name, newCategory);
    } else {
      success = await addCustomCategory(newCategory);
    }

    if (success) {
      if (onAdd) {
        onAdd(newCategory);
      }
      close();
    }
  };

  const handleMinutesChange = (text) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setDefaultMinutes(cleaned);
  };

  const handleDelete = () => {
    openModal('Confirmation', {
      title: 'Delete Category',
      message: `Are you sure you want to delete "${editingCategory?.name}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmStyle: 'destructive',
      onConfirm: handleConfirmDelete,
    });
  };

  const handleConfirmDelete = async () => {
    if (onDelete && editingCategory) {
      await onDelete(editingCategory.name);
      close();
    }
  };

  return (
    <StandardModal
      visible={visible}
      onClose={close}
      title={editingCategory ? 'Edit Category' : 'New Category'}
      scrollable={true}
    >
      {/* Category Name Input */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Category Name</Text>
        <TextInput
          style={styles.textInput}
          value={categoryName}
          onChangeText={(text) => {
            setCategoryName(text);
            setError('');
          }}
          placeholder="e.g., Deep Work"
          placeholderTextColor="#8B8B8B"
          maxLength={20}
          autoCapitalize="words"
        />
        <Text style={styles.characterCount}>
          {categoryName.length}/20
        </Text>
      </View>

      {/* Color Selection */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Default Duration */}
      <View style={styles.inputSection}>
        <Text style={styles.label}>Default Duration (minutes)</Text>
        <TextInput
          style={styles.textInput}
          value={defaultMinutes}
          onChangeText={handleMinutesChange}
          keyboardType="numeric"
          placeholder="25"
          placeholderTextColor="#8B8B8B"
          maxLength={3}
        />
        <Text style={styles.durationHint}>
          Between 5 and 180 minutes
        </Text>
      </View>

      {/* Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.label}>Preview</Text>
        <View style={styles.previewCard}>
          <View style={[styles.previewColorCircle, { backgroundColor: selectedColor }]} />
          <View style={styles.previewInfo}>
            <Text style={styles.previewName}>
              {categoryName || 'Category Name'}
            </Text>
            <Text style={styles.previewDuration}>
              {defaultMinutes || '25'}:00
            </Text>
          </View>
        </View>
      </View>

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Save and Delete Buttons - Fixed at bottom */}
      <View style={styles.bottomContainer}>
        {/* Delete Button - Only show when editing */}
        {editingCategory && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Delete Category</Text>
          </TouchableOpacity>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {editingCategory ? 'Save Changes' : 'Create Category'}
          </Text>
        </TouchableOpacity>
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  inputSection: {
    marginBottom: 30,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    textAlign: 'right',
    marginTop: 5,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  colorOptionSelected: {
    transform: [{ scale: 1.1 }],
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  durationHint: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    marginTop: 5,
  },
  previewSection: {
    marginBottom: 30,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 139, 139, 0.1)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 19,
  },
  previewColorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 15,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  previewDuration: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#FF0000',
    textAlign: 'center',
  },
  bottomContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(139, 139, 139, 0.2)',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#FF0000',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  saveButton: {
    backgroundColor: '#9C27B0',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
});