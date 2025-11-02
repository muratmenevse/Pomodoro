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
import ScreenContainer from '../components/ScreenContainer';
import PlusFeatureLock from '../components/PlusFeatureLock';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPLETED_SESSIONS_KEY = '@completed_sessions';

export default function ProgressScreen({ navigation, route }) {
  const { categories = [], testPlusMode = false } = route.params || {};
  const { isPlusMember: actualIsPlusMember } = useMembership();
  const [sessionData, setSessionData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedView, setSelectedView] = useState('week'); // 'week', 'month', 'year'

  // In dev mode, allow testPlusMode to override actual membership
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (isPlusMember) {
      loadSessionData();
    }
  }, [isPlusMember]);

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

  // Get current week's days (Monday - Sunday)
  const getCurrentWeekDays = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const monday = new Date(today);
    // Adjust to get Monday (if today is Sunday, go back 6 days, otherwise go back (dayOfWeek - 1))
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get current month's weeks
  const getCurrentMonthWeeks = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Find Monday of the week containing the first day
    const firstDayOfWeek = firstDay.getDay();
    const firstMonday = new Date(firstDay);
    firstMonday.setDate(firstDay.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));

    const weeks = [];
    let currentMonday = new Date(firstMonday);

    // Keep adding weeks until we pass the last day of the month
    while (currentMonday <= lastDay) {
      const weekEnd = new Date(currentMonday);
      weekEnd.setDate(currentMonday.getDate() + 6); // Sunday

      weeks.push({
        start: new Date(currentMonday),
        end: weekEnd
      });

      currentMonday.setDate(currentMonday.getDate() + 7); // Next Monday
    }

    return weeks;
  };

  // Get current year's months
  const getCurrentYearMonths = () => {
    const today = new Date();
    const year = today.getFullYear();
    const months = [];

    for (let i = 0; i < 12; i++) {
      months.push({
        index: i,
        name: new Date(year, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        year: year
      });
    }

    return months;
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

  // Calculate total minutes for a week (date range)
  const getWeekMinutes = (startDate, endDate, category) => {
    let totalMinutes = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      totalMinutes += getTotalMinutes(currentDate, category);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return totalMinutes;
  };

  // Calculate total minutes for a month
  const getMonthMinutes = (monthIndex, year, category) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);

    return getWeekMinutes(firstDay, lastDay, category);
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

  // Get categories that have sessions within the chart's visible range
  const getCategoriesWithSessions = () => {
    const categoryMap = new Map(); // Map of category name -> category object
    let dates = [];

    // Get dates based on selected view
    if (selectedView === 'week') {
      dates = getCurrentWeekDays();
    } else if (selectedView === 'month') {
      const weeks = getCurrentMonthWeeks();
      // Get all dates in the month's weeks
      weeks.forEach(week => {
        const currentDate = new Date(week.start);
        while (currentDate <= week.end) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    } else if (selectedView === 'year') {
      // Get all dates in the year
      const months = getCurrentYearMonths();
      months.forEach(month => {
        const firstDay = new Date(month.year, month.index, 1);
        const lastDay = new Date(month.year, month.index + 1, 0);
        const currentDate = new Date(firstDay);
        while (currentDate <= lastDay) {
          dates.push(new Date(currentDate));
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    // Extract categories from sessions within the visible date range
    dates.forEach(date => {
      const dateString = date.toISOString().split('T')[0];
      const sessions = sessionData[dateString] || [];

      sessions.forEach(session => {
        if (!categoryMap.has(session.category)) {
          // Build category object from session data or active categories
          const activeCategory = categories.find(cat => cat.name === session.category);

          categoryMap.set(session.category, {
            name: session.category,
            color: session.color || (activeCategory ? activeCategory.color : '#8B8B8B'),
            defaultMinutes: activeCategory ? activeCategory.defaultMinutes : 25,
          });
        }
      });
    });

    const categoriesWithSessions = Array.from(categoryMap.values());

    // If no sessions exist in visible range, show all categories (for new users)
    return categoriesWithSessions.length > 0 ? categoriesWithSessions : categories;
  };

  // Get total completed sessions based on current view
  const getCompletedSessions = () => {
    let totalSessions = 0;

    if (selectedView === 'week') {
      const weekDays = getCurrentWeekDays();
      weekDays.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        const sessions = sessionData[dateString] || [];
        totalSessions += sessions.length;
      });
    } else if (selectedView === 'month') {
      const weeks = getCurrentMonthWeeks();
      weeks.forEach(week => {
        const currentDate = new Date(week.start);
        while (currentDate <= week.end) {
          const dateString = currentDate.toISOString().split('T')[0];
          const sessions = sessionData[dateString] || [];
          totalSessions += sessions.length;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    } else if (selectedView === 'year') {
      const months = getCurrentYearMonths();
      months.forEach(month => {
        const firstDay = new Date(month.year, month.index, 1);
        const lastDay = new Date(month.year, month.index + 1, 0);
        const currentDate = new Date(firstDay);
        while (currentDate <= lastDay) {
          const dateString = currentDate.toISOString().split('T')[0];
          const sessions = sessionData[dateString] || [];
          totalSessions += sessions.length;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    return totalSessions;
  };

  if (!fontsLoaded) {
    return null;
  }

  // If not Plus member, show upgrade prompt
  if (!isPlusMember) {
    return (
      <ScreenContainer
        onClose={() => navigation.goBack()}
        title="Progress"
      >
        <View style={styles.lockContainer}>
          <PlusFeatureLock
            feature="progress"
            onPress={() => {
              navigation.navigate('Upgrade');
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
      </ScreenContainer>
    );
  }

  // Build chart data based on selected view
  let chartData = [];
  let barCount = 7; // default for week view

  if (selectedView === 'week') {
    const weekDays = getCurrentWeekDays();
    chartData = weekDays.map(date => ({
      date,
      label: `${getDayName(date)}\n${getDayNumber(date)}`,
      minutes: getTotalMinutes(date, selectedCategory),
      isToday: isToday(date),
    }));
    barCount = 7;
  } else if (selectedView === 'month') {
    const weeks = getCurrentMonthWeeks();
    chartData = weeks.map(week => ({
      start: week.start,
      end: week.end,
      label: `${week.start.getMonth() + 1}/${week.start.getDate()}-${week.end.getDate()}`,
      minutes: getWeekMinutes(week.start, week.end, selectedCategory),
      isToday: false, // weeks don't have "today" highlight
    }));
    barCount = weeks.length;
  } else if (selectedView === 'year') {
    const months = getCurrentYearMonths();
    chartData = months.map(month => ({
      index: month.index,
      label: month.name,
      minutes: getMonthMinutes(month.index, month.year, selectedCategory),
      isToday: new Date().getMonth() === month.index,
    }));
    barCount = 12;
  }

  const maxMinutes = Math.max(...chartData.map(d => d.minutes), 60); // At least 60 min scale
  const filteredCategories = getCategoriesWithSessions();
  const completedSessions = getCompletedSessions();
  const chartHeight = 200;
  const chartWidth = SCREEN_WIDTH - 80;
  const barWidth = chartWidth / barCount - 10;
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
    <ScreenContainer
      onClose={() => navigation.goBack()}
      title="Progress"
      isPlusFeature={true}
    >
      {/* View Switcher */}
      <View style={styles.viewSwitcher}>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'week' && styles.viewTabActive
          ]}
          onPress={() => setSelectedView('week')}
        >
          <Text style={[
            styles.viewTabText,
            selectedView === 'week' && styles.viewTabTextActive
          ]}>Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'month' && styles.viewTabActive
          ]}
          onPress={() => setSelectedView('month')}
        >
          <Text style={[
            styles.viewTabText,
            selectedView === 'month' && styles.viewTabTextActive
          ]}>Month</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewTab,
            selectedView === 'year' && styles.viewTabActive
          ]}
          onPress={() => setSelectedView('year')}
        >
          <Text style={[
            styles.viewTabText,
            selectedView === 'year' && styles.viewTabTextActive
          ]}>Year</Text>
        </TouchableOpacity>
      </View>

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

            // Split label by newline for multi-line display
            const labelLines = data.label.split('\n');

            return (
              <React.Fragment key={index}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight || 0}
                  fill={data.isToday ? '#FF7A59' : 'rgba(139, 139, 139, 0.6)'}
                  rx="4"
                />
                {/* Label (can be one or two lines) */}
                {labelLines.map((line, lineIndex) => (
                  <SvgText
                    key={lineIndex}
                    x={x + barWidth / 2}
                    y={TOP_PADDING + chartHeight + 18 + (lineIndex * 14)}
                    fill="#8B8B8B"
                    fontSize="11"
                    fontFamily="Poppins_400Regular"
                    textAnchor="middle"
                  >
                    {line}
                  </SvgText>
                ))}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>

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

        {filteredCategories.map((category) => {
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

      {/* Tomidos Section - only show if more than 1 completed session */}
      {completedSessions > 1 && (
        <View style={styles.tomidosSection}>
          <Text style={styles.tomidosTitle}>Tomidos</Text>
          <View style={styles.tomidosContent}>
            <TomatoCharacter size={44} state={CHARACTER_STATES.COMPLETED} />
            <Text style={styles.tomidosText}>x {completedSessions}</Text>
            <Text style={styles.tomidosText}>
              {selectedView === 'week' ? 'Weekly' : selectedView === 'month' ? 'Monthly' : 'Yearly'} Tomidos
            </Text>
          </View>
        </View>
      )}
    </ScreenContainer>
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
  viewSwitcher: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(139, 139, 139, 0.1)',
    borderRadius: 25,
    padding: 4,
    alignSelf: 'center',
  },
  viewTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  viewTabActive: {
    backgroundColor: '#FF7A59',
  },
  viewTabText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#8B8B8B',
  },
  viewTabTextActive: {
    color: '#FFFFFF',
  },
  categoryFilter: {
    marginBottom: 20,
    marginTop: -25,
    maxHeight: 40,
    alignSelf: 'center',
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  categoryPillSelected: {
    // Background color set inline
  },
  categoryPillText: {
    fontSize: 12,
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
  tomidosSection: {
    paddingHorizontal: 20,
    paddingVertical: 50,
    alignItems: 'center',
  },
  tomidosTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  tomidosContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tomidosText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
  },
});
