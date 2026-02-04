// src/components/common/WarningDialog.tsx
import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface WarningDialogProps {
  isOpen: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
  confirmButtonColor?: string;
}

export const WarningDialog: React.FC<WarningDialogProps> = ({
  isOpen,
  title = "Warning",
  description = "Are you sure you want to continue this action?",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
  onConfirm,
  onCancel,
  children,
  confirmButtonColor = "bg-yellow-600 hover:bg-yellow-700",
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent
        className="bg-white border border-gray-200 shadow-lg z-50 max-h-[80vh] overflow-y-auto"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-yellow-600">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {children && (
          <div className="py-2">
            {children}
          </div>
        )}

        <AlertDialogFooter className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg mt-4">
          <AlertDialogCancel
            onClick={onCancel}
            disabled={isLoading}
            className="bg-white border-gray-300"
          >
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={`text-white ${confirmButtonColor}`}
          >
            {isLoading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
