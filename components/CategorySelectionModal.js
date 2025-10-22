import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CategorySelectionModal({ visible, categories, selectedCategory, onSelect, onClose }) {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Category list */}
        <View style={styles.categoryList}>
          {categories.map((category) => {
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
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F1ED',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 10,
    marginBottom: 20,
  },
  closeButtonText: {
    fontSize: 28,
    color: '#2C3E50',
  },
  categoryList: {
    flex: 1,
    paddingTop: 40,
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
});
