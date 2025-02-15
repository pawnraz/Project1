"use client";

import { useState } from "react";
import { ExcelUpload } from "@/components/ExcelUpload";
import { ExcelDataDisplay } from "@/components/ExcelDataDisplay";
import { ExcelRow } from "@/types/excel";

export default function Home() {
  const [uploadedData, setUploadedData] = useState<ExcelRow[]>([]);

  const handleUploadSuccess = (data: ExcelRow[]) => {
    setUploadedData(data);
  };

  return (
    <main className="container mx-auto py-8 space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <h1 className="text-2xl font-bold">Excel File Upload</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Upload an Excel file (.xlsx or .xls) containing columns for name,
          institution name, and email.
        </p>
      </div>

      <div className="flex flex-col items-center space-y-8">
        <ExcelUpload onUploadSuccess={handleUploadSuccess} />
        <ExcelDataDisplay data={uploadedData} />
      </div>
    </main>
  );
}
