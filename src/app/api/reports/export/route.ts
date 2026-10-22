
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12 ||
      !Number.isInteger(year) ||
      year < 2000 ||
      year > 2100
    ) {
      return NextResponse.json(
        { error: "Provide a valid month and year." },
        { status: 400 }
      );
    }

    const records = await prisma.payroll.findMany({
      where: { month, year },
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
            role: true,
            department: true,
          },
        },
      },
      orderBy: {
        employee: { name: "asc" },
      },
    });

    const payrollRows = records.map((record) => ({
      "Employee ID": record.employee.employeeId,
      "Employee Name": record.employee.name,
      Role: record.employee.role,
      Department: record.employee.department,
      Month: month,
      Year: year,
      "Basic Salary (NGN)": Number(record.basicSalary),
      "Allowances (NGN)": Number(record.allowances),
      "Deductions (NGN)": Number(record.deductions),
      "Net Salary (NGN)": Number(record.netSalary),
      "Payment Status": record.status,
      "Paid Date": record.paidAt
        ? new Date(record.paidAt).toLocaleDateString("en-NG")
        : "",
    }));

    const payrollSheet = XLSX.utils.json_to_sheet(payrollRows);

    payrollSheet["!cols"] = [
      { wch: 16 },
      { wch: 24 },
      { wch: 20 },
      { wch: 20 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 16 },
    ];

    const totals = records.reduce(
      (summary, record) => {
        const basicSalary = Number(record.basicSalary);
        const allowances = Number(record.allowances);
        const deductions = Number(record.deductions);
        const netSalary = Number(record.netSalary);

        summary.basicSalary += basicSalary;
        summary.allowances += allowances;
        summary.deductions += deductions;
        summary.netSalary += netSalary;

        if (record.status === "Paid") {
          summary.paidAmount += netSalary;
          summary.paidCount += 1;
        } else {
          summary.unpaidAmount += netSalary;
          summary.unpaidCount += 1;
        }

        return summary;
      },
      {
        employeeCount: records.length,
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 0,
        paidAmount: 0,
        unpaidAmount: 0,
        paidCount: 0,
        unpaidCount: 0,
      }
    );

    const summarySheet = XLSX.utils.aoa_to_sheet([
      ["SmartPayroll Payroll Report"],
      ["Report Month", month],
      ["Report Year", year],
      [],
      ["Summary", "Value"],
      ["Total Employees", totals.employeeCount],
      ["Total Basic Salary (NGN)", totals.basicSalary],
      ["Total Allowances (NGN)", totals.allowances],
      ["Total Deductions (NGN)", totals.deductions],
      ["Total Net Salary (NGN)", totals.netSalary],
      ["Paid Employees", totals.paidCount],
      ["Unpaid Employees", totals.unpaidCount],
      ["Total Amount Paid (NGN)", totals.paidAmount],
      ["Total Amount Unpaid (NGN)", totals.unpaidAmount],
    ]);

    summarySheet["!cols"] = [
      { wch: 30 },
      { wch: 22 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Payroll Summary"
    );

    XLSX.utils.book_append_sheet(
      workbook,
      payrollSheet,
      "Payroll Details"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "buffer",
    });

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition":
          `attachment; filename="SmartPayroll-${month}-${year}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to export payroll report:", error);

    return NextResponse.json(
      { error: "Unable to export the payroll report." },
      { status: 500 }
    );
  }
}
