
"use client";

import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

type Employee = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  salary: string | number;
  status: string;
};

type PayrollRecord = {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  basicSalary: string | number;
  allowances: string | number;
  deductions: string | number;
  netSalary: string | number;
  status: string;
  paidAt: string | null;
  employee: {
    employeeId: string;
    name: string;
    role: string;
    department: string;
  };
};

const menuItems = [
  { name: "Dashboard", icon: "▦" },
  { name: "Employees", icon: "♙" },
  { name: "Payroll", icon: "₦" },
  { name: "Departments", icon: "▤" },
  { name: "Reports", icon: "▥" },
  { name: "AI Insights", icon: "✧" },
  { name: "Settings", icon: "⚙" },
];

const departments = [
  "Finance",
  "IT",
  "Human Resources",
  "Academic",
  "Marketing",
  "Administration",
  "Operations",
  "Other",
];

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getSalary(employee: Employee) {
  return Number(employee.salary);
}

function getMoney(value: string | number) {
  return Number(value);
}

export default function Home() {
  const now = new Date();

  const [activeMenu, setActiveMenu] = useState("Dashboard");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<Employee | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] =
    useState<"success" | "error">("success");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payrollLoading, setPayrollLoading] = useState(false);
  const [generatingPayroll, setGeneratingPayroll] = useState(false);

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Finance");
  const [salary, setSalary] = useState("");

  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [allowances, setAllowances] = useState("0");
  const [deductions, setDeductions] = useState("0");

  const loadEmployees = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/employees", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load employees.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected employee API response.");
      }

      setEmployees(data);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayroll = useCallback(async () => {
    setPayrollLoading(true);

    try {
      const response = await fetch("/api/payroll", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load payroll.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Unexpected payroll API response.");
      }

      setPayrolls(data);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load payroll records."
      );
    } finally {
      setPayrollLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (activeMenu === "Payroll") {
      void loadPayroll();
    }
  }, [activeMenu, loadPayroll]);

  const totalPayroll = employees.reduce(
    (total, employee) => total + getSalary(employee),
    0
  );

  const paidCount = employees.filter(
    (employee) => employee.status === "Paid"
  ).length;

  const pendingCount = employees.filter(
    (employee) => employee.status !== "Paid"
  ).length;

  const filteredEmployees = employees.filter((employee) =>
    `${employee.name} ${employee.employeeId} ${employee.role} ${employee.department}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const selectedPayrolls = payrolls.filter(
    (record) =>
      record.month === payrollMonth &&
      record.year === payrollYear
  );

  const selectedPayrollTotal = selectedPayrolls.reduce(
    (total, record) => total + getMoney(record.netSalary),
    0
  );

  const selectedPaidCount = selectedPayrolls.filter(
    (record) => record.status === "Paid"
  ).length;

  const selectedPendingCount = selectedPayrolls.filter(
    (record) => record.status !== "Paid"
  ).length;

  function resetForm() {
    setName("");
    setEmployeeId("");
    setRole("");
    setDepartment("Finance");
    setSalary("");
    setEditingEmployee(null);
    setShowForm(false);
  }

  function openSection(section: string) {
    setActiveMenu(section);
    setMessage("");
    resetForm();
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
    setMessage("");
  }

  function startEditing(employee: Employee) {
    setEditingEmployee(employee);
    setName(employee.name);
    setEmployeeId(employee.employeeId);
    setRole(employee.role);
    setDepartment(employee.department);
    setSalary(String(employee.salary));
    setShowForm(true);
    setMessage("");
  }

  async function handleSaveEmployee(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanId = employeeId.trim().toUpperCase();
    const cleanRole = role.trim();
    const salaryAmount = Number(salary);

    if (
      !cleanName ||
      !cleanId ||
      !cleanRole ||
      !department ||
      !salary.trim()
    ) {
      setMessageType("error");
      setMessage("Please complete all employee fields.");
      return;
    }

    if (!Number.isFinite(salaryAmount) || salaryAmount <= 0) {
      setMessageType("error");
      setMessage("Enter a valid monthly salary greater than zero.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const isEditing = editingEmployee !== null;

      const response = await fetch(
        isEditing
          ? `/api/employees/${encodeURIComponent(editingEmployee.id)}`
          : "/api/employees",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: cleanId,
            name: cleanName,
            role: cleanRole,
            department,
            salary: salaryAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (isEditing
              ? "Unable to update employee."
              : "Unable to save employee.")
        );
      }

      if (isEditing) {
        setEmployees((current) =>
          current.map((employee) =>
            employee.id === data.id ? (data as Employee) : employee
          )
        );
      } else {
        setEmployees((current) => [data as Employee, ...current]);
      }

      resetForm();
      setSearch("");
      setMessageType("success");
      setMessage(
        isEditing
          ? `${cleanName}'s details have been updated successfully.`
          : `${cleanName} has been saved to the database.`
      );
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to save employee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${employee.name} (${employee.employeeId})?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(employee.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/employees/${encodeURIComponent(employee.id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete employee.");
      }

      setEmployees((current) =>
        current.filter((item) => item.id !== employee.id)
      );

      if (editingEmployee?.id === employee.id) {
        resetForm();
      }

      setMessageType("success");
      setMessage(`${employee.name} has been deleted from the database.`);
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error ? error.message : "Unable to delete employee."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleGeneratePayroll(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setMessage("");

    const allowanceAmount = Number(allowances);
    const deductionAmount = Number(deductions);

    if (
      !Number.isFinite(allowanceAmount) ||
      !Number.isFinite(deductionAmount) ||
      allowanceAmount < 0 ||
      deductionAmount < 0
    ) {
      setMessageType("error");
      setMessage("Allowances and deductions must be valid non-negative amounts.");
      return;
    }

    if (employees.length === 0) {
      setMessageType("error");
      setMessage("Add employees before generating payroll.");
      return;
    }

    setGeneratingPayroll(true);

    try {
      const response = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month: payrollMonth,
          year: payrollYear,
          allowances: allowanceAmount,
          deductions: deductionAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate payroll.");
      }

      setPayrolls(data.payrolls as PayrollRecord[]);
      setMessageType("success");
      setMessage(data.message || "Payroll generated successfully.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while generating payroll."
      );
    } finally {
      setGeneratingPayroll(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 md:flex">
      <aside className="flex w-full shrink-0 flex-col bg-slate-950 p-5 text-white md:min-h-screen md:w-64">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400 text-xl font-bold text-slate-950">
            S
          </div>
          <div>
            <h1 className="text-lg font-bold">SmartPayroll</h1>
            <p className="text-xs text-slate-400">Management System</p>
          </div>
        </div>

        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          Workspace
        </p>

        <nav className="flex flex-wrap gap-2 md:flex-col">
          {menuItems.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => openSection(item.name)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                activeMenu === item.name
                  ? "bg-emerald-400 font-semibold text-slate-950"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span className="w-5 text-center text-lg">{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900 p-4 md:mt-auto">
          <div className="mb-2 text-xl">✧</div>
          <p className="font-semibold">AI Payroll Assistant</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Future AI features will help identify unusual payroll figures
            and forecast workforce costs.
          </p>
          <button
            type="button"
            onClick={() => openSection("AI Insights")}
            className="mt-4 w-full rounded-lg bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600"
          >
            Explore AI Insights
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">
              Workspace / {activeMenu}
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
              {activeMenu === "Dashboard" ? "Payroll Dashboard" : activeMenu}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage employee records and monitor payroll information.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
              AD
            </div>
            <div>
              <p className="text-sm font-semibold">Administrator</p>
              <p className="text-xs text-slate-500">Payroll Manager</p>
            </div>
          </div>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Employees</p>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "…" : employees.length}
            </p>
            <p className="mt-2 text-xs text-emerald-700">Registered employees</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Monthly Payroll</p>
            <p className="mt-3 text-2xl font-bold">
              {loading ? "…" : formatNaira(totalPayroll)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Total listed monthly salaries
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Payments Completed</p>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "…" : paidCount}
            </p>
            <p className="mt-2 text-xs text-emerald-700">Employee status summary</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Payments Pending</p>
            <p className="mt-3 text-3xl font-bold">
              {loading ? "…" : pendingCount}
            </p>
            <p className="mt-2 text-xs text-amber-700">Employee status summary</p>
          </div>
        </section>

        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`mb-5 rounded-xl border p-4 text-sm ${
              messageType === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message}
          </div>
        )}

        {activeMenu === "Dashboard" && (
          <>
            <section className="mb-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-sm xl:col-span-2">
                <p className="text-sm text-emerald-100">Payroll workspace</p>
                <h3 className="mt-2 text-2xl font-bold">
                  Manage payroll with confidence
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50">
                  Organise employee records, review salary information, and
                  prepare your payroll workflow in one place.
                </p>
                <button
                  type="button"
                  onClick={() => openSection("Employees")}
                  className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  Manage Employees
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold">Payroll Checklist</h3>
                <p className="mt-1 text-sm text-slate-500">Monthly workflow</p>
                <div className="mt-5 space-y-4 text-sm">
                  <p>✓ Review employee records</p>
                  <p>2. Verify salary calculations</p>
                  <p>3. Approve payroll</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold">Getting Started</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Register employees first, then open Payroll to generate saved
                payroll records for a selected month.
              </p>
              <button
                type="button"
                onClick={() => openSection("Payroll")}
                className="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Open Payroll
              </button>
            </section>
          </>
        )}

        {activeMenu === "Employees" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-bold">Employee Management</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Register employees and manage their basic payroll details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (showForm) {
                    resetForm();
                    setMessage("");
                  } else {
                    openAddForm();
                  }
                }}
                className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {showForm ? "Cancel Form" : "+ Add Employee"}
              </button>
            </div>

            {showForm && (
              <form
                onSubmit={handleSaveEmployee}
                className="mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <h4 className="mb-4 font-bold">
                  {editingEmployee
                    ? `Edit Employee: ${editingEmployee.name}`
                    : "New Employee Details"}
                </h4>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Full Name
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="e.g. John Okoro"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Employee ID
                    <input
                      required
                      value={employeeId}
                      onChange={(event) => setEmployeeId(event.target.value)}
                      placeholder="e.g. EMP001"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Job Title
                    <input
                      required
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                      placeholder="e.g. Teacher"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Department
                    <select
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500"
                    >
                      {departments.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium sm:col-span-2">
                    Monthly Salary (₦)
                    <input
                      required
                      type="number"
                      min="1"
                      step="0.01"
                      value={salary}
                      onChange={(event) => setSalary(event.target.value)}
                      placeholder="e.g. 250000"
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? editingEmployee
                        ? "Updating..."
                        : "Saving..."
                      : editingEmployee
                        ? "Save Changes"
                        : "Save Employee"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={resetForm}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="mb-5">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name, ID, job title or department..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 sm:max-w-md"
              />
            </div>

            <p className="mb-4 text-sm text-slate-500">
              {loading
                ? "Loading employees..."
                : `Showing ${filteredEmployees.length} of ${employees.length} employees`}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4 font-semibold">Employee</th>
                    <th className="px-5 py-4 font-semibold">Department</th>
                    <th className="px-5 py-4 font-semibold">Monthly Salary</th>
                    <th className="px-5 py-4 font-semibold">Payment Status</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-semibold">{employee.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {employee.employeeId} · {employee.role}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {employee.department}
                      </td>
                      <td className="px-5 py-4 font-medium">
                        {formatNaira(getSalary(employee))}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            employee.status === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {employee.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={saving || deletingId !== null || loading}
                            onClick={() => startEditing(employee)}
                            className="rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={saving || deletingId !== null || loading}
                            onClick={() => void handleDeleteEmployee(employee)}
                            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingId === employee.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                        {employees.length === 0
                          ? "No employees saved yet. Use Add Employee to register your first employee."
                          : "No employees match your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              Employee records are loaded from PostgreSQL. Adding, editing,
              and deleting employees uses the SmartPayroll API.
            </p>

            <button
              type="button"
              onClick={() => void loadEmployees()}
              disabled={loading || saving || deletingId !== null}
              className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
            >
              {loading ? "Refreshing..." : "Refresh employees"}
            </button>
          </section>
        )}

        {activeMenu === "Payroll" && (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h3 className="text-xl font-bold">Generate Payroll</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Prepare salary records for a month. The allowance and
                deduction amounts below are applied to each employee in this
                payroll run. Generated records start as Pending.
              </p>

              <form onSubmit={handleGeneratePayroll} className="mt-6 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Payroll Month
                    <select
                      value={payrollMonth}
                      onChange={(event) => setPayrollMonth(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                    >
                      {months.map((month, index) => (
                        <option key={month} value={index + 1}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="text-sm font-medium">
                    Payroll Year
                    <input
                      type="number"
                      required
                      min="2000"
                      max="2100"
                      value={payrollYear}
                      onChange={(event) => setPayrollYear(Number(event.target.value))}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Allowance per Employee (₦)
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={allowances}
                      onChange={(event) => setAllowances(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                    />
                  </label>

                  <label className="text-sm font-medium">
                    Deduction per Employee (₦)
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={deductions}
                      onChange={(event) => setDeductions(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-emerald-500"
                    />
                  </label>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  <p>
                    <strong>Calculation:</strong> Basic salary + allowance −
                    deduction = net salary.
                  </p>
                  <p className="mt-1">
                    Current employees: <strong>{employees.length}</strong>
                  </p>
                  <p className="mt-1">
                    Records already generated for this period:{" "}
                    <strong>{selectedPayrolls.length}</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    generatingPayroll ||
                    loading ||
                    employees.length === 0 ||
                    payrollYear < 2000 ||
                    payrollYear > 2100
                  }
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {generatingPayroll ? "Generating..." : "Generate Payroll"}
                </button>
              </form>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Payroll Employees</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrollLoading ? "…" : selectedPayrolls.length}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {months[payrollMonth - 1]} {payrollYear}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Net Payroll</p>
                <p className="mt-3 text-xl font-bold">
                  {payrollLoading ? "…" : formatNaira(selectedPayrollTotal)}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Saved net salaries for this period
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Marked Paid</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrollLoading ? "…" : selectedPaidCount}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  Payroll payment status
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrollLoading ? "…" : selectedPendingCount}
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Awaiting payment
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xl font-bold">Payroll Records</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Saved payroll data retrieved from PostgreSQL.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadPayroll()}
                  disabled={payrollLoading || generatingPayroll}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
                >
                  {payrollLoading ? "Refreshing..." : "Refresh Payroll"}
                </button>
              </div>

              {payrollLoading ? (
                <p className="py-8 text-center text-sm text-slate-500">
                  Loading payroll records...
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1050px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-semibold">Employee</th>
                        <th className="px-4 py-4 font-semibold">Period</th>
                        <th className="px-4 py-4 font-semibold">Basic Salary</th>
                        <th className="px-4 py-4 font-semibold">Allowance</th>
                        <th className="px-4 py-4 font-semibold">Deduction</th>
                        <th className="px-4 py-4 font-semibold">Net Salary</th>
                        <th className="px-4 py-4 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPayrolls.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-semibold">{record.employee.name}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {record.employee.employeeId} · {record.employee.department}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {months[record.month - 1]} {record.year}
                          </td>
                          <td className="px-4 py-4">
                            {formatNaira(getMoney(record.basicSalary))}
                          </td>
                          <td className="px-4 py-4">
                            {formatNaira(getMoney(record.allowances))}
                          </td>
                          <td className="px-4 py-4">
                            {formatNaira(getMoney(record.deductions))}
                          </td>
                          <td className="px-4 py-4 font-semibold">
                            {formatNaira(getMoney(record.netSalary))}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                record.status === "Paid"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {selectedPayrolls.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                            No payroll records for {months[payrollMonth - 1]} {payrollYear}.
                            Choose a period and generate payroll to begin.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-5 text-xs leading-5 text-slate-500">
                Generating payroll saves salary calculations with Pending
                status. This prototype does not transfer money or confirm
                real payments.
              </p>
            </section>
          </div>
        )}

        {activeMenu !== "Dashboard" &&
          activeMenu !== "Employees" &&
          activeMenu !== "Payroll" && (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <h3 className="text-xl font-bold">{activeMenu}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                This section is part of the SmartPayroll design. Its full
                functionality will be developed in a later stage.
              </p>

              {activeMenu === "AI Insights" && (
                <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                  Planned AI features include unusual payroll figure detection,
                  workforce cost forecasting, and payroll summaries. AI
                  analysis is not running yet.
                </div>
              )}

              <button
                type="button"
                onClick={() => openSection("Employees")}
                className="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Go to Employees
              </button>
            </section>
          )}

        <footer className="py-6 text-center text-xs text-slate-400">
          SmartPayroll Management System · Development Prototype
        </footer>
      </main>
    </div>
  );
}
