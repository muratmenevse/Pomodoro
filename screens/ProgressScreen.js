import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { useMembership } from '../contexts/MembershipContext';
import ScreenContainer from '../components/ScreenContainer';
import TomatoCharacter from '../components/TomatoCharacter';
import { CHARACTER_STATES } from '../components/characterStates';
import AnalyticsService from '../services/AnalyticsService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COMPLETED_SESSIONS_KEY = '@completed_sessions';
const WEEK_START_DAY_KEY = '@week_start_day';

export default function ProgressScreen({ navigation, route }) {
  const { categories = [], testPlusMode = false, testFakeDataMode = false } = route.params || {};
  const { isPlusMember: actualIsPlusMember } = useMembership();
  const [sessionData, setSessionData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedView, setSelectedView] = useState('day'); // 'day', 'week', 'month', 'year'
  const [weekStartDay, setWeekStartDay] = useState('Sunday');

  // In dev mode, allow testPlusMode to override actual membership
  const isPlusMember = __DEV__ && testPlusMode ? true : actualIsPlusMember;

  // Check if current view is premium (week/month/year are premium, day is free)
  const isPremiumView = selectedView !== 'day';
  const showPremiumOverlay = !isPlusMember && isPremiumView;

  // Generate mock session data for testing charts
  const generateMockData = () => {
    const mockData = {};
    const today = new Date();

    // Generate data for the past year
    for (let daysAgo = 0; daysAgo < 365; daysAgo++) {
      const date = new Date(today);
      date.setDate(date.getDate() - daysAgo);
      const dateString = date.toISOString().split('T')[0];

      // Random chance of having sessions (70% of days)
      if (Math.random() < 0.7) {
        const sessionCount = Math.floor(Math.random() * 5) + 1; // 1-5 sessions
        mockData[dateString] = [];

        for (let i = 0; i < sessionCount; i++) {
          mockData[dateString].push({
            minutes: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
            category: 'Work',
            status: 'completed',
          });
        }
      }
    }
    return mockData;
  };

  // Generate mock data once (only when in fake data mode)
  const mockData = useMemo(() => testFakeDataMode ? generateMockData() : {}, [testFakeDataMode]);

  // Switch between fake and real data - NO MERGING
  const displayData = testFakeDataMode ? mockData : sessionData;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    // Load session data for all users (day view is free)
    loadSessionData();
  }, []);

  // Track progress viewed when screen mounts (only if Plus member)
  useEffect(() => {
    if (isPlusMember) {
      AnalyticsService.trackProgressViewed(selectedView);
    }
  }, [isPlusMember]);

  // Track view changes
  useEffect(() => {
    if (isPlusMember) {
      AnalyticsService.trackProgressViewed(selectedView);
    }
  }, [selectedView, isPlusMember]);

  // Reload week start day whenever screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadWeekStartDay();
    }, [])
  );

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

  const loadWeekStartDay = async () => {
    try {
      const saved = await AsyncStorage.getItem(WEEK_START_DAY_KEY);
      if (saved) {
        setWeekStartDay(saved);
      }
    } catch (error) {
      console.log('Error loading week start day:', error);
    }
  };

  // Get current week's days based on week start preference
  const getCurrentWeekDays = (startDay = 'Sunday') => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekStart = new Date(today);

    if (startDay === 'Monday') {
      // Adjust to get Monday (if today is Sunday, go back 6 days, otherwise go back (dayOfWeek - 1))
      weekStart.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    } else {
      // Sunday start: go back dayOfWeek days (if Sunday, go back 0)
      weekStart.setDate(today.getDate() - dayOfWeek);
    }

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // Get current month's weeks based on week start preference
  const getCurrentMonthWeeks = (startDay = 'Sunday') => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Find week start day of the week containing the first day
    const firstDayOfWeek = firstDay.getDay();
    const firstWeekStart = new Date(firstDay);

    if (startDay === 'Monday') {
      // Find Monday (if first day is Sunday, go back 6 days, otherwise go back (dayOfWeek - 1))
      firstWeekStart.setDate(firstDay.getDate() - (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1));
    } else {
      // Find Sunday: go back firstDayOfWeek days
      firstWeekStart.setDate(firstDay.getDate() - firstDayOfWeek);
    }

    const weeks = [];
    let currentWeekStart = new Date(firstWeekStart);

    // Keep adding weeks until we pass the last day of the month
    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6); // Last day of week

      weeks.push({
        start: new Date(currentWeekStart),
        end: weekEnd
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7); // Next week start
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
    const sessions = displayData[dateString] || [];

    // Only count completed sessions (exclude failed sessions from focus time totals)
    const filteredSessions = category === 'All'
      ? sessions.filter(s => s.status === 'completed' || !s.status)
      : sessions.filter(s => (s.status === 'completed' || !s.status) && s.category === category);

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

  // Generate header text based on selected view
  const getHeaderText = () => {
    if (selectedView === 'day') {
      const today = new Date();
      return today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    } else if (selectedView === 'week') {
      const weekDays = getCurrentWeekDays(weekStartDay);
      const firstDay = weekDays[0];
      const lastDay = weekDays[6];

      const firstMonth = firstDay.toLocaleDateString('en-US', { month: 'short' });
      const lastMonth = lastDay.toLocaleDateString('en-US', { month: 'short' });
      const firstDate = firstDay.getDate();
      const lastDate = lastDay.getDate();

      // If week spans two months, show both months
      if (firstMonth !== lastMonth) {
        return `${firstMonth} ${firstDate} - ${lastMonth} ${lastDate}`;
      }
      return `${firstMonth} ${firstDate} - ${lastDate}`;
    } else if (selectedView === 'month') {
      const today = new Date();
      return today.toLocaleDateString('en-US', { month: 'long' });
    } else if (selectedView === 'year') {
      const today = new Date();
      return today.getFullYear().toString();
    }
    return '';
  };

  // Get categories that have sessions within the chart's visible range
  const getCategoriesWithSessions = () => {
    const categoryMap = new Map(); // Map of category name -> category object
    let dates = [];

    // Get dates based on selected view
    if (selectedView === 'day') {
      dates = [new Date()]; // Just today
    } else if (selectedView === 'week') {
      dates = getCurrentWeekDays(weekStartDay);
    } else if (selectedView === 'month') {
      const weeks = getCurrentMonthWeeks(weekStartDay);
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
      const sessions = displayData[dateString] || [];

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

  // Get total sessions based on current view and status (completed or failed)
  const getCompletedSessions = (status = 'completed') => {
    let totalSessions = 0;

    if (selectedView === 'day') {
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const sessions = displayData[dateString] || [];
      const filteredSessions = sessions.filter(s => s.status === status || (!s.status && status === 'completed'));
      totalSessions = filteredSessions.length;
    } else if (selectedView === 'week') {
      const weekDays = getCurrentWeekDays(weekStartDay);
      weekDays.forEach(date => {
        const dateString = date.toISOString().split('T')[0];
        const sessions = displayData[dateString] || [];
        // Filter by status, treating sessions without status as completed for backward compatibility
        const filteredSessions = sessions.filter(s => s.status === status || (!s.status && status === 'completed'));
        totalSessions += filteredSessions.length;
      });
    } else if (selectedView === 'month') {
      const weeks = getCurrentMonthWeeks(weekStartDay);
      weeks.forEach(week => {
        const currentDate = new Date(week.start);
        while (currentDate <= week.end) {
          const dateString = currentDate.toISOString().split('T')[0];
          const sessions = displayData[dateString] || [];
          const filteredSessions = sessions.filter(s => s.status === status || (!s.status && status === 'completed'));
          totalSessions += filteredSessions.length;
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
          const sessions = displayData[dateString] || [];
          const filteredSessions = sessions.filter(s => s.status === status || (!s.status && status === 'completed'));
          totalSessions += filteredSessions.length;
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    }

    return totalSessions;
  };

  if (!fontsLoaded) {
    return null;
  }

  // Build chart data based on selected view
  let chartData = [];
  let barCount = 7; // default for week view

  if (selectedView === 'week') {
    const weekDays = getCurrentWeekDays(weekStartDay);
    chartData = weekDays.map(date => ({
      date,
      label: `${getDayName(date)}\n${getDayNumber(date)}`,
      minutes: getTotalMinutes(date, selectedCategory),
      isToday: isToday(date),
    }));
    barCount = 7;
  } else if (selectedView === 'month') {
    const weeks = getCurrentMonthWeeks(weekStartDay);
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
  const completedSessions = getCompletedSessions('completed');
  const failedSessions = getCompletedSessions('failed');
  const chartHeight = 200;
  const chartWidth = SCREEN_WIDTH - 120;
  const barWidth = chartWidth / barCount - 10;
  const TOP_PADDING = 20; // Padding to prevent label cutoff at top

  // Generate gridline intervals with max 8 gridlines
  const generateGridlines = () => {
    const maxHours = maxMinutes / 60;
    const MAX_GRIDLINES = 8;

    // Preferred intervals in hours - pick smallest that gives <= 8 gridlines
    const preferredIntervals = [0.25, 0.5, 1, 2, 5, 10, 20, 50, 100];
    const interval = preferredIntervals.find(i => maxHours / i <= MAX_GRIDLINES) || 100;

    const gridlines = [];
    const maxValue = Math.ceil(maxHours / interval) * interval;

    for (let value = 0; value <= maxValue; value += interval) {
      gridlines.push(value);
    }

    return { gridlines, maxValue };
  };

  // Calculate gridlines once for consistent scaling
  const { gridlines, maxValue: maxGridHours } = generateGridlines();
  const maxGridMinutes = maxGridHours * 60;

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
            selectedView === 'day' && styles.viewTabActive
          ]}
          onPress={() => setSelectedView('day')}
        >
          <Text style={[
            styles.viewTabText,
            selectedView === 'day' && styles.viewTabTextActive
          ]}>Day</Text>
        </TouchableOpacity>
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

      {/* View Header */}
      <Text style={styles.viewHeader}>{getHeaderText()}</Text>

      {/* Unlock Plus Features Banner - shown for free users viewing premium content */}
      {showPremiumOverlay && (
        <View style={styles.plusInfoContainer}>
          <Text style={styles.plusInfoTitle}>Unlock Plus Features</Text>
          <TouchableOpacity style={styles.upgradeButton} onPress={() => navigation.navigate('Upgrade')}>
            <Text style={styles.upgradeButtonText}>Upgrade to Plus</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chart Section - includes chart and category filter */}
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Successful Focus Time <Text style={styles.sectionTitleUnit}>(hours)</Text></Text>

        {/* Day Summary View */}
        {selectedView === 'day' && (
          <View style={styles.daySummaryContainer}>
            <Text style={styles.daySummaryText}>
              {getTotalMinutes(new Date(), selectedCategory) > 0 ? (
                <>
                  You successfully completed <Text style={styles.daySummaryBold}>{getTotalMinutes(new Date(), selectedCategory)}</Text> minutes of focus today
                </>
              ) : (
                "You haven't completed any focus sessions today"
              )}
            </Text>
          </View>
        )}

        {/* Bar Chart and Category Filter - wrapped for blur effect */}
        {selectedView !== 'day' && (
          <View style={styles.chartWrapper}>
            <View style={styles.chartContainer}>
              <Svg width={chartWidth + 70} height={chartHeight + 80}>
                {/* Grid lines and Y-axis labels (max 8 gridlines) */}
              {gridlines.map((value, index) => {
                const y = TOP_PADDING + chartHeight - (value / maxGridHours) * chartHeight;
                const label = `${value}`;

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
                      x="25"
                      y={y + 5}
                      fill="#8B8B8B"
                      fontSize="10"
                      fontFamily="Poppins_400Regular"
                      textAnchor="end"
                    >
                      {label}
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* Bars */}
              {chartData.map((data, index) => {
                const barHeight = (data.minutes / maxGridMinutes) * chartHeight;
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
            <View style={styles.categoryFilter}>
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
            </View>

            {/* Blur overlay for premium content */}
            {showPremiumOverlay && (
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            )}
          </View>
        )}
      </View>

      {/* Tomitos Section - show if there are any completed or failed sessions */}
      {(completedSessions > 0 || failedSessions > 0) && (
        <View style={styles.tomitosSection}>
          <Text style={styles.tomitosTitle}>Tomitos</Text>

          <View style={styles.tomitosWrapper}>
            {/* Happy Tomitos */}
            {completedSessions > 0 && (
              <View style={styles.tomitosContent}>
                <TomatoCharacter size={44} state={CHARACTER_STATES.COMPLETED} />
                <Text style={styles.tomitosText}>x {completedSessions}</Text>
                <Text style={styles.tomitosText}>Happy Tomitos</Text>
              </View>
            )}

            {/* Rotten Tomitos */}
            {failedSessions > 0 && (
              <View style={styles.tomitosContent}>
                <TomatoCharacter size={44} state={CHARACTER_STATES.ROTTEN} />
                <Text style={styles.tomitosText}>x {failedSessions}</Text>
                <Text style={styles.tomitosText}>Rotten Tomitos</Text>
              </View>
            )}

            {/* Blur overlay for premium content */}
            {showPremiumOverlay && (
              <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
            )}
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  plusInfoContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(156, 39, 176, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
  },
  plusInfoTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_700Bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FFFFFF',
  },
  chartWrapper: {
    position: 'relative',
    overflow: 'hidden',
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
  viewHeader: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  categoryFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: -25,
    alignSelf: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    marginBottom: 16,
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
  daySummaryContainer: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 0,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  daySummaryText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
    textAlign: 'left',
    lineHeight: 24,
  },
  daySummaryBold: {
    fontFamily: 'Poppins_600SemiBold',
  },
  chartSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    marginVertical: 15,
    paddingTop: 20,
    paddingHorizontal: 10,
    paddingLeft: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 0,
    textAlign: 'left',
  },
  sectionTitleUnit: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#8B8B8B',
  },
  tomitosSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    marginVertical: 15,
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'flex-start',
  },
  tomitosWrapper: {
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  tomitosTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#2C3E50',
    marginBottom: 5,
  },
  tomitosContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tomitosText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#2C3E50',
  },
});
