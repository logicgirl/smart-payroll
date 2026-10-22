
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    // Get payroll records and their employee details.
    const payrolls = await prisma.payroll.findMany({
      include: {
        employee: {
          select: {
            employeeId: true,
            name: true,
            department: true,
            role: true,
          },
        },
      },
      orderBy: [{ year: "asc" }, { month: "asc" }],
    });

    const totalEmployees = await prisma.employee.count();

    // Calculate payroll totals.
    const summary = payrolls.reduce(
      (result, record) => {
        const basicSalary = Number(record.basicSalary);
        const allowances = Number(record.allowances);
        const deductions = Number(record.deductions);
        const netSalary = Number(record.netSalary);

        result.basicSalary += basicSalary;
        result.allowances += allowances;
        result.deductions += deductions;
        result.netSalary += netSalary;

        if (record.status.toLowerCase() === "paid") {
          result.paidCount += 1;
          result.paidAmount += netSalary;
        } else {
          result.unpaidCount += 1;
          result.unpaidAmount += netSalary;
        }

        return result;
      },
      {
        basicSalary: 0,
        allowances: 0,
        deductions: 0,
        netSalary: 0,
        paidCount: 0,
        unpaidCount: 0,
        paidAmount: 0,
        unpaidAmount: 0,
      }
    );

    // Group payroll costs by month.
    const monthlyTotals = new Map<
      string,
      { month: number; year: number; netSalary: number }
    >();

    for (const record of payrolls) {
      const key = `${record.year}-${record.month}`;
      const existing = monthlyTotals.get(key);

      if (existing) {
        existing.netSalary += Number(record.netSalary);
      } else {
        monthlyTotals.set(key, {
          month: record.month,
          year: record.year,
          netSalary: Number(record.netSalary),
        });
      }
    }

    const monthlyTrends = Array.from(monthlyTotals.values()).sort(
      (a, b) => a.year - b.year || a.month - b.month
    );

    // Generate alerts for an administrator to review.
    const alerts: {
      type: "warning" | "info";
      title: string;
      message: string;
    }[] = [];

    if (payrolls.length === 0) {
      alerts.push({
        type: "info",
        title: "No payroll records yet",
        message:
          "Process payroll to start receiving insights based on actual payroll data.",
      });
    }

    if (summary.unpaidCount > 0) {
      alerts.push({
        type: "warning",
        title: "Unpaid payroll records",
        message:
          `${summary.unpaidCount} payroll record(s), totalling ` +
          `₦${summary.unpaidAmount.toLocaleString("en-NG")}, ` +
          "are not marked as paid. Review their payment status.",
      });
    }

    if (monthlyTrends.length >= 2) {
      const current = monthlyTrends[monthlyTrends.length - 1];
      const previous = monthlyTrends[monthlyTrends.length - 2];
      const difference = current.netSalary - previous.netSalary;

      if (previous.netSalary > 0) {
        const percentage =
          (Math.abs(difference) / previous.netSalary) * 100;

        if (percentage >= 20) {
          alerts.push({
            type: "warning",
            title: "Significant monthly payroll change",
            message:
              `Net payroll changed by ${percentage.toFixed(1)}% between ` +
              `${previous.month}/${previous.year} and ` +
              `${current.month}/${current.year}. Review the records to confirm the change is expected.`,
          });
        }
      } else if (current.netSalary > 0) {
        alerts.push({
          type: "info",
          title: "Payroll increased from zero",
          message:
            "The previous month's net payroll was zero. Review the latest records to confirm they are correct.",
        });
      }
    }

    if (payrolls.length > 0 && alerts.length === 0) {
      alerts.push({
        type: "info",
        title: "No immediate issues flagged",
        message:
          "The current checks did not identify any alerts. This does not guarantee that every payroll record is correct.",
      });
    }

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      summary: {
        totalEmployees,
        payrollRecords: payrolls.length,
        ...summary,
      },
      monthlyTrends,
      alerts,
    });
  } catch (error) {
    console.error("Failed to generate payroll insights:", error);

    return NextResponse.json(
      { error: "Unable to generate payroll insights." },
      { status: 500 }
    );
  }
}
