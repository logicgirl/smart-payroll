
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

type ReportPayroll = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  department: string;
  month: number;
  year: number;
  basicSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidAt: string | null;
};

type PayrollReport = {
  month: number;
  year: number;
  summary: {
    employeeCount: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    paidAmount: number;
    unpaidAmount: number;
    paidCount: number;
    unpaidCount: number;
  };
  payrolls: ReportPayroll[];
};

type PayrollInsights = {
  generatedAt: string;
  summary: {
    totalEmployees: number;
    payrollRecords: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    paidCount: number;
    unpaidCount: number;
    paidAmount: number;
    unpaidAmount: number;
  };
  monthlyTrends: {
    month: number;
    year: number;
    netSalary: number;
  }[];
  alerts: {
    type: "warning" | "info";
    title: string;
    message: string;
  }[];
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
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
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
  const [updatingPayrollId, setUpdatingPayrollId] =
    useState<string | null>(null);

  const [name, setName] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("Finance");
  const [salary, setSalary] = useState("");

  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [allowances, setAllowances] = useState("0");
  const [deductions, setDeductions] = useState("0");

    const [reportMonth, setReportMonth] = useState(now.getMonth() + 1);
  const [reportYear, setReportYear] = useState(now.getFullYear());
  const [reportData, setReportData] = useState<PayrollReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const [exportingReport, setExportingReport] = useState(false);

  
const [insights, setInsights] = useState<PayrollInsights | null>(null);
const [insightsLoading, setInsightsLoading] = useState(false);
const [insightsError, setInsightsError] = useState("");
const [insightsRefreshKey, setInsightsRefreshKey] = useState(0);

  
const [voiceQuestion, setVoiceQuestion] = useState("");
const [voiceAnswer, setVoiceAnswer] = useState("");
const [isListening, setIsListening] = useState(false);
const [isSpeaking, setIsSpeaking] = useState(false);
const [voiceError, setVoiceError] = useState("");

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
useEffect(() => {
  if (activeMenu !== "Reports") return;

  let cancelled = false;

  async function loadReport() {
    setReportLoading(true);
    setReportError("");

    try {
      const response = await fetch(
        `/api/reports?month=${reportMonth}&year=${reportYear}`,
        { cache: "no-store" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load payroll report.");
      }

      if (!cancelled) {
        setReportData(data as PayrollReport);
      }
    } catch (error) {
      if (!cancelled) {
        setReportData(null);
        setReportError(
          error instanceof Error
            ? error.message
            : "Unable to load payroll report."
        );
      }
    } finally {
      if (!cancelled) {
        setReportLoading(false);
      }
    }
  }

  void loadReport();

  return () => {
    cancelled = true;
  };
}, [activeMenu, reportMonth, reportYear]);

useEffect(() => {
  if (activeMenu !== "AI Insights") return;

  let cancelled = false;

  async function loadInsights() {
    setInsightsLoading(true);
    setInsightsError("");

    try {
      const response = await fetch("/api/insights", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to load AI Payroll Insights."
        );
      }

      if (!cancelled) {
        setInsights(data as PayrollInsights);
      }
    } catch (error) {
      if (!cancelled) {
        setInsightsError(
          error instanceof Error
            ? error.message
            : "Unable to load payroll insights."
        );
      }
    } finally {
      if (!cancelled) {
        setInsightsLoading(false);
      }
    }
  }

  void loadInsights();

  return () => {
    cancelled = true;
  };
}, [activeMenu, insightsRefreshKey]);
  const totalPayroll = employees.reduce(
    (total, employee) => total + Number(employee.salary),
    0
  );

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

  const selectedApprovedCount = selectedPayrolls.filter(
    (record) => record.status === "Approved"
  ).length;

  const selectedPendingCount = selectedPayrolls.filter(
    (record) => record.status === "Pending"
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
      setMessage(
        "Allowances and deductions must be valid non-negative amounts."
      );
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

      await loadPayroll();

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

  async function handlePayrollStatus(
    record: PayrollRecord,
    nextStatus: "Approved" | "Paid"
  ) {
    if (nextStatus === "Paid") {
      const confirmed = window.confirm(
        `Confirm that ${formatNaira(getMoney(record.netSalary))} has actually been paid to ${record.employee.name} for ${months[record.month - 1]} ${record.year}?\n\nThis action records the payment in SmartPayroll. It does not transfer money.`
      );

      if (!confirmed) return;
    }

    setUpdatingPayrollId(record.id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/payroll/${encodeURIComponent(record.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to update payroll status."
        );
      }

      await loadPayroll();

      setMessageType("success");
      setMessage(data.message || "Payroll status updated successfully.");
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update payroll status."
      );
    } finally {
      setUpdatingPayrollId(null);
    }
  }

  function statusClass(status: string) {
    if (status === "Paid") {
      return "bg-emerald-100 text-emerald-800";
    }

    if (status === "Approved") {
      return "bg-blue-100 text-blue-800";
    }

    return "bg-amber-100 text-amber-800";
  }
async function handleExportReport() {
  setExportingReport(true);
  setReportError("");

  try {
    const response = await fetch(
      `/api/reports/export?month=${reportMonth}&year=${reportYear}`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      let errorMessage = "Unable to export the payroll report.";

      try {
        const data = await response.json();
        errorMessage = data.error || errorMessage;
      } catch {
        // Keep the default error message if the response is not JSON.
      }

      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download =
      `SmartPayroll-${months[reportMonth - 1]}-${reportYear}.xlsx`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (error) {
    setReportError(
      error instanceof Error
        ? error.message
        : "Unable to download the Excel report."
    );
  } finally {
    setExportingReport(false);
  }
}

const answerVoiceQuestion = useCallback(
  (question: string) => {
    const data = insights;

    if (!data) {
      setVoiceAnswer("");
      setVoiceError("AI insights are not loaded yet. Please refresh Insights and try again.");
      return;
    }

    const q = question.toLowerCase();
    const summary = data.summary;
    let answer = "";

    if (q.includes("employee") || q.includes("staff") || q.includes("worker")) {
      answer = `SmartPayroll currently has ${summary.totalEmployees} employees.`;
    } else if (
      q.includes("unpaid") ||
      q.includes("not paid") ||
      q.includes("outstanding")
    ) {
      answer = `There are ${summary.unpaidCount} unpaid payroll records totalling ${formatNaira(summary.unpaidAmount)}.`;
    } else if (q.includes("paid")) {
      answer = `${summary.paidCount} payroll records are marked as paid, totalling ${formatNaira(summary.paidAmount)}.`;
    } else if (
      q.includes("net payroll") ||
      q.includes("total payroll") ||
      q.includes("payroll cost") ||
      q.includes("payroll costs")
    ) {
      answer = `The total net payroll across saved records is ${formatNaira(summary.netSalary)}.`;
    } else if (q.includes("basic salary") || q.includes("basic salaries")) {
      answer = `The total basic salary across saved payroll records is ${formatNaira(summary.basicSalary)}.`;
    } else if (q.includes("allowance")) {
      answer = `Total allowances across saved payroll records are ${formatNaira(summary.allowances)}.`;
    } else if (q.includes("deduction")) {
      answer = `Total deductions across saved payroll records are ${formatNaira(summary.deductions)}.`;
    } else if (q.includes("trend") || q.includes("month") || q.includes("changed")) {
      if (data.monthlyTrends.length === 0) {
        answer = "There are no monthly payroll trends available yet.";
      } else {
        const trends = data.monthlyTrends
          .map(
            (item) =>
              `${months[item.month - 1]} ${item.year}: ${formatNaira(item.netSalary)}`
          )
          .join(". ");
        answer = `Here are the available monthly payroll trends. ${trends}.`;
      }
    } else if (q.includes("alert") || q.includes("warning") || q.includes("problem")) {
      answer =
        data.alerts.length > 0
          ? `There are ${data.alerts.length} payroll alerts. ${data.alerts
              .map((alert) => `${alert.title}. ${alert.message}`)
              .join(". ")}`
          : "There are no payroll alerts at the moment.";
    } else if (q.includes("hello") || q.includes("hi") || q.includes("good morning")) {
      answer = "Hello! I am your SmartPayroll assistant. You can ask me about employees, payroll totals, paid records, unpaid records, or monthly trends.";
    } else if (q.includes("help") || q.includes("what can you do")) {
      answer = "I can report employee totals, net payroll, basic salaries, allowances, deductions, paid and unpaid records, alerts, and monthly trends. Try asking, how much payroll is unpaid?";
    } else {
      answer = "I can answer questions about employee totals, payroll costs, paid and unpaid records, allowances, deductions, alerts, and monthly trends. Please try asking about one of these topics.";
    }

    setVoiceAnswer(answer);
    setVoiceError("");
  },
  [insights]
);

function startVoiceListening() {
  setVoiceError("");

  type SpeechRecognitionInstance = {
    lang: string;
    interimResults: boolean;
    maxAlternatives: number;
    onresult: ((event: {
      results: ArrayLike<ArrayLike<{ transcript: string }>>;
    }) => void) | null;
    onerror: ((event: { error: string }) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  };

  type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

  const speechWindow = window as Window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  const Recognition =
    speechWindow.SpeechRecognition ||
    speechWindow.webkitSpeechRecognition;

  if (!Recognition) {
    setVoiceError(
      "Voice input is not supported in this browser. Please use a recent version of Google Chrome or Microsoft Edge."
    );
    return;
  }

  const recognition = new Recognition();
  recognition.lang = "en-NG";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    const transcript = event.results[0]?.[0]?.transcript?.trim();

    if (transcript) {
      setVoiceQuestion(transcript);
      answerVoiceQuestion(transcript);
    }
  };

  recognition.onerror = (event) => {
    setVoiceError(`Voice input failed: ${event.error}. Please try again.`);
    setIsListening(false);
  };

  recognition.onend = () => {
    setIsListening(false);
  };

  setIsListening(true);

  try {
    recognition.start();
  } catch {
    setIsListening(false);
    setVoiceError("The microphone could not start. Please try again.");
  }
}

function speakVoiceAnswer() {
  if (!voiceAnswer) {
    setVoiceError("Ask a question first so I have an answer to read aloud.");
    return;
  }

  if (!("speechSynthesis" in window)) {
    setVoiceError("Spoken answers are not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(voiceAnswer);
  utterance.lang = "en-NG";
  utterance.rate = 1;

  utterance.onstart = () => setIsSpeaking(true);
  utterance.onend = () => setIsSpeaking(false);
  utterance.onerror = () => {
    setIsSpeaking(false);
    setVoiceError("I could not read that answer aloud. Please try again.");
  };

  setVoiceError("");
  window.speechSynthesis.speak(utterance);
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
            <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Total Employees</p>
                <p className="mt-3 text-3xl font-bold">
                  {loading ? "…" : employees.length}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  Registered employees
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Monthly Payroll</p>
                <p className="mt-3 text-xl font-bold">
                  {loading
                    ? "…"
                    : formatNaira(
                        employees.reduce(
                          (sum, employee) => sum + Number(employee.salary),
                          0
                        )
                      )}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Total listed monthly salaries
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Payroll Records</p>
                <p className="mt-3 text-3xl font-bold">{payrolls.length}</p>
                <p className="mt-2 text-xs text-slate-500">
                  All generated payroll periods
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Paid Records</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrolls.filter((record) => record.status === "Paid").length}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  Payments recorded
                </p>
              </div>
            </section>

            <section className="mb-8 grid gap-6 xl:grid-cols-3">
              <div className="rounded-2xl bg-emerald-600 p-6 text-white shadow-sm xl:col-span-2">
                <p className="text-sm text-emerald-100">Payroll workspace</p>
                <h3 className="mt-2 text-2xl font-bold">
                  Manage payroll with confidence
                </h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-50">
                  Organise employee records, generate payroll, review salary
                  calculations, approve payments, and record completed payments.
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
                  <p>1. Review employee records</p>
                  <p>2. Verify salary calculations</p>
                  <p>3. Approve payroll</p>
                  <p>4. Record completed payments</p>
                </div>
                <button
                  type="button"
                  onClick={() => openSection("Payroll")}
                  className="mt-5 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Open Payroll
                </button>
              </div>
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
                    className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : editingEmployee
                        ? "Save Changes"
                        : "Save Employee"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={resetForm}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
                        {formatNaira(Number(employee.salary))}
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
                      <td colSpan={4} className="px-5 py-10 text-center text-slate-500">
                        {employees.length === 0
                          ? "No employees saved yet. Use Add Employee to register your first employee."
                          : "No employees match your search."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => void loadEmployees()}
              disabled={loading || saving || deletingId !== null}
              className="mt-5 rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
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
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingPayroll ? "Generating..." : "Generate Payroll"}
                </button>
              </form>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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
                  Saved net salaries
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Pending</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrollLoading ? "…" : selectedPendingCount}
                </p>
                <p className="mt-2 text-xs text-amber-700">
                  Awaiting review
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Approved</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrollLoading ? "…" : selectedApprovedCount}
                </p>
                <p className="mt-2 text-xs text-blue-700">
                  Awaiting payment
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">Marked Paid</p>
                <p className="mt-3 text-3xl font-bold">
                  {payrollLoading ? "…" : selectedPaidCount}
                </p>
                <p className="mt-2 text-xs text-emerald-700">
                  Payment recorded
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <h3 className="text-xl font-bold">Payroll Records</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review payroll, approve salaries, and record completed payments.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void loadPayroll()}
                  disabled={payrollLoading || generatingPayroll || updatingPayrollId !== null}
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
                  <table className="w-full min-w-[1250px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-4 font-semibold">Employee</th>
                        <th className="px-4 py-4 font-semibold">Period</th>
                        <th className="px-4 py-4 font-semibold">Basic Salary</th>
                        <th className="px-4 py-4 font-semibold">Allowance</th>
                        <th className="px-4 py-4 font-semibold">Deduction</th>
                        <th className="px-4 py-4 font-semibold">Net Salary</th>
                        <th className="px-4 py-4 font-semibold">Status</th>
                        <th className="px-4 py-4 font-semibold">Payment Date</th>
                        <th className="px-4 py-4 font-semibold">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {selectedPayrolls.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <p className="font-semibold">
                              {record.employee.name}
                            </p>
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
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(record.status)}`}
                            >
                              {record.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-xs text-slate-600">
                            {record.paidAt
                              ? new Date(record.paidAt).toLocaleDateString("en-GB")
                              : "—"}
                          </td>

                          <td className="px-4 py-4">
                            {record.status === "Pending" && (
                              <button
                                type="button"
                                disabled={updatingPayrollId !== null}
                                onClick={() =>
                                  void handlePayrollStatus(record, "Approved")
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                {updatingPayrollId === record.id
                                  ? "Processing..."
                                  : "Approve"}
                              </button>
                            )}

                            {record.status === "Approved" && (
                              <button
                                type="button"
                                disabled={updatingPayrollId !== null}
                                onClick={() =>
                                  void handlePayrollStatus(record, "Paid")
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {updatingPayrollId === record.id
                                  ? "Processing..."
                                  : "Mark as Paid"}
                              </button>
                            )}

                            {record.status === "Paid" && (
                              <span className="text-xs font-medium text-emerald-700">
                                Payment recorded
                              </span>
                            )}

                            {!["Pending", "Approved", "Paid"].includes(record.status) && (
                              <span className="text-xs text-slate-500">
                                No action available
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {selectedPayrolls.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-slate-500">
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
                Generated payroll starts as Pending. Approve a record before
                recording payment. Mark as Paid only after the payment has
                actually been made. This prototype does not transfer money.
              </p>
            </section>
          </div>
        )}
{activeMenu === "Reports" && (
  <section className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-white">
          Payroll Reports
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Review payroll summaries and export your records to Excel.
        </p>
      </div>

      <button
        onClick={handleExportReport}
        disabled={reportLoading || exportingReport || !reportData}
        className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {exportingReport ? "Exporting..." : "Download Excel"}
      </button>
    </div>

    <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Select Report Period
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="report-month"
            className="mb-2 block text-sm text-gray-300"
          >
            Month
          </label>
          <select
            id="report-month"
            value={reportMonth}
            onChange={(event) =>
              setReportMonth(Number(event.target.value))
            }
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white"
          >
            {months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="report-year"
            className="mb-2 block text-sm text-gray-300"
          >
            Year
          </label>
          <select
            id="report-year"
            value={reportYear}
            onChange={(event) =>
              setReportYear(Number(event.target.value))
            }
            className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white"
          >
            {Array.from(
              { length: 7 },
              (_, index) => new Date().getFullYear() - 3 + index
            ).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>

    {reportError && (
      <div
        role="alert"
        className="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300"
      >
        {reportError}
      </div>
    )}

    {reportLoading ? (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-10 text-center text-gray-300">
        Loading payroll report...
      </div>
    ) : reportData ? (
      <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Payroll Employees</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {reportData.summary.employeeCount}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Basic Salaries</p>
            <p className="mt-2 text-2xl font-bold text-white">
              {formatNaira(reportData.summary.basicSalary)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Net Payroll</p>
            <p className="mt-2 text-2xl font-bold text-blue-400">
              {formatNaira(reportData.summary.netSalary)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Amount Paid</p>
            <p className="mt-2 text-2xl font-bold text-green-400">
              {formatNaira(reportData.summary.paidAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Allowances</p>
            <p className="mt-2 text-xl font-bold text-white">
              {formatNaira(reportData.summary.allowances)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Deductions</p>
            <p className="mt-2 text-xl font-bold text-white">
              {formatNaira(reportData.summary.deductions)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Unpaid Amount</p>
            <p className="mt-2 text-xl font-bold text-orange-400">
              {formatNaira(reportData.summary.unpaidAmount)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-700 bg-gray-900 p-5">
            <p className="text-sm text-gray-400">Payment Status</p>
            <p className="mt-2 text-xl font-bold text-white">
              {reportData.summary.paidCount} paid
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {reportData.summary.unpaidCount} unpaid
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
          <div className="border-b border-gray-700 p-5">
            <h3 className="text-lg font-semibold text-white">
              Payroll Details
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              {months[reportData.month - 1]} {reportData.year}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Basic Salary</th>
                  <th className="px-4 py-3">Allowances</th>
                  <th className="px-4 py-3">Deductions</th>
                  <th className="px-4 py-3">Net Salary</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Paid Date</th>
                </tr>
              </thead>

<tbody className="divide-y divide-gray-800 text-gray-200">
  {reportData.payrolls.map((payroll, index) => (
    <tr
      key={`${payroll.employeeId}-${index}`}
      className="transition hover:bg-gray-800/60"
    >
      <td className="px-4 py-4 font-medium">
        {payroll.name}
      </td>
      <td className="px-4 py-4">
        {payroll.department || "—"}
      </td>
      <td className="px-4 py-4">
        {formatNaira(payroll.basicSalary)}
      </td>
      <td className="px-4 py-4">
        {formatNaira(payroll.allowances)}
      </td>
      <td className="px-4 py-4">
        {formatNaira(payroll.deductions)}
      </td>
      <td className="px-4 py-4 font-semibold">
        {formatNaira(payroll.netSalary)}
      </td>
    </tr>
  ))}
</tbody>

            </table>
          </div>

          {reportData.payrolls.length === 0 && (
            <p className="p-8 text-center text-gray-400">
              No payroll records were found for this period.
            </p>
          )}
        </div>
      </>
    ) : (
      <div className="rounded-xl border border-gray-700 bg-gray-900 p-10 text-center">
        <p className="text-gray-300">
          No report data is available for the selected period.
        </p>
      </div>
    )}
  </section>
)}

{activeMenu === "AI Insights" && (
  <section className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h3 className="text-xl font-bold">AI Payroll Insights</h3>
        <p className="mt-2 text-sm text-slate-500">
          Review payroll costs, payment status, and monthly changes.
        </p>
      </div>

      <button
        type="button"
        onClick={() => setInsightsRefreshKey((key) => key + 1)}
        disabled={insightsLoading}
        className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {insightsLoading ? "Refreshing..." : "Refresh Insights"}
      </button>
    </div>

    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
      These insights use payroll calculations and rule-based checks.
      Review alerts before taking action. They do not prove an error
      has occurred, approve payroll, or make payments.
    </div>


    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h4 className="text-lg font-bold">✧ Voice Payroll Assistant</h4>
        <p className="mt-1 text-sm text-slate-500">
          Ask about employee totals, payroll costs, payments, or monthly trends.
          You can type your question or use the microphone.
        </p>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (voiceQuestion.trim()) {
            answerVoiceQuestion(voiceQuestion.trim());
          }
        }}
      >
        <input
          type="text"
          value={voiceQuestion}
          onChange={(event) => setVoiceQuestion(event.target.value)}
          placeholder="e.g. How much payroll is unpaid?"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />

        <button
          type="submit"
          disabled={!voiceQuestion.trim() || !insights}
          className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Ask
        </button>

        <button
          type="button"
          onClick={startVoiceListening}
          disabled={isListening || !insights}
          className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isListening ? "Listening..." : "🎙 Speak"}
        </button>
      </form>

      {isListening && (
        <p className="mt-3 text-sm text-emerald-700" role="status">
          Listening... Please ask your payroll question.
        </p>
      )}

      {voiceAnswer && (
        <div className="mt-5 rounded-xl bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Assistant response</p>
          <p className="mt-2 text-sm leading-6 text-slate-700" aria-live="polite">
            {voiceAnswer}
          </p>

          <button
            type="button"
            onClick={speakVoiceAnswer}
            className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            {isSpeaking ? "Speaking..." : "🔊 Speak Answer"}
          </button>

          {isSpeaking && (
            <button
              type="button"
              onClick={() => {
                window.speechSynthesis.cancel();
                setIsSpeaking(false);
              }}
              className="ml-2 rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-white"
            >
              Stop
            </button>
          )}
        </div>
      )}

      {voiceError && (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {voiceError}
        </p>
      )}

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Responses use your loaded payroll insights and predefined rules. Verify
        important figures before making payroll decisions. Microphone support
        depends on your browser and microphone permissions.
      </p>
    </div>

    {insightsError && (
      <div
        role="alert"
        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        {insightsError}
      </div>
    )}

    {insightsLoading && !insights && (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
        Analysing payroll records...
      </div>
    )}

    {insights && (
      <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Employees</p>
            <p className="mt-3 text-3xl font-bold">
              {insights.summary.totalEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Net Payroll</p>
            <p className="mt-3 text-xl font-bold">
              {formatNaira(insights.summary.netSalary)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {insights.summary.payrollRecords} payroll records
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Amount Paid</p>
            <p className="mt-3 text-xl font-bold text-emerald-700">
              {formatNaira(insights.summary.paidAmount)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {insights.summary.paidCount} paid record(s)
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Amount Unpaid</p>
            <p className="mt-3 text-xl font-bold text-amber-700">
              {formatNaira(insights.summary.unpaidAmount)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {insights.summary.unpaidCount} unpaid record(s)
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Payroll Breakdown</h3>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Basic salaries</span>
                <span className="font-semibold">
                  {formatNaira(insights.summary.basicSalary)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Allowances</span>
                <span className="font-semibold">
                  {formatNaira(insights.summary.allowances)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-slate-500">Deductions</span>
                <span className="font-semibold">
                  {formatNaira(insights.summary.deductions)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-slate-200 pt-4">
                <span className="font-semibold">Net payroll</span>
                <span className="font-bold text-emerald-700">
                  {formatNaira(insights.summary.netSalary)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold">Payroll Alerts</h3>
            <p className="mt-1 text-sm text-slate-500">
              Items that may need an administrator's attention.
            </p>

            <div className="mt-5 space-y-4">
              {insights.alerts.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No rule-based alerts were detected.
                </p>
              ) : (
                insights.alerts.map((alert, index) => (
                  <div
                    key={`${alert.title}-${index}`}
                    className={`rounded-xl border p-4 ${
                      alert.type === "warning"
                        ? "border-amber-200 bg-amber-50"
                        : "border-blue-200 bg-blue-50"
                    }`}
                  >
                    <p className="font-semibold">{alert.title}</p>
                    <p className="mt-2 text-sm leading-6">
                      {alert.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold">Monthly Payroll Trends</h3>
          <p className="mt-1 text-sm text-slate-500">
            Net payroll for each month with saved records.
          </p>

          {insights.monthlyTrends.length === 0 ? (
            <p className="mt-5 text-sm text-slate-500">
              No payroll history is available yet.
            </p>
          ) : (
            <div className="mt-5 space-y-5">
              {insights.monthlyTrends.map((trend) => {
                const maximum = Math.max(
                  ...insights.monthlyTrends.map(
                    (item) => item.netSalary
                  ),
                  1
                );

                const width = Math.max(
                  2,
                  (trend.netSalary / maximum) * 100
                );

                return (
                  <div key={`${trend.year}-${trend.month}`}>
                    <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                      <span className="font-medium">
                        {months[trend.month - 1]} {trend.year}
                      </span>
                      <span className="font-semibold">
                        {formatNaira(trend.netSalary)}
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Last analysed:{" "}
          {new Date(insights.generatedAt).toLocaleString("en-NG")}
        </p>
      </>
    )}
  </section>
)}

  {activeMenu !== "Dashboard" &&
  activeMenu !== "Employees" &&
  activeMenu !== "Payroll" &&
  activeMenu !== "Reports" &&
  activeMenu !== "AI Insights" && (

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
