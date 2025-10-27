import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useMembership } from '../contexts/MembershipContext';
import { useModal, useModalManager } from '../contexts/ModalContext';
import MembershipBadge from './MembershipBadge';
import StandardModal from './StandardModal';
import PadlockIcon from './PadlockIcon';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CategorySelectionModal() {
  const { visible, params, close, isTop } = useModal('CategorySelection');
  const { openModal } = useModalManager();
  const { customCategories, isPlusMember: actualIsPlusMember, deleteCustomCategory, setShowUpgradeModal } = useMembership();

  const { categories, selectedCategory, onSelect, testPlusMode = false } = params;

  // In dev mode, allow testPlusMode to override actual membership
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Only render if this modal is the top-most modal
  if (!fontsLoaded || !visible || !isTop) {
    return null;
  }

  // Combine default categories with custom categories
  const allCategories = [...categories, ...customCategories];

  const handleEditCategory = (category) => {
    openModal('AddCategory', {
      editingCategory: category,
      onDelete: deleteCustomCategory,
      onAdd: () => {}, // Category is automatically added to context
    });
  };

  const handleAddNewCategory = () => {
    openModal('AddCategory', {
      onDelete: deleteCustomCategory,
      onAdd: () => {}, // Category is automatically added to context
    });
  };

  return (
    <StandardModal
      visible={visible}
      onClose={close}
      title="Categories"
      showMembershipBadge={isPlusMember && <MembershipBadge style={styles.membershipBadge} />}
    >
      {/* New Category Button */}
      {isPlusMember ? (
        <TouchableOpacity
          style={[styles.addButton, styles.addButtonContainer]}
          onPress={handleAddNewCategory}
        >
          <Text style={styles.addButtonText}>New Category</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.addButton, styles.addButtonContainer]}
          onPress={() => {
            close();
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
                  close();
                }}
              >
                {/* Color circle */}
                <View style={[styles.colorCircle, { backgroundColor: category.color }]} />

                {/* Category info */}
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDuration}>{category.defaultMinutes}:00</Text>
                </View>

                {/* Edit button for custom categories */}
                {category.isCustom && isPlusMember && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleEditCategory(category);
                    }}
                  >
                    <Text style={styles.actionButtonText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          })}
      </View>
    </StandardModal>
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
  actionButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#9C27B0',
  },
});
