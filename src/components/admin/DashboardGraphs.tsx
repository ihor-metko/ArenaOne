"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { DashboardGraphsResponse, TimeRange } from "@/types/graphs";
import "./DashboardGraphs.css";

export interface DashboardGraphsProps {
  /** 
   * External loading state (optional).
   * Use this when you want to control loading from a parent component.
   * If not provided, the component manages its own loading state.
   */
  loading?: boolean;
  /** 
   * External error message (optional).
   * Use this when you want to display errors from a parent component.
   * If not provided, the component manages its own error state.
   */
  error?: string;
}

/**
 * Custom tooltip for the graphs
 */
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="im-graph-tooltip">
      <p className="im-graph-tooltip-label">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="im-graph-tooltip-value" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

/**
 * DashboardGraphs Component
 *
 * Displays booking trends and active users graphs for admin dashboards.
 * - Fetches data from /api/admin/dashboard/graphs
 * - Adapts data scope based on admin role (Root, Organization, Club)
 * - Supports week and month time ranges
 * - Uses dark theme with im-* classes
 * - Responsive and accessible
 */
export default function DashboardGraphs({ loading: externalLoading, error: externalError }: DashboardGraphsProps) {
  const t = useTranslations();
  const [data, setData] = useState<DashboardGraphsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState<TimeRange>("week");

  const fetchGraphData = useCallback(async (range: TimeRange) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/admin/dashboard/graphs?timeRange=${range}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch graph data");
      }

      const graphData: DashboardGraphsResponse = await response.json();
      setData(graphData);
    } catch (err) {
      setError(t("dashboardGraphs.errorLoading"));
      console.error("Error fetching graph data:", err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchGraphData(timeRange);
  }, [timeRange, fetchGraphData]);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
  };

  // Use external loading/error states if provided
  const isLoading = externalLoading || loading;
  const errorMessage = externalError || error;

  if (isLoading) {
    return (
      <div className="im-dashboard-graphs-section">
        <div className="im-dashboard-graphs-header">
          <h2 className="im-dashboard-graphs-title">{t("dashboardGraphs.title")}</h2>
        </div>
        <div className="im-dashboard-graphs-loading">
          <div className="im-dashboard-graphs-loading-spinner" />
          <span className="im-dashboard-graphs-loading-text">{t("common.loading")}</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="im-dashboard-graphs-section">
        <div className="im-dashboard-graphs-header">
          <h2 className="im-dashboard-graphs-title">{t("dashboardGraphs.title")}</h2>
        </div>
        <div className="im-dashboard-graphs-error">
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Calculate if we have small dataset (for better visualization)
  const hasSmallDataset = data.bookingTrends.length <= 3;
  const graphHeight = hasSmallDataset ? 350 : 320;

  // Calculate max values for better axis scaling
  const maxBookings = Math.max(...data.bookingTrends.map(d => d.bookings), 0);
  const maxUsers = Math.max(...data.activeUsers.map(d => d.users), 0);
  
  // Set dynamic domain for better visualization of small values
  const bookingsYDomain = maxBookings <= 5 ? [0, Math.max(maxBookings + 2, 5)] : [0, 'auto'];
  const usersYDomain = maxUsers <= 5 ? [0, Math.max(maxUsers + 2, 5)] : [0, 'auto'];

  return (
    <div className="im-dashboard-graphs-section">
      <div className="im-dashboard-graphs-header">
        <h2 className="im-dashboard-graphs-title">{t("dashboardGraphs.title")}</h2>
        <div className="im-dashboard-graphs-controls">
          <button
            onClick={() => handleTimeRangeChange("week")}
            className={`im-graph-time-button ${timeRange === "week" ? "im-graph-time-button--active" : ""}`}
            aria-pressed={timeRange === "week"}
          >
            {t("dashboardGraphs.week")}
          </button>
          <button
            onClick={() => handleTimeRangeChange("month")}
            className={`im-graph-time-button ${timeRange === "month" ? "im-graph-time-button--active" : ""}`}
            aria-pressed={timeRange === "month"}
          >
            {t("dashboardGraphs.month")}
          </button>
        </div>
      </div>

      <div className="im-dashboard-graphs-grid">
        {/* Booking Trends Graph */}
        <div className="im-graph-card">
          <h3 className="im-graph-card-title">{t("dashboardGraphs.bookingTrends")}</h3>
          <p className="im-graph-card-description">{t("dashboardGraphs.bookingTrendsDesc")}</p>
          <div className="im-graph-container">
            <ResponsiveContainer width="100%" height={graphHeight}>
              <BarChart
                data={data.bookingTrends}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--im-border-color)" 
                  opacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--im-text-secondary)"
                  tick={{ fill: "var(--im-text-secondary)", fontSize: 12 }}
                  tickMargin={8}
                  axisLine={{ stroke: "var(--im-border-color)" }}
                />
                <YAxis
                  stroke="var(--im-text-secondary)"
                  tick={{ fill: "var(--im-text-secondary)", fontSize: 12 }}
                  tickMargin={8}
                  allowDecimals={false}
                  domain={bookingsYDomain}
                  axisLine={{ stroke: "var(--im-border-color)" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--im-bg-tertiary)", opacity: 0.3 }} />
                <Legend 
                  wrapperStyle={{ paddingTop: "15px" }}
                  iconType="square"
                />
                <Bar
                  dataKey="bookings"
                  name={t("dashboardGraphs.bookings")}
                  fill="var(--im-primary)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={hasSmallDataset ? 80 : 60}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Active Users Graph */}
        <div className="im-graph-card">
          <h3 className="im-graph-card-title">{t("dashboardGraphs.activeUsers")}</h3>
          <p className="im-graph-card-description">{t("dashboardGraphs.activeUsersDesc")}</p>
          <div className="im-graph-container">
            <ResponsiveContainer width="100%" height={graphHeight}>
              <LineChart
                data={data.activeUsers}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="var(--im-border-color)" 
                  opacity={0.3}
                />
                <XAxis
                  dataKey="label"
                  stroke="var(--im-text-secondary)"
                  tick={{ fill: "var(--im-text-secondary)", fontSize: 12 }}
                  tickMargin={8}
                  axisLine={{ stroke: "var(--im-border-color)" }}
                />
                <YAxis
                  stroke="var(--im-text-secondary)"
                  tick={{ fill: "var(--im-text-secondary)", fontSize: 12 }}
                  tickMargin={8}
                  allowDecimals={false}
                  domain={usersYDomain}
                  axisLine={{ stroke: "var(--im-border-color)" }}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: "3 3" }} />
                <Legend 
                  wrapperStyle={{ paddingTop: "15px" }}
                  iconType="square"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  name={t("dashboardGraphs.users")}
                  stroke="var(--im-success)"
                  strokeWidth={3}
                  dot={{ 
                    fill: "var(--im-success)", 
                    r: hasSmallDataset ? 6 : 5,
                    strokeWidth: 2,
                    stroke: "var(--im-bg-primary)"
                  }}
                  activeDot={{ 
                    r: hasSmallDataset ? 8 : 7,
                    strokeWidth: 2,
                    stroke: "var(--im-bg-primary)"
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
