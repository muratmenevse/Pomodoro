import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useMembership } from '../contexts/MembershipContext';
import AddCategoryModal from './AddCategoryModal';
import MembershipBadge from './MembershipBadge';
import StandardModal from './StandardModal';
import PadlockIcon from './PadlockIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CategorySelectionModal({ visible, categories, selectedCategory, onSelect, onClose, testPlusMode = false }) {
  const { customCategories, isPlusMember: actualIsPlusMember, deleteCustomCategory, setShowUpgradeModal } = useMembership();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  // In dev mode, allow testPlusMode to override actual membership
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Combine default categories with custom categories
  const allCategories = [...categories, ...customCategories];

  const handleDeleteCategory = async (categoryName) => {
    await deleteCustomCategory(categoryName);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setShowAddModal(true);
  };

  const handleAddCategory = (newCategory) => {
    // Category is automatically added to context by AddCategoryModal
    // Just close the modal
    setShowAddModal(false);
  };

  return (
    <>
      <StandardModal
        visible={visible}
        onClose={onClose}
        title="Categories"
        showMembershipBadge={isPlusMember && <MembershipBadge style={styles.membershipBadge} />}
      >
        {/* New Category Button */}
        {isPlusMember ? (
          <TouchableOpacity
            style={[styles.addButton, styles.addButtonContainer]}
            onPress={() => {
              setEditingCategory(null);
              setShowAddModal(true);
            }}
          >
            <Text style={styles.addButtonText}>New Category</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, styles.addButtonContainer]}
            onPress={() => {
              onClose();
              setShowUpgradeModal(true);
            }}
          >
            <PadlockIcon style={styles.padlockIcon} />
            <Text style={styles.addButtonText}>New Category</Text>
          </TouchableOpacity>
        )}

        {/* Category list */}
        <View style={styles.categoryList}>
          {allCategories.map((category) => {
            const isSelected = category.name === selectedCategory;
            return (
              <TouchableOpacity
                key={category.name}
                style={[
                  styles.categoryCard,
                  isSelected && styles.categoryCardSelected,
                ]}
                onPress={() => {
                  onSelect(category.name);
                  onClose();
                }}
              >
                {/* Color circle */}
                <View style={[styles.colorCircle, { backgroundColor: category.color }]} />

                {/* Category info */}
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDuration}>{category.defaultMinutes}:00</Text>
                </View>

                {/* Edit/Delete buttons for custom categories */}
                {category.isCustom && isPlusMember && (
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.name);
                      }}
                    >
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </StandardModal>

      {/* Add/Edit Category Modal */}
      <AddCategoryModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingCategory(null);
        }}
        onAdd={handleAddCategory}
        editingCategory={editingCategory}
      />
    </>
  );
}

const styles = StyleSheet.create({
  membershipBadge: {
    marginLeft: 10,
  },
  addButtonContainer: {
    marginBottom: 75,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 139, 139, 0.15)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 12,
    alignSelf: 'flex-end',
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    textAlign: 'right',
  },
  padlockIcon: {
    marginRight: 10,
  },
  categoryList: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 139, 139, 0.15)',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 19,
    marginBottom: 20,
  },
  categoryCardSelected: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 15,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 2,
  },
  categoryDuration: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9C27B0',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  deleteButtonText: {
    color: '#FF0000',
  },
});
