import { NextRequest, NextResponse } from "next/server";
import { parseExcelFile } from "@/utils/excel";
import { ExcelUploadResponse } from "@/types/excel";

export async function POST(request: NextRequest): Promise<NextResponse<ExcelUploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        {
          status: "error",
          message: "No file provided",
          error: { details: "Please upload an Excel file" }
        },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel"
    ];
    
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid file type",
          error: { details: "Please upload a valid Excel file (.xlsx or .xls)" }
        },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse Excel file
    const result = await parseExcelFile(buffer);

    if (result.errors) {
      return NextResponse.json(
        {
          status: "error",
          message: "Validation errors found in Excel file",
          error: { 
            details: `Found ${result.errors.length} validation errors. Please check the data and try again.`
          }
        },
        { status: 400 }
      );
    }

    if (!result.data || result.data.length === 0) {
      return NextResponse.json(
        {
          status: "error",
          message: "No valid data found",
          error: { details: "The Excel file contains no valid data" }
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: "success",
        message: "Excel file processed successfully",
        data: {
          records: result.data,
          totalRecords: result.data.length
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to process Excel file",
        error: {
          details: error instanceof Error ? error.message : "Unknown error occurred"
        }
      },
      { status: 500 }
    );
  }
}
