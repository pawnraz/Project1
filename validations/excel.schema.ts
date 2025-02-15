import { z } from "zod";

export const excelRowSchema = z.object({
  name: z.string().min(1, "Name is required"),
  institutionName: z.string().min(1, "Institution name is required"),
  email: z.string().email("Invalid email format")
});

export const excelUploadSchema = z.object({
  records: z.array(excelRowSchema)
    .min(1, "Excel file must contain at least one row of data")
    .max(1000, "Excel file cannot contain more than 1000 rows")
});

export type ExcelRowSchema = z.infer<typeof excelRowSchema>;
export type ExcelUploadSchema = z.infer<typeof excelUploadSchema>;
