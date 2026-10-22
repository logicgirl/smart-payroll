
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const nextStatus = body?.status;

    if (
      !id ||
      (nextStatus !== "Approved" && nextStatus !== "Paid")
    ) {
      return NextResponse.json(
        { error: "Provide a valid payroll ID and status." },
        { status: 400 }
      );
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!payroll) {
      return NextResponse.json(
        { error: "Payroll record not found." },
        { status: 404 }
      );
    }

    if (
      nextStatus === "Approved" &&
      payroll.status !== "Pending"
    ) {
      return NextResponse.json(
        { error: "Only pending payroll can be approved." },
        { status: 409 }
      );
    }

    if (
      nextStatus === "Paid" &&
      payroll.status !== "Approved"
    ) {
      return NextResponse.json(
        { error: "Approve the payroll before marking it as paid." },
        { status: 409 }
      );
    }

    const result = await prisma.payroll.updateMany({
      where: {
        id,
        status: payroll.status,
      },
      data:
        nextStatus === "Paid"
          ? {
              status: "Paid",
              paidAt: new Date(),
            }
          : {
              status: "Approved",
              paidAt: null,
            },
    });

    if (result.count === 0) {
      return NextResponse.json(
        {
          error:
            "This payroll record has changed. Refresh and try again.",
        },
        { status: 409 }
      );
    }

    const updatedPayroll = await prisma.payroll.findUnique({
      where: { id },
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
    });

    if (!updatedPayroll) {
      return NextResponse.json(
        { error: "Updated payroll record could not be found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        nextStatus === "Approved"
          ? "Payroll approved successfully."
          : "Payment recorded successfully.",
      payroll: updatedPayroll,
    });
  } catch (error) {
    console.error("Payroll status update failed:", error);

    return NextResponse.json(
      { error: "Unable to update payroll status." },
      { status: 500 }
    );
  }
}
