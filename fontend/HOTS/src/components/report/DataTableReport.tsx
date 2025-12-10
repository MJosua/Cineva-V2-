import React, { useState, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  FileSpreadsheet,
  FileText,
  Columns3,
  Filter,
  ArrowUpDown,
  PaintBucket,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { API_URL } from "@/config/sourceConfig";

// 🔹 Column Definition
interface Column<T> {
  header: string;
  accessor: keyof T;
  align?: "left" | "center" | "right";
  filterable?: boolean;
  sortable?: boolean;
  editable?: boolean;
  colorField?: keyof T;
  sticky?: string; // e.g. "left-0" or "left-[150px]"
}

interface DataTableReportProProps<T> {
  title?: string;
  data: T[];
  setData?: React.Dispatch<React.SetStateAction<T[]>>;
  columns: Column<T>[];
  searchKeys?: (keyof T)[];
  ticketKey?: keyof T;
  detailKey?: keyof T;
}

export function DataTableReportPro<T extends Record<string, any>>({
  title = "Report",
  data,
  setData,
  columns,
  searchKeys = [],
  ticketKey,
  detailKey,
}: DataTableReportProProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(columns.map((c) => String(c.accessor)))
  );
  const [sort, setSort] = useState<{ column: string; direction: "asc" | "desc" | null }>({
    column: "",
    direction: null,
  });
  const rowsPerPage = 10;

  // === SORT HANDLER ===
  const handleSort = (col: string) => {
    setSort((prev) => {
      if (prev.column !== col) return { column: col, direction: "asc" };
      if (prev.direction === "asc") return { column: col, direction: "desc" };
      return { column: "", direction: null };
    });
  };

  // === FILTER HANDLERS ===
  const toggleFilterValue = (col: string, value: string) => {
    setFilters((prev) => {
      const current = prev[col] || [];
      if (current.includes(value))
        return { ...prev, [col]: current.filter((v) => v !== value) };
      else return { ...prev, [col]: [...current, value] };
    });
    setPage(1);
  };
  const clearFilter = (col: string) => setFilters((prev) => ({ ...prev, [col]: [] }));

  const getUniqueValues = (col: keyof T): string[] => {
    const vals = Array.from(new Set(data.map((row) => String(row[col] ?? ""))));
    return vals.filter((v) => v.trim() !== "");
  };

  const toggleColumn = (accessor: string) => {
    setVisibleCols((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(accessor)) newSet.delete(accessor);
      else newSet.add(accessor);
      return newSet;
    });
  };

  // === FILTER + SORT + SEARCH ===
  const filteredData = useMemo(() => {
    let result = [...data];
    const term = search.toLowerCase();

    if (term && searchKeys.length > 0) {
      result = result.filter((row) =>
        searchKeys.some((key) => String(row[key]).toLowerCase().includes(term))
      );
    }

    Object.entries(filters).forEach(([col, values]) => {
      if (values.length > 0)
        result = result.filter((row) => values.includes(String(row[col])));
    });

    if (sort.column && sort.direction) {
      result.sort((a, b) => {
        const valA = String(a[sort.column]);
        const valB = String(b[sort.column]);
        return sort.direction === "asc"
          ? valA.localeCompare(valB, undefined, { numeric: true })
          : valB.localeCompare(valA, undefined, { numeric: true });
      });
    }

    return result;
  }, [data, search, filters, sort]);

  // === PAGINATION ===
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const start = (page - 1) * rowsPerPage;
  const paginatedData = filteredData.slice(start, start + rowsPerPage);

  // === EXPORT ===
  const handleExportExcel = () => {
    const visibleColumns = columns.filter((c) => visibleCols.has(String(c.accessor)));
    const exportData = filteredData.map((row) => {
      const obj: Record<string, any> = {};
      visibleColumns.forEach((col) => (obj[col.header] = row[col.accessor]));
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `${title}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.text(title, 14, 10);
    const visibleColumns = columns.filter((c) => visibleCols.has(String(c.accessor)));
    const tableColumn = visibleColumns.map((c) => c.header);
    const tableRows = filteredData.map((row) =>
      visibleColumns.map((c) => row[c.accessor])
    );
    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 20, styles: { fontSize: 8 } });
    doc.save(`${title}.pdf`);
  };

  // === EDIT HANDLER ===
  const handleEdit = async (
    ticket_id: string,
    detail_id: string,
    lbl_col: string,
    newValue: string,
    color?: string
  ) => {
    try {
      const token = localStorage.getItem("tokek");
      await axios.post(
        `${API_URL}/hotsdashboard/report_detail/upsert`,
        {
          ticket_id,
          detail_id,
          lbl_col,
          cstm_col: newValue,
          color_code: color || null,
          visible_to: "admin",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (setData) {
        setData((prev: any[]) =>
          prev.map((r) =>
            String(r.detail_id) === String(detail_id)
              ? { ...r, [lbl_col]: newValue, Color: color ?? r.Color }
              : r
          )
        );
      }
    } catch (err) {
      console.error("Error updating report detail:", err);
    }
  };

  // === RENDER ===
  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-64"
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 className="w-4 h-4 mr-2" /> Columns
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2">
              <div className="max-h-64 overflow-auto text-sm space-y-1">
                {columns.map((col) => (
                  <label key={String(col.accessor)} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={visibleCols.has(String(col.accessor))}
                      onChange={() => toggleColumn(String(col.accessor))}
                    />
                    <span>{col.header}</span>
                  </label>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full"
                onClick={() =>
                  setVisibleCols(new Set(columns.map((c) => String(c.accessor))))
                }
              >
                Show All
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
          <Button variant="outline" onClick={handleExportPDF}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="relative border rounded-md overflow-hidden max-w-full">
        <div
          className="overflow-auto max-h-[80vh] shadow-inner"
          style={{
            WebkitOverflowScrolling: "touch",
            position: "relative",
          }}
        >
          <table className="min-w-[1200px] w-full border-collapse text-sm relative">
            <thead className="bg-gray-100 sticky top-0 z-20">
              <tr>
                {columns
                  .filter((c) => visibleCols.has(String(c.accessor)))
                  .map((col, idx) => (
                    <th
                      key={idx}
                      className={`p-2 text-${col.align || "left"} font-semibold whitespace-nowrap ${
                        col.sticky
                          ? `sticky ${col.sticky} bg-white z-[20] shadow-sm`
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {col.sortable ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="px-1"
                            onClick={() => handleSort(col.accessor as string)}
                          >
                            {col.header}
                            <ArrowUpDown
                              className={`ml-1 w-3 h-3 ${
                                sort.column === col.accessor
                                  ? "text-blue-600"
                                  : "text-gray-400"
                              }`}
                            />
                          </Button>
                        ) : (
                          <span>{col.header}</span>
                        )}

                        {col.filterable && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-6 h-6 text-gray-500 hover:text-primary"
                              >
                                <Filter className="w-3 h-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2">
                              <div className="max-h-48 overflow-auto text-sm space-y-1">
                                {getUniqueValues(col.accessor).map((v) => (
                                  <label key={v} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={
                                        filters[col.accessor as string]?.includes(v)
                                      }
                                      onChange={() =>
                                        toggleFilterValue(col.accessor as string, v)
                                      }
                                    />
                                    <span>{v || "—"}</span>
                                  </label>
                                ))}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2 w-full"
                                onClick={() => clearFilter(col.accessor as string)}
                              >
                                Clear Filter
                              </Button>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((row, i) => {
                const ticket_id = ticketKey ? String(row[ticketKey]) : "";
                const detail_id = detailKey ? String(row[detailKey]) : "";

                return (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {columns
                      .filter((c) => visibleCols.has(String(c.accessor)))
                      .map((col, j) => {
                        const color = col.colorField ? row[col.colorField] : undefined;
                        return (
                          <td
                            key={j}
                            className={`p-2 text-${col.align || "left"} whitespace-nowrap ${
                              col.sticky
                                ? `sticky ${col.sticky} bg-white z-[10] border-r`
                                : ""
                            }`}
                            style={{
                              backgroundColor:
                                row["Color"] ||
                                (col.sticky ? "inherit" : "white"),
                            }}
                          >
                            {col.accessor === "Color" ? (
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded border"
                                  style={{
                                    backgroundColor: row["Color"] || "#ffffff",
                                  }}
                                  title={row["Color"]}
                                />
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-6 h-6 p-0"
                                    >
                                      <PaintBucket className="w-4 h-4" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-2 w-40">
                                    <div className="grid grid-cols-5 gap-2">
                                      {[
                                        "#fff59d",
                                        "#c8e6c9",
                                        "#bbdefb",
                                        "#ffcdd2",
                                        "#f0f0f0",
                                      ].map((clr) => (
                                        <div
                                          key={clr}
                                          className="w-6 h-6 rounded cursor-pointer border"
                                          style={{ backgroundColor: clr }}
                                          onClick={() =>
                                            handleEdit(
                                              ticket_id,
                                              detail_id,
                                              "Color",
                                              row["Remarks"],
                                              clr
                                            )
                                          }
                                        />
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            ) : col.editable ? (
                              <input
                                defaultValue={row[col.accessor]}
                                className="border px-2 py-1 rounded text-sm w-full"
                                onBlur={(e) =>
                                  handleEdit(
                                    ticket_id,
                                    detail_id,
                                    String(col.accessor),
                                    e.target.value,
                                    color
                                  )
                                }
                              />
                            ) : (
                              row[col.accessor]
                            )}
                          </td>
                        );
                      })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center pt-2 flex-wrap">
          <div className="text-sm text-gray-600">
            Page {page} of {totalPages || 1}
          </div>
          <div className="space-x-2 mt-2 sm:mt-0">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
