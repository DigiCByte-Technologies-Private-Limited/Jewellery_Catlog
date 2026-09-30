import React from 'react';
import { Card, CardContent } from './Card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from './Button';

interface StatCardProps {
  title: string;
  value: string;
  trend?: number; // percentage
  icon: React.ReactNode;
}

export function StatCard({ title, value, trend, icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-6 flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div className="text-sm font-medium text-slate-500">{title}</div>
          <div className="text-slate-400 bg-slate-50 p-2 rounded-lg">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {trend !== undefined && (
          <div className={cn("text-xs flex items-center gap-1 font-medium", trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-slate-500")}>
            {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>{Math.abs(trend)}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
