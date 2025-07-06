
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Habit {
  id: string;
  name: string;
  category: string;
  streak: number;
  completed: boolean;
}

interface DeleteHabitDialogProps {
  habit: Habit | null;
  onClose: () => void;
  onConfirm: (habit: Habit) => void;
}

const DeleteHabitDialog = ({ habit, onClose, onConfirm }: DeleteHabitDialogProps) => {
  return (
    <AlertDialog open={habit !== null} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Habit</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{habit?.name}"? This action cannot be undone and will remove all associated data including streaks and completion history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => habit && onConfirm(habit)}
            className="bg-red-600 hover:bg-red-700"
          >
            Delete Habit
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteHabitDialog;
