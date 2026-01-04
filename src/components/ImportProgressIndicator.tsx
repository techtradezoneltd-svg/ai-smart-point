import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImportRowStatus {
  row: number;
  status: "pending" | "processing" | "success" | "error" | "skipped";
  message?: string;
}

export interface ImportProgress {
  totalRows: number;
  processedRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  currentRow: number;
  rows: ImportRowStatus[];
  isComplete: boolean;
}

interface ImportProgressIndicatorProps {
  progress: ImportProgress;
  importType: string;
}

const ImportProgressIndicator = ({ progress, importType }: ImportProgressIndicatorProps) => {
  const percentage = progress.totalRows > 0 
    ? Math.round((progress.processedRows / progress.totalRows) * 100) 
    : 0;

  const getStatusIcon = (status: ImportRowStatus["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "skipped":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-muted" />;
    }
  };

  const getStatusColor = (status: ImportRowStatus["status"]) => {
    switch (status) {
      case "success":
        return "text-success";
      case "error":
        return "text-destructive";
      case "skipped":
        return "text-warning";
      case "processing":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <h3 className="text-lg font-semibold capitalize">
            Importing {importType}
          </h3>
          <p className="text-sm text-muted-foreground">
            Processing {progress.processedRows} of {progress.totalRows} rows
          </p>
        </div>

        {/* Progress Bar */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{percentage}% Complete</span>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-success" />
                {progress.successCount} Success
              </span>
              <span className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-warning" />
                {progress.skippedCount} Skipped
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-destructive" />
                {progress.errorCount} Errors
              </span>
            </div>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>

        {/* Row Status List */}
        <div className="flex-1 overflow-y-auto p-4 max-h-[400px]">
          <div className="space-y-2">
            {progress.rows.map((rowStatus) => (
              <div
                key={rowStatus.row}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-md text-sm transition-all",
                  rowStatus.status === "processing" && "bg-primary/10 border border-primary/20",
                  rowStatus.status === "success" && "bg-success/5",
                  rowStatus.status === "error" && "bg-destructive/5",
                  rowStatus.status === "skipped" && "bg-warning/5",
                  rowStatus.status === "pending" && "opacity-50"
                )}
              >
                {getStatusIcon(rowStatus.status)}
                <span className="font-medium w-16">Row {rowStatus.row}</span>
                <span className={cn("flex-1 truncate", getStatusColor(rowStatus.status))}>
                  {rowStatus.message || (rowStatus.status === "pending" ? "Waiting..." : "Processing...")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {progress.isComplete && (
          <div className="p-4 border-t border-border bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {progress.errorCount === 0 && progress.skippedCount === 0 ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <span className="font-medium text-success">Import completed successfully!</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    <span className="font-medium text-warning">Import completed with issues</span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {progress.successCount} imported, {progress.skippedCount} skipped, {progress.errorCount} failed
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportProgressIndicator;
