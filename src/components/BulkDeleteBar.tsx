import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";
import { useState } from "react";

interface BulkDeleteBarProps {
  selectedCount: number;
  onDelete: () => Promise<void>;
  onClear: () => void;
  itemLabel?: string;
}

const BulkDeleteBar = ({ selectedCount, onDelete, onClear, itemLabel = "items" }: BulkDeleteBarProps) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (selectedCount === 0) return null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 animate-in slide-in-from-top-2">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} {itemLabel} selected
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onClear}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} {itemLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {selectedCount} {itemLabel} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : `Delete ${selectedCount} ${itemLabel}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BulkDeleteBar;
