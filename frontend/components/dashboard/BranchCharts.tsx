"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { BranchDto } from "@/types/api.types";

const COLORS = ["hsl(var(--color-sales))", "hsl(var(--muted))"]; // Active vs Inactive

interface BranchStatusChartProps {
  activeCount: number;
  inactiveCount: number;
}

export function BranchStatusChart({ activeCount, inactiveCount }: BranchStatusChartProps) {
  const data = [
    { name: "Active", value: activeCount },
    { name: "Inactive", value: inactiveCount },
  ];

  return (
    <div className="glass rounded-xl p-6 shadow-sm h-[350px] w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Branch Status</h3>
      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-4 text-sm mt-[-20px]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[0] }} />
          <span>Active ({activeCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: COLORS[1] }} />
          <span>Inactive ({inactiveCount})</span>
        </div>
      </div>
    </div>
  );
}

interface BranchUserDistributionChartProps {
  branches: BranchDto[];
}

export function BranchUserDistributionChart({ branches }: BranchUserDistributionChartProps) {
  const data = branches
    .sort((a, b) => b.userCount - a.userCount) // Sort by users descending
    .slice(0, 7) // Top 7
    .map((b) => ({
      name: b.nameEn,
      users: b.userCount,
    }));

  return (
    <div className="glass rounded-xl p-6 shadow-sm h-[350px] w-full">
      <h3 className="text-lg font-semibold text-foreground mb-4">Users per Branch</h3>
      <div className="h-[270px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              width={100}
              tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "var(--radius)",
              }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar
              dataKey="users"
              fill="hsl(var(--color-users))"
              radius={[0, 4, 4, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
