import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ConfirmationContext - Centralized confirmation dialog management
 *
 * Provides a Promise-based API for showing confirmation dialogs without
 * passing functions through navigation params (which causes React Navigation warnings).
 *
 * Usage:
 *   const { openConfirmation } = useConfirmation();
 *   const confirmed = await openConfirmation({
 *     title: 'Confirm Action',
 *     message: 'Are you sure?',
 *     confirmText: 'Yes',
 *     cancelText: 'No',
 *     confirmStyle: 'destructive'
 *   });
 *   if (confirmed) { ... }
 */

const ConfirmationContext = createContext(null);

export function ConfirmationProvider({ children }) {
  const [state, setState] = useState({
    visible: false,
    config: {},
    resolve: null,
  });

  /**
   * Open a confirmation dialog and wait for user response
   * @param {object} config - Confirmation configuration
   * @param {string} config.title - Dialog title (default: 'Confirm')
   * @param {string} config.message - Dialog message
   * @param {string} config.confirmText - Confirm button text (default: 'Confirm')
   * @param {string} config.cancelText - Cancel button text (default: 'Cancel')
   * @param {string} config.confirmStyle - 'default' or 'destructive' (default: 'default')
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  const openConfirmation = useCallback((config) => {
    return new Promise((resolve) => {
      setState({
        visible: true,
        config: {
          title: config.title || 'Confirm',
          message: config.message || '',
          confirmText: config.confirmText || 'Confirm',
          cancelText: config.cancelText || 'Cancel',
          confirmStyle: config.confirmStyle || 'default',
        },
        resolve,
      });
    });
  }, []);

  /**
   * Handle confirm action
   */
  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState({ visible: false, config: {}, resolve: null });
  }, [state.resolve]);

  /**
   * Handle cancel action
   */
  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState({ visible: false, config: {}, resolve: null });
  }, [state.resolve]);

  const value = {
    openConfirmation,
    handleConfirm,
    handleCancel,
    visible: state.visible,
    config: state.config,
  };

  return (
    <ConfirmationContext.Provider value={value}>
      {children}
    </ConfirmationContext.Provider>
  );
}

/**
 * Hook to access confirmation manager
 * @returns {object} Confirmation manager API
 */
export function useConfirmation() {
  const context = useContext(ConfirmationContext);
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider');
  }
  return context;
}
