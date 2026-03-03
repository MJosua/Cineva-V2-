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

interface DeleteServiceDialogProps {
  isOpen: boolean;
  serviceName: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteServiceDialog: React.FC<DeleteServiceDialogProps> = ({
  isOpen,
  serviceName,
  isDeleting,
  onConfirm,
  onCancel
}) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      // Ensure closing via ESC or overlay also triggers onCancel
      if (!open) onCancel();
    }}>
      <AlertDialogContent
        onOverlayClick={onCancel} // custom prop passed to AlertDialogOverlay inside your AlertDialogContent
        className="bg-white border border-gray-200 shadow-lg z-50"
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">
            Delete Service Catalog
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600">
            Are you sure you want to delete "<strong>{serviceName}</strong>"? This action cannot be undone and will remove the service form and all its configurations.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-white border-gray-300"
            disabled={isDeleting}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
