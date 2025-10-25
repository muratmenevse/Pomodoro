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

  // Format day label (e.g., "Sun 29")
  const formatDayLabel = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = days[date.getDay()];
    const dayNum = date.getDate();
    return `${dayName}\n${dayNum}`;
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

  return (
    <StandardModal
      visible={visible}
      onClose={onClose}
      title="Progress"
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
        <Svg width={chartWidth + 40} height={chartHeight + 50}>
          {/* Y-axis labels and grid lines */}
          {[0, 0.5, 1, 1.5].map((value, index) => {
            const y = chartHeight - (value / (maxMinutes / 60)) * chartHeight;
            const label = value === 0 ? '0' : value === 0.5 ? '30m' : `${value}h`;

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
                <SvgText
                  x="5"
                  y={y + 5}
                  fill="#8B8B8B"
                  fontSize="12"
                  fontFamily="Poppins_400Regular"
                >
                  {label}
                </SvgText>
              </React.Fragment>
            );
          })}

          {/* Bars */}
          {chartData.map((data, index) => {
            const barHeight = (data.minutes / maxMinutes) * chartHeight;
            const x = 40 + index * (barWidth + 10);
            const y = chartHeight - barHeight;
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
                <SvgText
                  x={x + barWidth / 2}
                  y={chartHeight + 20}
                  fill="#8B8B8B"
                  fontSize="11"
                  fontFamily="Poppins_400Regular"
                  textAnchor="middle"
                >
                  {formatDayLabel(data.date)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>
          {selectedCategory === 'All' ? 'All Categories' : selectedCategory}
        </Text>
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
  legend: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  legendText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
  },
});
