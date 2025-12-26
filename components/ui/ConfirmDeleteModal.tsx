'use client'

import React from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDeleteModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
}) => {
  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      closeOnBackdropClick={!isLoading}
      closeOnEscape={!isLoading}
    >
      <div className="space-y-4">
        <p className="text-gray-700">{message}</p>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white"
          >
            {isLoading ? 'Deleting...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

ConfirmDeleteModal.displayName = 'ConfirmDeleteModal'
