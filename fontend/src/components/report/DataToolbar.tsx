import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, FileText, Columns3 } from "lucide-react";

interface ToolbarItem {
  id: string;
  type: "search" | "select" | "button" | "export" | "toggle";
  label?: string;
  placeholder?: string;
  width?: string;
  order?: number;
  value?: string;
  options?: { label: string; value: string }[];
  onChange?: (value: string) => void;
  onClick?: () => void;
}

interface DataToolbarProps {
  items: ToolbarItem[];
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  onToggleColumns?: () => void;
}

export const DataToolbar: React.FC<DataToolbarProps> = ({
  items,
  onExportExcel,
  onExportPDF,
  onToggleColumns,
}) => {
  const sortedItems = [...items].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {sortedItems.map((item) => {
        switch (item.type) {
          case "search":
            return (
              <Input
                key={item.id}
                placeholder={item.placeholder || item.label}
                value={item.value || ""}
                onChange={(e) => item.onChange?.(e.target.value)}
                className={item.width || "w-48"}
              />
            );

          case "select":
            return (
              <Select key={item.id} value={item.value} onValueChange={item.onChange!}>
                <SelectTrigger className={item.width || "w-40"}>
                  <SelectValue placeholder={item.label} />
                </SelectTrigger>
                <SelectContent>
                  {item.options?.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            );

          case "button":
            return (
              <Button key={item.id} onClick={item.onClick}>
                {item.label}
              </Button>
            );

         

          case "toggle":
            return (
              <Button
                key={item.id}
                variant="outline"
                onClick={onToggleColumns}
                title="Toggle Column Visibility"
              >
                <Columns3 className="w-4 h-4 mr-1" /> Columns
              </Button>
            );

          default:
            return null;
        }
      })}
    </div>
  );
};
