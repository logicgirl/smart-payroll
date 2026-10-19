
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isPrismaError(
  error: unknown,
  code: string
): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === code
  );
}

// PUT: Update an existing employee in PostgreSQL
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const employeeId =
      typeof body.employeeId === "string"
        ? body.employeeId.trim()
        : "";

    const name =
      typeof body.name === "string" ? body.name.trim() : "";

    const role =
      typeof body.role === "string" ? body.role.trim() : "";

    const department =
      typeof body.department === "string"
        ? body.department.trim()
        : "";

    const salaryValue = body.salary;

    if (
      !id ||
      !employeeId ||
      !name ||
      !role ||
      !department ||
      salaryValue === undefined ||
      salaryValue === null ||
      salaryValue === ""
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide employee ID, name, role, department, and salary.",
        },
        { status: 400 }
      );
    }

    const salary = Number(salaryValue);

    if (
      !Number.isFinite(salary) ||
      salary < 0 ||
      salary > 9999999999.99
    ) {
      return NextResponse.json(
        { error: "Please provide a valid, non-negative salary." },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        employeeId,
        name,
        role,
        department,
        salary,
      },
    });

    return NextResponse.json(employee, { status: 200 });
  } catch (error) {
    if (isPrismaError(error, "P2002")) {
      return NextResponse.json(
        {
          error:
            "That employee ID already exists. Please use a unique ID.",
        },
        { status: 409 }
      );
    }

    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    console.error("Failed to update employee:", error);

    return NextResponse.json(
      { error: "Unable to update employee." },
      { status: 500 }
    );
  }
}

// DELETE: Remove an employee from PostgreSQL
export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "An employee ID is required." },
        { status: 400 }
      );
    }

    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Employee deleted successfully." },
      { status: 200 }
    );
  } catch (error) {
    if (isPrismaError(error, "P2025")) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    console.error("Failed to delete employee:", error);

    return NextResponse.json(
      { error: "Unable to delete employee." },
      { status: 500 }
    );
  }
}
