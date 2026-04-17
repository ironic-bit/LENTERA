import { Card, CardContent } from "@/components/ui/card";
import type { Arsip } from "@/types/arsip";
import { FileText, Shield, Clock, FolderOpen, Lock, Unlock } from "lucide-react";

interface StatistikArsipProps {
  arsipList: Arsip[];
}

export function StatistikArsip({ arsipList }: StatistikArsipProps) {
  const totalArsip = arsipList.length;
  
  const arsipPerKeamanan = arsipList.reduce((acc, arsip) => {
    acc[arsip.klasifikasiKeamanan] = (acc[arsip.klasifikasiKeamanan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const arsipPerStatus = arsipList.reduce((acc, arsip) => {
    acc[arsip.statusArsip] = (acc[arsip.statusArsip] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const arsipPerRetensi = arsipList.reduce((acc, arsip) => {
    acc[arsip.keteranganRetensi] = (acc[arsip.keteranganRetensi] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const stats = [
    {
      title: "Total Arsip",
      value: totalArsip,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "#3b82f6",
    },
    {
      title: "Arsip Aktif",
      value: arsipPerStatus["Aktif"] || 0,
      icon: FolderOpen,
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      iconColor: "#10b981",
    },
    {
      title: "Arsip Inaktif",
      value: arsipPerStatus["Inaktif"] || 0,
      icon: Clock,
      color: "from-amber-500 to-amber-600",
      bgColor: "bg-amber-50",
      iconColor: "#f59e0b",
    },
    {
      title: "Arsip Rahasia/SR",
      value: (arsipPerKeamanan["R"] || 0) + (arsipPerKeamanan["SR"] || 0),
      icon: Lock,
      color: "from-red-500 to-red-600",
      bgColor: "bg-red-50",
      iconColor: "#ef4444",
    },
    {
      title: "Arsip Terbuka",
      value: (arsipPerKeamanan["B"] || 0) + (arsipPerKeamanan["T"] || 0),
      icon: Unlock,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "#22c55e",
    },
    {
      title: "Retensi Permanen",
      value: arsipPerRetensi["Permanen"] || 0,
      icon: Shield,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "#8b5cf6",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-md overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-stretch">
              <div className={`w-1.5 bg-gradient-to-b ${stat.color}`} />
              <div className="flex-1 p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{stat.title}</p>
                    <p className="text-xl font-bold text-slate-800">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-2 rounded-lg`}>
                    <stat.icon className="w-4 h-4" style={{ color: stat.iconColor }} />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
