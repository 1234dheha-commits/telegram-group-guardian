import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <Card className="bg-[#141414] border-[#2a2a2a] hover:border-[#3a3a3a] transition-all">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[#a0a0a0] text-sm mb-2">{title}</p>
            <h3 className="text-3xl font-bold text-white">{value}</h3>
            {trend && (
              <p className="text-sm text-[#10b981] mt-2">{trend}</p>
            )}
          </div>
          {Icon && (
            <div className="p-3 rounded-lg bg-[#1a1a1a]">
              <Icon className="w-6 h-6 text-[#3b82f6]" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}