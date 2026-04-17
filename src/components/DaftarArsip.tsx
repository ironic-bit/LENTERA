import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Arsip } from "@/types/arsip";
import { KLASIFIKASI_KEAMANAN, KETERANGAN_RETENSI, STATUS_ARSIP } from "@/types/arsip";
import { useAuth } from "@/hooks/useAuth";
import {
  Search,
  ExternalLink,
  Trash2,
  FileText,
  Calendar,
  FolderOpen,
  Shield,
  Clock,
} from "lucide-react";

interface DaftarArsipProps {
  arsipList: Arsip[];
  onDelete: (id: string) => void;
}

export function DaftarArsip({ arsipList, onDelete }: DaftarArsipProps) {
  const { hasAccess, userRole } = useAuth();
  const canDelete = hasAccess("delete");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterKeamanan, setFilterKeamanan] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTahun, setFilterTahun] = useState<string>("all");

  // Get unique years from data
  const availableYears = useMemo(() => {
    const years = [...new Set(arsipList.map((arsip) => arsip.tahun))];
    return years.sort((a, b) => b - a);
  }, [arsipList]);

  // Filter data based on user access level
  const filteredArsip = useMemo(() => {
    return arsipList.filter((arsip) => {
      // Security filtering based on user role
      const keamananLevel = arsip.klasifikasiKeamanan;
      let canView = true;
      
      if (userRole === "viewer") {
        // Viewer hanya bisa lihat Biasa (B) dan Terbatas (T)
        canView = keamananLevel === "B" || keamananLevel === "T";
      } else if (userRole === "user") {
        // User bisa lihat B, T, dan Rahasia (R)
        canView = keamananLevel === "B" || keamananLevel === "T" || keamananLevel === "R";
      }
      // Admin bisa lihat semua termasuk Sangat Rahasia (SR)

      const matchSearch =
        searchQuery === "" ||
        arsip.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arsip.nomorSurat.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arsip.kodeKlasifikasi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        arsip.deskripsi.toLowerCase().includes(searchQuery.toLowerCase());

      const matchKeamanan =
        filterKeamanan === "all" || arsip.klasifikasiKeamanan === filterKeamanan;

      const matchStatus =
        filterStatus === "all" || arsip.statusArsip === filterStatus;

      const matchTahun =
        filterTahun === "all" || arsip.tahun.toString() === filterTahun;

      return canView && matchSearch && matchKeamanan && matchStatus && matchTahun;
    });
  }, [arsipList, searchQuery, filterKeamanan, filterStatus, filterTahun, userRole]);

  const getKeamananColor = (keamanan: string) => {
    return KLASIFIKASI_KEAMANAN.find((k) => k.value === keamanan)?.color || "bg-slate-100";
  };

  const getKeamananLabel = (keamanan: string) => {
    return KLASIFIKASI_KEAMANAN.find((k) => k.value === keamanan)?.label || keamanan;
  };

  const getStatusColor = (status: string) => {
    return STATUS_ARSIP.find((s) => s.value === status)?.color || "bg-slate-100";
  };

  const getRetensiColor = (retensi: string) => {
    return KETERANGAN_RETENSI.find((r) => r.value === retensi)?.color || "bg-slate-100";
  };

  return (
    <Card className="border-blue-100 shadow-md">
      <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FolderOpen className="w-5 h-5" />
          Daftar Arsip Digital
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white">
            {filteredArsip.length} arsip
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Filter Section */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Cari berdasarkan kode, nomor, judul..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Shield className="w-4 h-4 text-slate-500" />
              <Select value={filterKeamanan} onValueChange={setFilterKeamanan}>
                <SelectTrigger className="flex-1 border-slate-300">
                  <SelectValue placeholder="Filter Keamanan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Keamanan</SelectItem>
                  {KLASIFIKASI_KEAMANAN.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.value} - {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <FileText className="w-4 h-4 text-slate-500" />
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="flex-1 border-slate-300">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  {STATUS_ARSIP.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <Calendar className="w-4 h-4 text-slate-500" />
              <Select value={filterTahun} onValueChange={setFilterTahun}>
                <SelectTrigger className="flex-1 border-slate-300">
                  <SelectValue placeholder="Filter Tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tahun</SelectItem>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchQuery || filterKeamanan !== "all" || filterStatus !== "all" || filterTahun !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setFilterKeamanan("all");
                  setFilterStatus("all");
                  setFilterTahun("all");
                }}
                className="border-slate-300"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold text-slate-700">No</TableHead>
                <TableHead className="font-semibold text-slate-700">Kode</TableHead>
                <TableHead className="font-semibold text-slate-700">Nomor Surat</TableHead>
                <TableHead className="font-semibold text-slate-700">Judul</TableHead>
                <TableHead className="font-semibold text-slate-700">Keamanan</TableHead>
                <TableHead className="font-semibold text-slate-700">Tahun</TableHead>
                <TableHead className="font-semibold text-slate-700">Retensi</TableHead>
                <TableHead className="font-semibold text-slate-700 text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredArsip.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center text-slate-400">
                      <FileText className="w-12 h-12 mb-3" />
                      <p className="text-lg font-medium">Tidak ada arsip ditemukan</p>
                      <p className="text-sm">
                        {arsipList.length === 0
                          ? "Belum ada arsip yang diregistrasi"
                          : "Coba ubah kata kunci pencarian atau filter"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredArsip.map((arsip, index) => (
                  <TableRow key={arsip.id} className="hover:bg-slate-50">
                    <TableCell className="text-slate-600">{index + 1}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-mono font-medium text-blue-600 text-sm">{arsip.kodeKlasifikasi}</p>
                        <p className="text-xs text-slate-500">{arsip.jenisNaskah}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {arsip.nomorSurat}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">{arsip.judul}</p>
                        {arsip.deskripsi && (
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {arsip.deskripsi}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          variant="outline"
                          className={getKeamananColor(arsip.klasifikasiKeamanan)}
                        >
                          <Shield className="w-3 h-3 mr-1" />
                          {arsip.klasifikasiKeamanan}
                        </Badge>
                        <p className="text-xs text-slate-500">{getKeamananLabel(arsip.klasifikasiKeamanan)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-slate-600">{arsip.tahun}</p>
                        <Badge variant="outline" className={getStatusColor(arsip.statusArsip)}>
                          {arsip.statusArsip}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="w-3 h-3" />
                          <span>A: {arsip.retensiAktif} th</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Clock className="w-3 h-3" />
                          <span>I: {arsip.retensiInaktif} th</span>
                        </div>
                        <Badge variant="outline" className={getRetensiColor(arsip.keteranganRetensi)}>
                          {arsip.keteranganRetensi}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(arsip.linkCloud, "_blank")}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Buka
                        </Button>
                        {canDelete && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(arsip.id)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
