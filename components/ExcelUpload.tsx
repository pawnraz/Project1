import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { ExcelUploadResponse, ExcelRow } from "@/types/excel";

interface ExcelUploadProps {
  onUploadSuccess: (data: ExcelRow[]) => void;
}

export function ExcelUpload({ onUploadSuccess }: ExcelUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
        console.log('no file found');
        return;
    };

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];

    if (!validTypes.includes(file.type)) {
      setError("Please upload a valid Excel file (.xlsx or .xls)");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append("file", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const response = await fetch("/api/excel/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result: ExcelUploadResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.details || "Failed to upload file");
      }

      if (result.data?.records) {
        onUploadSuccess(result.data.records);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while uploading the file");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-4 w-full max-w-md">
      <div className="space-y-2">
        <Input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          disabled={isUploading}
          className="cursor-pointer"
          aria-label="Upload Excel file"
        />
        <p className="text-sm text-muted-foreground">
          Accepted formats: .xlsx, .xls
        </p>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            Uploading and processing file...
          </p>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
