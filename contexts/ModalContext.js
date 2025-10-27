import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * ModalContext - Centralized modal state management
 *
 * Provides a stack-based modal manager that allows:
 * - Opening modals from anywhere in the app
 * - Proper modal stacking (modals can open other modals)
 * - Automatic z-index handling
 * - Simple API: openModal(name, params) and closeModal()
 */

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  // Stack of active modals: [{ name: 'CategorySelection', params: {...} }, ...]
  const [modalStack, setModalStack] = useState([]);

  /**
   * Open a modal and add it to the stack
   * @param {string} name - Modal name (e.g., 'CategorySelection')
   * @param {object} params - Parameters to pass to the modal
   */
  const openModal = useCallback((name, params = {}) => {
    setModalStack(prev => [...prev, { name, params }]);
  }, []);

  /**
   * Close the top-most modal
   */
  const closeModal = useCallback(() => {
    setModalStack(prev => prev.slice(0, -1));
  }, []);

  /**
   * Close a specific modal by name
   * @param {string} name - Modal name to close
   */
  const closeModalByName = useCallback((name) => {
    setModalStack(prev => prev.filter(modal => modal.name !== name));
  }, []);

  /**
   * Close all modals
   */
  const closeAllModals = useCallback(() => {
    setModalStack([]);
  }, []);

  /**
   * Check if a specific modal is open
   * @param {string} name - Modal name
   * @returns {boolean}
   */
  const isModalOpen = useCallback((name) => {
    return modalStack.some(modal => modal.name === name);
  }, [modalStack]);

  /**
   * Get parameters for a specific modal
   * @param {string} name - Modal name
   * @returns {object|null}
   */
  const getModalParams = useCallback((name) => {
    const modal = modalStack.find(m => m.name === name);
    return modal ? modal.params : null;
  }, [modalStack]);

  /**
   * Check if a modal is the top-most (currently visible) modal
   * @param {string} name - Modal name
   * @returns {boolean}
   */
  const isTopModal = useCallback((name) => {
    if (modalStack.length === 0) return false;
    return modalStack[modalStack.length - 1].name === name;
  }, [modalStack]);

  const value = {
    modalStack,
    openModal,
    closeModal,
    closeModalByName,
    closeAllModals,
    isModalOpen,
    getModalParams,
    isTopModal,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

/**
 * Hook to access modal manager
 * @returns {object} Modal manager API
 */
export function useModalManager() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalManager must be used within a ModalProvider');
  }
  return context;
}

/**
 * Hook for a specific modal to get its visibility and params
 * @param {string} modalName - Name of the modal
 * @returns {object} { visible, params, close, isTop }
 */
export function useModal(modalName) {
  const { isModalOpen, getModalParams, closeModal, isTopModal } = useModalManager();

  return {
    visible: isModalOpen(modalName),
    params: getModalParams(modalName) || {},
    close: closeModal,
    isTop: isTopModal(modalName),
  };
}
