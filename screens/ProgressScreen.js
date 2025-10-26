import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useMembership } from '../contexts/MembershipContext';
import StandardModal from '../components/StandardModal';
import PlusFeatureLock from '../components/PlusFeatureLock';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPLETED_SESSIONS_KEY = '@completed_sessions';

export default function ProgressScreen({ visible, onClose, categories, testPlusMode = false }) {
  const { isPlusMember: actualIsPlusMember, setShowUpgradeModal } = useMembership();
  const [sessionData, setSessionData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  // In dev mode, allow testPlusMode to override actual membership
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (visible && isPlusMember) {
      loadSessionData();
    }
  }, [visible, isPlusMember]);

  const loadSessionData = async () => {
    try {
      const data = await AsyncStorage.getItem(COMPLETED_SESSIONS_KEY);
      if (data) {
        setSessionData(JSON.parse(data));
      }
    } catch (error) {
      console.log('Error loading session data:', error);
    }
  };

  // Get last 7 days
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push(date);
    }
    return days;
  };

  // Calculate total minutes for a specific day and category
  const getTotalMinutes = (date, category) => {
    const dateString = date.toISOString().split('T')[0];
    const sessions = sessionData[dateString] || [];

    const filteredSessions = category === 'All'
      ? sessions
      : sessions.filter(s => s.category === category);

    return filteredSessions.reduce((total, session) => total + session.minutes, 0);
  };

  // Get day name and number separately
  const getDayName = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[date.getDay()];
  };

  const getDayNumber = (date) => {
    return date.getDate();
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  if (!fontsLoaded) {
    return null;
  }

  // If not Plus member, show upgrade prompt
  if (!isPlusMember) {
    return (
      <StandardModal
        visible={visible}
        onClose={onClose}
        title="Progress"
      >
        <View style={styles.lockContainer}>
          <PlusFeatureLock
            feature="progress"
            onPress={() => {
              onClose();
              setTimeout(() => setShowUpgradeModal(true), 300);
            }}
          >
            <View style={styles.lockedContent}>
              <Text style={styles.lockedTitle}>Track Your Progress</Text>
              <Text style={styles.lockedDescription}>
                Upgrade to Plus to track your daily focus sessions and see your productivity trends over time.
              </Text>
            </View>
          </PlusFeatureLock>
        </View>
      </StandardModal>
    );
  }

  const last7Days = getLast7Days();
  const chartData = last7Days.map(date => ({
    date,
    minutes: getTotalMinutes(date, selectedCategory),
  }));

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 60); // At least 60 min scale
  const chartHeight = 200;
  const chartWidth = SCREEN_WIDTH - 80;
  const barWidth = chartWidth / 7 - 10;
  const TOP_PADDING = 20; // Padding to prevent label cutoff at top

  // Generate gridline intervals (every 15 minutes)
  const generateGridlines = () => {
    const maxHours = Math.ceil((maxMinutes / 60) * 4) / 4; // Round up to nearest 0.25
    const gridlines = [];
    for (let i = 0; i <= maxHours * 4; i++) {
      gridlines.push(i * 0.25);
    }
    return gridlines;
  };

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Progress"
      isPlusFeature={true}
    >
      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
        <TouchableOpacity
          style={[
            styles.categoryPill,
            selectedCategory === 'All' && styles.categoryPillSelected,
            { backgroundColor: selectedCategory === 'All' ? '#8B8B8B' : 'rgba(139, 139, 139, 0.15)' }
          ]}
          onPress={() => setSelectedCategory('All')}
        >
          <Text style={[
            styles.categoryPillText,
            selectedCategory === 'All' && styles.categoryPillTextSelected
          ]}>All</Text>
        </TouchableOpacity>

        {categories.map((category) => {
          const isSelected = selectedCategory === category.name;
          return (
            <TouchableOpacity
              key={category.name}
              style={[
                styles.categoryPill,
                isSelected && styles.categoryPillSelected,
                { backgroundColor: isSelected ? category.color : 'rgba(139, 139, 139, 0.15)' }
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Text style={[
                styles.categoryPillText,
                isSelected && styles.categoryPillTextSelected
              ]}>{category.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bar Chart */}
      <View style={styles.chartContainer}>
        <Svg width={chartWidth + 40} height={chartHeight + 80}>
          {/* Grid lines (every 15 minutes) and Y-axis labels (every 30 minutes) */}
          {generateGridlines().map((value, index) => {
            const y = TOP_PADDING + chartHeight - (value / (maxMinutes / 60)) * chartHeight;
            const showLabel = value % 0.5 === 0; // Show label only at 30-minute intervals
            const label = value === 0 ? '0' : value < 1 ? `${value * 60}m` : `${value}h`;

            return (
              <React.Fragment key={index}>
                <Line
                  x1="30"
                  y1={y}
                  x2={chartWidth + 30}
                  y2={y}
                  stroke="rgba(139, 139, 139, 0.2)"
                  strokeWidth="1"
                />
                {showLabel && (
                  <SvgText
                    x="5"
                    y={y + 5}
                    fill="#8B8B8B"
                    fontSize="12"
                    fontFamily="Poppins_400Regular"
                  >
                    {label}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}

          {/* Bars */}
          {chartData.map((data, index) => {
            const barHeight = (data.minutes / maxMinutes) * chartHeight;
            const x = 40 + index * (barWidth + 10);
            const y = TOP_PADDING + chartHeight - barHeight;
            const today = isToday(data.date);

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight || 0}
                  fill={today ? '#FF7A59' : 'rgba(139, 139, 139, 0.6)'}
                  rx="4"
                />
                {/* Day name (first row) */}
                <SvgText
                  x={x + barWidth / 2}
                  y={TOP_PADDING + chartHeight + 18}
                  fill="#8B8B8B"
                  fontSize="11"
                  fontFamily="Poppins_400Regular"
                  textAnchor="middle"
                >
                  {getDayName(data.date)}
                </SvgText>
                {/* Day number (second row) */}
                <SvgText
                  x={x + barWidth / 2}
                  y={TOP_PADDING + chartHeight + 32}
                  fill="#8B8B8B"
                  fontSize="11"
                  fontFamily="Poppins_400Regular"
                  textAnchor="middle"
                >
                  {getDayNumber(data.date)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </StandardModal>
  );
}

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  lockedContent: {
    alignItems: 'center',
    padding: 30,
  },
  lockedTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 10,
  },
  lockedDescription: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
    textAlign: 'center',
    lineHeight: 24,
  },
  categoryFilter: {
    marginBottom: 30,
    maxHeight: 50,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryPillSelected: {
    // Background color set inline
  },
  categoryPillText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
  categoryPillTextSelected: {
    color: '#FFFFFF',
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
});
