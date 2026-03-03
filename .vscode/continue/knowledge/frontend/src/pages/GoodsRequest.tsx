
import React, { useState } from 'react';
import { Plus, Trash2, Save, Printer, ArrowLeft, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Item {
  id: string;
  kodeBarang: string;
  jenisBarang: string;
  qty: number;
  harga: number;
  keterangan: string;
}

const GoodsRequest = () => {
  const [date, setDate] = useState<Date>();
  const [items, setItems] = useState<Item[]>([]);
  const [currentItem, setCurrentItem] = useState<Partial<Item>>({
    kodeBarang: '',
    jenisBarang: '',
    qty: 0,
    harga: 0,
    keterangan: ''
  });

  const addItem = () => {
    if (currentItem.kodeBarang && currentItem.jenisBarang) {
      const newItem: Item = {
        id: Date.now().toString(),
        kodeBarang: currentItem.kodeBarang || '',
        jenisBarang: currentItem.jenisBarang || '',
        qty: currentItem.qty || 0,
        harga: currentItem.harga || 0,
        keterangan: currentItem.keterangan || ''
      };
      setItems([...items, newItem]);
      setCurrentItem({
        kodeBarang: '',
        jenisBarang: '',
        qty: 0,
        harga: 0,
        keterangan: ''
      });
    }
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.qty * item.harga), 0);
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span>Service Catalog</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Surat Permintaan Barang</span>
      </div>

      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader className="bg-blue-900 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-900 font-bold text-sm">LOGO</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">PT INDOFOOD CBP SUKSES MAKMUR</h1>
                <p className="text-blue-200">Divisi Noodle</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">SURAT PERMINTAAN BARANG</h2>
              <p className="text-blue-200">HOTS - Helpdesk and Operational Tracking System</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Fields */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="noPermintaan">No. Permintaan</Label>
              <Input 
                id="noPermintaan" 
                value="SPB-2024-001" 
                readOnly 
                className="bg-gray-100"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tanggal</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Input 
                id="status" 
                value="Draft" 
                readOnly 
                className="bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pemohon">Pemohon</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih pemohon" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="john">John Doe</SelectItem>
                  <SelectItem value="jane">Jane Smith</SelectItem>
                  <SelectItem value="ahmad">Ahmad Rahman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="departemen">Departemen/Divisi</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produksi">Produksi</SelectItem>
                  <SelectItem value="gudang">Gudang</SelectItem>
                  <SelectItem value="qc">Quality Control</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keperluan">Keperluan</Label>
              <Textarea 
                id="keperluan" 
                placeholder="Jelaskan keperluan penggunaan barang..."
                rows={3}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Tambah Barang</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="kodeBarang">Kode Barang</Label>
              <Input 
                id="kodeBarang"
                value={currentItem.kodeBarang}
                onChange={(e) => setCurrentItem({...currentItem, kodeBarang: e.target.value})}
                placeholder="Kode"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jenisBarang">Jenis Barang</Label>
              <Input 
                id="jenisBarang"
                value={currentItem.jenisBarang}
                onChange={(e) => setCurrentItem({...currentItem, jenisBarang: e.target.value})}
                placeholder="Nama barang"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qty">Qty</Label>
              <Input 
                id="qty"
                type="number"
                value={currentItem.qty}
                onChange={(e) => setCurrentItem({...currentItem, qty: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="harga">Harga</Label>
              <Input 
                id="harga"
                type="number"
                value={currentItem.harga}
                onChange={(e) => setCurrentItem({...currentItem, harga: parseInt(e.target.value) || 0})}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Input 
                id="keterangan"
                value={currentItem.keterangan}
                onChange={(e) => setCurrentItem({...currentItem, keterangan: e.target.value})}
                placeholder="Catatan"
              />
            </div>
            <Button onClick={addItem} className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Tambah
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Daftar Barang</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="w-16">No.</TableHead>
                  <TableHead>Kode Barang</TableHead>
                  <TableHead>Jenis Barang</TableHead>
                  <TableHead className="w-20">Qty</TableHead>
                  <TableHead className="w-32">Harga</TableHead>
                  <TableHead className="w-32">Jumlah</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead className="w-24">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-mono">{item.kodeBarang}</TableCell>
                    <TableCell>{item.jenisBarang}</TableCell>
                    <TableCell className="text-center">{item.qty}</TableCell>
                    <TableCell className="text-right">Rp {item.harga.toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {(item.qty * item.harga).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell>{item.keterangan}</TableCell>
                    <TableCell>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                      Belum ada barang yang ditambahkan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Pemohon</Label>
                  <div className="border rounded-md p-3 h-20 bg-gray-50">
                    <div className="text-sm text-gray-500">Tanda tangan & tanggal</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nama Supervisor</Label>
                  <div className="border rounded-md p-3 h-20 bg-gray-50">
                    <div className="text-sm text-gray-500">Persetujuan & tanggal</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium">Total Harga</div>
                <div className="text-2xl font-bold text-blue-900">
                  Rp {calculateTotal().toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 justify-center md:justify-start print:hidden">
        <Button variant="outline" className="bg-gray-100 hover:bg-gray-200">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
        <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Simpan
        </Button>
        <Button className="bg-green-600 hover:bg-green-700">
          <Check className="w-4 h-4 mr-2" />
          Kirim
        </Button>
        <Button variant="outline" className="bg-gray-100 hover:bg-gray-200">
          <Printer className="w-4 h-4 mr-2" />
          Cetak
        </Button>
      </div>
    </div>
  );
};

export default GoodsRequest;
