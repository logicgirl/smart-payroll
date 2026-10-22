
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// GET: List all employees
export async function GET() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(employees, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch employees:", error);

    return NextResponse.json(
      { error: "Unable to load employees." },
      { status: 500 }
    );
  }
}

// POST: Add a new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const employeeId =
      typeof body.employeeId === "string"
        ? body.employeeId.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const role =
      typeof body.role === "string"
        ? body.role.trim()
        : "";

    const department =
      typeof body.department === "string"
        ? body.department.trim()
        : "";

    const salaryValue = body.salary;

    if (
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
        {
          error: "Please provide a valid, non-negative salary.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        employeeId,
        name,
        role,
        department,
        salary,
      },
    });

    return NextResponse.json(
      {
        message: "Employee added successfully.",
        employee,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        {
          error:
            "That employee ID already exists. Please use a unique ID.",
        },
        { status: 409 }
      );
    }

    console.error("Failed to create employee:", error);

    return NextResponse.json(
      { error: "Unable to add employee." },
      { status: 500 }
    );
  }
}
