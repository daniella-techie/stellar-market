"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Filter,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";
import { Transaction, TransactionResponse } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import { useAuth } from "@/context/AuthContext";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

interface EarningsStats {
  totalEarnings: number;
  totalSpent: number;
  netBalance: number;
  transactionCount: number;
}

interface ChartDataPoint {
  date: string;
  earnings: number;
  spent: number;
}

const EarningsPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [stats, setStats] = useState<EarningsStats>({
    totalEarnings: 0,
    totalSpent: 0,
    netBalance: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [totalPages, setTotalPages] = useState(1);

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (typeFilter) params.append("type", typeFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const response = await axios.get<TransactionResponse>(
        `${API}/transactions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setTransactions(response.data.transactions);
      setTotalPages(response.data.pagination.totalPages);

      // Calculate stats
      const stats = calculateStats(response.data.transactions);
      setStats(stats);

      // Generate chart data
      const chartData = generateChartData(response.data.transactions);
      setChartData(chartData);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError(
        err instanceof axios.AxiosError
          ? err.response?.data?.error || "Failed to fetch transactions"
          : "An error occurred while fetching transactions"
      );
    } finally {
      setLoading(false);
    }
  }, [user, currentPage, limit, typeFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Calculate statistics
  const calculateStats = (transactions: Transaction[]): EarningsStats => {
    let totalEarnings = 0;
    let totalSpent = 0;

    transactions.forEach((tx) => {
      if (tx.type === "RELEASE" || tx.type === "DISPUTE_PAYOUT") {
        if (tx.toAddress === user?.walletAddress) {
          totalEarnings += tx.amount;
        }
      }

      if (tx.type === "DEPOSIT") {
        if (tx.fromAddress === user?.walletAddress) {
          totalSpent += tx.amount;
        }
      }

      if (tx.type === "REFUND") {
        if (tx.toAddress === user?.walletAddress) {
          totalEarnings += tx.amount;
        }
      }
    });

    return {
      totalEarnings,
      totalSpent,
      netBalance: totalEarnings - totalSpent,
      transactionCount: transactions.length,
    };
  };

  // Generate chart data grouped by date
  const generateChartData = (transactions: Transaction[]): ChartDataPoint[] => {
    const dataMap = new Map<string, { earnings: number; spent: number }>();

    transactions.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const current = dataMap.get(date) || { earnings: 0, spent: 0 };

      if (tx.type === "RELEASE" || tx.type === "DISPUTE_PAYOUT") {
        if (tx.toAddress === user?.walletAddress) {
          current.earnings += tx.amount;
        }
      }

      if (tx.type === "DEPOSIT") {
        if (tx.fromAddress === user?.walletAddress) {
          current.spent += tx.amount;
        }
      }

      if (tx.type === "REFUND") {
        if (tx.toAddress === user?.walletAddress) {
          current.earnings += tx.amount;
        }
      }

      dataMap.set(date, current);
    });

    return Array.from(dataMap, ([date, data]) => ({
      date,
      ...data,
    })).reverse();
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get transaction type color
  const getTransactionTypeColor = (
    type: "DEPOSIT" | "RELEASE" | "REFUND" | "DISPUTE_PAYOUT"
  ): "default" | "primary" | "success" | "warning" | "danger" => {
    switch (type) {
      case "RELEASE":
        return "success";
      case "DEPOSIT":
        return "warning";
      case "REFUND":
        return "primary";
      case "DISPUTE_PAYOUT":
        return "danger";
      default:
        return "default";
    }
  };

  // Handle filter reset
  const resetFilters = () => {
    setCurrentPage(1);
    setTypeFilter("");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="space-y-6 p-6 bg-theme-bg min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-theme-heading">
            Earnings
          </h1>
          <p className="text-theme-text mt-2">
            Track your payment history and earnings overview
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 bg-theme-error/10 border border-theme-error/30 rounded-lg p-4">
          <AlertTriangle className="w-5 h-5 text-theme-error flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-theme-error">{error}</p>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Earnings"
          value={formatCurrency(stats.totalEarnings)}
          icon={<ArrowDownRight className="w-5 h-5" />}
          color="success"
        />
        <StatCard
          label="Total Spent"
          value={formatCurrency(stats.totalSpent)}
          icon={<ArrowUpRight className="w-5 h-5" />}
          color="warning"
        />
        <StatCard
          label="Net Balance"
          value={formatCurrency(stats.netBalance)}
          icon={
            stats.netBalance >= 0 ? (
              <ArrowUpRight className="w-5 h-5" />
            ) : (
              <ArrowDownRight className="w-5 h-5" />
            )
          }
          color={stats.netBalance >= 0 ? "success" : "danger"}
        />
        <StatCard
          label="Transactions"
          value={stats.transactionCount.toString()}
          icon={<Calendar className="w-5 h-5" />}
          color="primary"
        />
      </div>

      {/* Charts Section */}
      {!loading && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line Chart */}
          <div className="bg-theme-card rounded-lg border border-theme-border p-6 shadow-sm">
            <h2 className="text-theme-heading text-lg font-semibold mb-4">
              Earnings Trend
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="earnings"
                  stroke="#10b981"
                  name="Earnings"
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="spent"
                  stroke="#f59e0b"
                  name="Spent"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart */}
          <div className="bg-theme-card rounded-lg border border-theme-border p-6 shadow-sm">
            <h2 className="text-theme-heading text-lg font-semibold mb-4">
              Comparison
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                    color: "#f1f5f9",
                  }}
                />
                <Legend />
                <Bar dataKey="earnings" fill="#10b981" name="Earnings" />
                <Bar dataKey="spent" fill="#f59e0b" name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-theme-heading text-lg font-semibold flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </h2>
          {(typeFilter || dateFrom || dateTo) && (
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm text-stellar-blue hover:text-stellar-blue/80"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Transaction Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
            >
              <option value="">All Types</option>
              <option value="RELEASE">Release</option>
              <option value="DEPOSIT">Deposit</option>
              <option value="REFUND">Refund</option>
              <option value="DISPUTE_PAYOUT">Dispute Payout</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Date From
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text mb-2">
              Date To
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCurrentPage(1);
              }}
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-theme-card rounded-lg border border-theme-border overflow-hidden shadow-sm">
        <div className="p-6 border-b border-theme-border">
          <h2 className="text-theme-heading text-lg font-semibold">
            Payment History
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-theme-text animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-theme-text">
              No transactions found.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-bg-secondary border-b border-theme-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-theme-text uppercase tracking-wider">
                      Hash
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {transactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-theme-bg-secondary transition-colors"
                    >
                      <td className="px-6 py-4">
                        <StatusBadge
                          status={tx.type}
                          variant={getTransactionTypeColor(tx.type)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          {tx.job ? (
                            <>
                              <span className="text-sm font-medium text-theme-heading">
                                {tx.job.title}
                              </span>
                              <span className="text-xs text-theme-text">
                                ID: {tx.jobId.slice(0, 8)}...
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-theme-text">
                              {tx.jobId.slice(0, 8)}...
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-theme-heading">
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-theme-text">
                          {new Date(tx.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={`https://stellar.expert/explorer/public/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-stellar-blue hover:underline"
                          title={tx.txHash}
                        >
                          {tx.txHash.slice(0, 12)}...
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-bg-secondary">
              <div className="text-sm text-theme-text">
                Page {currentPage} of {totalPages}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "success" | "warning" | "primary" | "danger";
}

const StatCard = ({ label, value, icon, color }: StatCardProps) => {
  const colorMap = {
    success: "bg-theme-success/10 text-theme-success",
    warning: "bg-theme-warning/10 text-theme-warning",
    primary: "bg-stellar-blue/10 text-stellar-blue",
    danger: "bg-theme-error/10 text-theme-error",
  };

  return (
    <div className="bg-theme-card rounded-lg border border-theme-border p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-theme-text text-sm font-medium">
            {label}
          </p>
          <p className="text-theme-heading text-2xl font-bold mt-2">
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-lg ${colorMap[color]}`}>{icon}</div>
      </div>
    </div>
  );
};

export default EarningsPage;
export { EarningsPage };
