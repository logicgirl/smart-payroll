
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getPositiveInteger(value: unknown): number | null {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 1) {
    return null;
  }

  return number;
}

// GET: Retrieve payroll records from PostgreSQL
export async function GET() {
  try {
    const payrolls = await prisma.payroll.findMany({
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
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return NextResponse.json(payrolls, { status: 200 });
  } catch (error) {
    console.error("Failed to retrieve payroll:", error);

    return NextResponse.json(
      { error: "Unable to retrieve payroll records." },
      { status: 500 }
    );
  }
}

// POST: Generate payroll for all employees for a selected month
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const month = getPositiveInteger(body.month);
    const year = getPositiveInteger(body.year);

    if (
      !month ||
      month > 12 ||
      !year ||
      year < 2000 ||
      year > 2100
    ) {
      return NextResponse.json(
        { error: "Provide a valid month (1–12) and year." },
        { status: 400 }
      );
    }

    const allowances = Number(body.allowances ?? 0);
    const deductions = Number(body.deductions ?? 0);

    if (
      !Number.isFinite(allowances) ||
      !Number.isFinite(deductions) ||
      allowances < 0 ||
      deductions < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Allowances and deductions must be valid, non-negative amounts.",
        },
        { status: 400 }
      );
    }

    const payrolls = await prisma.$transaction(async (tx) => {
      const employees = await tx.employee.findMany({
        orderBy: { name: "asc" },
      });

      if (employees.length === 0) {
        throw new Error("NO_EMPLOYEES");
      }

      const existingPayrolls = await tx.payroll.findMany({
        where: { month, year },
        select: { employeeId: true },
      });

      const existingIds = new Set(
        existingPayrolls.map((item) => item.employeeId)
      );

      const employeesToProcess = employees.filter(
        (employee) => !existingIds.has(employee.id)
      );

      if (employeesToProcess.length === 0) {
        throw new Error("PAYROLL_ALREADY_EXISTS");
      }

      const records = employeesToProcess.map((employee) => {
        const basicSalary = Number(employee.salary);
        const netSalary = basicSalary + allowances - deductions;

        if (!Number.isFinite(netSalary) || netSalary < 0) {
          throw new Error("INVALID_NET_SALARY");
        }

        return {
          employeeId: employee.id,
          month,
          year,
          basicSalary,
          allowances,
          deductions,
          netSalary,
          status: "Pending",
        };
      });

      await tx.payroll.createMany({ data: records });

      return tx.payroll.findMany({
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
        orderBy: { createdAt: "desc" },
      });
    });

    return NextResponse.json(
      {
        message: "Payroll generated successfully.",
        payrolls,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "NO_EMPLOYEES") {
      return NextResponse.json(
        { error: "Add employees before generating payroll." },
        { status: 400 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "PAYROLL_ALREADY_EXISTS"
    ) {
      return NextResponse.json(
        {
          error: "Payroll already exists for all employees in this period.",
        },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_NET_SALARY"
    ) {
      return NextResponse.json(
        {
          error:
            "Deductions cannot exceed basic salary plus allowances.",
        },
        { status: 400 }
      );
    }

    console.error("Failed to generate payroll:", error);

    return NextResponse.json(
      { error: "Unable to generate payroll." },
      { status: 500 }
    );
  }
}
