
import { NextResponse } from "next/server";
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
      orderBy: { employee: { name: "asc" } },
    });

    const payrolls = records.map((record) => ({
      id: record.id,
      employeeId: record.employee.employeeId,
      name: record.employee.name,
      role: record.employee.role,
      department: record.employee.department,
      month: record.month,
      year: record.year,
      basicSalary: Number(record.basicSalary),
      allowances: Number(record.allowances),
      deductions: Number(record.deductions),
      netSalary: Number(record.netSalary),
      status: record.status,
      paidAt: record.paidAt,
    }));

    const summary = payrolls.reduce(
      (totals, record) => {
        totals.basicSalary += record.basicSalary;
        totals.allowances += record.allowances;
        totals.deductions += record.deductions;
        totals.netSalary += record.netSalary;

        if (record.status === "Paid") {
          totals.paidAmount += record.netSalary;
          totals.paidCount += 1;
        } else {
          totals.unpaidAmount += record.netSalary;
          totals.unpaidCount += 1;
        }

        return totals;
      },
      {
        employeeCount: payrolls.length,
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

    return NextResponse.json(
      { month, year, summary, payrolls },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to generate payroll report:", error);

    return NextResponse.json(
      { error: "Unable to generate the payroll report." },
      { status: 500 }
    );
  }
}

