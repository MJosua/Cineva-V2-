import React, { useEffect, useMemo, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { FormField } from "@/types/formTypes";
import { SuggestionInsertInput } from "./SuggestionInsertInput";
import { compareValues } from "@/utils/dependencyResolver";
import axios from "axios";
import { API_URL } from "@/config/sourceConfig";

interface DynamicFieldProps {
  field: FormField;
  value: any;
  onChange: (value: any, fullOption?: any) => void;
  onBlur?: (name?: string) => void;
  setConfig?: React.Dispatch<React.SetStateAction<any>>;
  globalValues: Record<string, any>;
  setGlobalValues: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  watchedValues?: Record<string, any>;
  error?: string;
  isSubmitting?: boolean;
  setIsSubmitting?: React.Dispatch<React.SetStateAction<boolean>>;
  currentValue?: any;
}

export const DynamicField: React.FC<DynamicFieldProps> = ({
  field,
  value,
  onBlur,
  onChange,
  setConfig,
  globalValues,
  setGlobalValues,
  currentValue,
  watchedValues = {},
  error,
  isSubmitting,
  setIsSubmitting,
}) => {
  // 🖼️ Popup preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // ✅ keep field options fresh
  const resolvedOptions = useMemo(() => {
    if (!Array.isArray(field.options)) return [];
    return field.options.filter(Boolean);
  }, [field.options]);

  // ✅ unified handler for any value change
  const handleChange = (newValue: any, fullOption?: any) => {
    onChange(newValue, fullOption);
  };

  // ✅ default value sync
  useEffect(() => {
    if (
      (globalValues[field.name] === undefined || globalValues[field.name] === "") &&
      field.default
    ) {
      const defaultValue = Array.isArray(field.default)
        ? field.default.join(", ")
        : field.default;
      onChange(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBlur = useCallback(() => {
    if (typeof onBlur === "function") onBlur(field.name);
  }, [field.name, onBlur]);

  const fieldName = field.name || field.label?.toLowerCase()?.replace(/[^a-z0-9]/g, "_") || "unnamed_field";

  // 🧩 input renderer
  const renderField = () => {
    switch (field.type) {
      case "text":
        return (
          <Input
            value={globalValues[fieldName] ?? value ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            readOnly={field.readonly}
            required={field.required}
            className={error ? "border-red-500" : ""}
            onBlur={handleBlur}
          />
        );

      case "date":
        const dateVal = globalValues[fieldName] ?? value;
        // Ensure we can handle string dates safely
        const parsedDate = dateVal ? new Date(dateVal) : undefined;
        const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                disabled={field.readonly}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateVal && "text-muted-foreground",
                  error ? "border-red-500" : ""
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {isValidDate ? (
                  format(parsedDate!, "PPP")
                ) : (
                  <span>{field.placeholder || "Pick a date"}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={isValidDate ? parsedDate : undefined}
                onSelect={(date) => {
                  const formatted = date ? format(date, "yyyy-MM-dd") : "";
                  handleChange(formatted);
                  // Explicitly trigger blur since Calendar doesn't capture focus loss the same way
                  handleBlur();
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        );

      case "number":
        const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) =>
          handleChange(e.target.value);

        const handleNumberBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
          let val = e.target.value;
          let numVal = Number(val);
          const { maxnumber, rounding, minnumber } = field;
          if (!isNaN(numVal)) {
            if (maxnumber && numVal > maxnumber) numVal = maxnumber;
            if (minnumber && numVal < minnumber) numVal = minnumber;
            if (rounding) numVal = Math.round(numVal / 25) * 25;
          }
          handleChange(numVal.toString());
        };

        return (
          <Input
            type="number"
            value={globalValues[fieldName] ?? value ?? ""}
            onChange={handleNumberChange}
            onBlur={handleNumberBlur}
            required={field.required}
            placeholder={field.placeholder}
            readOnly={field.readonly}
            className={error ? "border-red-500" : ""}
          />
        );

      case "textarea":
        return (
          <Textarea
            value={globalValues[fieldName] ?? value ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            readOnly={field.readonly}
            className={error ? "border-red-500" : ""}
          />
        );

      case "select":
        return (
          <Select
            value={globalValues[fieldName]}
            required={field.required}
            onValueChange={(newVal) => {
              const found = resolvedOptions.find((opt) => compareValues(opt, newVal));
              handleChange(newVal, found);
              handleBlur();
            }}
            disabled={field.readonly}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              {resolvedOptions.map((option, index) => {
                let value = "";
                let label = "";
                if (option && typeof option === "object" && option !== null) {
                  value =
                    (option as any).value ??
                    (option as any).item_name ??
                    (option as any).label ??
                    (option as any).name ??
                    JSON.stringify(option);
                  label =
                    (option as any).label ??
                    (option as any).item_name ??
                    (option as any).name ??
                    value;
                } else if (option !== null && option !== undefined) {
                  value = String(option);
                  label = String(option);
                }
                return (
                  <SelectItem key={`${value}-${index}`} value={value}>
                    {label}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        );

      case "suggestion-insert":
        return (
          <SuggestionInsertInput
            suggestions={resolvedOptions}
            value={currentValue}
            readOnly={field.readonly}
            placeholder={field.placeholder}
            required={field.required}
            onChange={(val: any, full?: any) => handleChange(val, full)}
            onEnter={(val: any, full?: any) => {
              handleChange(val, full);
              handleBlur();
            }}
            onBlur={handleBlur}
          />
        );

      case "checkbox":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={!!currentValue}
              onCheckedChange={(v) => handleChange(v)}
              required={field.required}
              disabled={field.readonly}
            />
            <Label>{field.placeholder}</Label>
          </div>
        );

      case "toggle":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={!!currentValue}
              onCheckedChange={(v) => handleChange(v)}
              required={field.required}
              disabled={field.readonly}
            />
            <Label>{field.placeholder}</Label>
          </div>
        );

      case "time":
        // Generate time slots from 08:00 to 18:00 in 30-minute intervals
        const timeOptions = [];
        for (let hour = 8; hour <= 18; hour++) {
          const h = hour.toString().padStart(2, '0');
          timeOptions.push(`${h}:00`);
          if (hour < 18) { // Don't add 18:30 if 18:00 is the limit (or do, if needed. User asked 08:00-18:00)
            timeOptions.push(`${h}:30`);
          }
        }

        return (
          <Select
            value={globalValues[field.name] ?? value ?? ""}
            required={field.required}
            onValueChange={(newVal) => {
              handleChange(newVal);
              handleBlur();
            }}
            disabled={field.readonly}
          >
            <SelectTrigger className={error ? "border-red-500" : ""}>
              <SelectValue placeholder={field.placeholder || "Select time"} />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50 h-56">
              {timeOptions.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "file":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              multiple
              accept={field.accept?.join(",") || "*/*"}
              disabled={field.readonly || isSubmitting}
              required={field.required}
              className={error ? "border-red-500" : ""}
              onChange={async (e) => {
                const files = Array.from(e.target.files || []);
                if (!files.length) return;

                // 🔹 1. Calculate already uploaded total size (if available)
                const existingSize = (Array.isArray(value)
                  ? value.reduce((sum, file) => sum + (file.size || 0), 0)
                  : 0);

                // 🔹 2. Calculate new upload size
                const newFilesSize = files.reduce((sum, f) => sum + f.size, 0);

                const combinedSize = existingSize + newFilesSize;
                const maxSize = 3 * 1024 * 1024; // 3 MB

                if (combinedSize > maxSize) {
                  alert(`❌ Total uploaded files exceed 3 MB! Current total: ${(combinedSize / 1024 / 1024).toFixed(2)} MB`);
                  e.target.value = "";
                  return;
                }

                if (setIsSubmitting) setIsSubmitting(true);

                try {
                  const uploadedFiles = [];

                  for (const file of files) {
                    const formData = new FormData();
                    formData.append("file", file);

                    const res = await axios.post(
                      `${API_URL}/hots_ticket/upload/files/`,
                      formData,
                      {
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("hots_tokek")}`,
                          "Content-Type": "multipart/form-data",
                        },
                      }
                    );

                    const results = res.data.data || [];
                    results.forEach((data) => {
                      uploadedFiles.push({
                        upload_id: data.upload_id,
                        name: data.fileOriginalName || data.newName || file.name,
                        url: data.fileUrl,
                        type: file.type,
                        size: file.size, // 🔹 Store size for later validation
                      });
                    });
                  }

                  const existing = Array.isArray(value) ? value : [];
                  const updated = [...existing, ...uploadedFiles];
                  handleChange(updated);
                  e.target.value = "";
                } catch (err) {
                  console.error("Upload failed:", err);
                  alert("Upload failed. Please try again.");
                } finally {
                  if (setIsSubmitting) setIsSubmitting(false);
                }
              }}
            />

            {/* ✅ Preview Section */}
            <div className="flex flex-wrap gap-3 mt-2">
              {Array.isArray(value) &&
                value.map((file, index) => {
                  const isImage = file.type?.startsWith("image/");
                  const ext = file.name.split(".").pop()?.toLowerCase();

                  return (
                    <div
                      key={index}
                      className="relative border rounded-md p-2 flex flex-col items-center justify-center w-28 h-28 bg-gray-50 hover:shadow-md"
                    >
                      {isImage ? (
                        <img
                          src={`${API_URL}${file.url}`}
                          alt={file.name}
                          className="object-cover w-full h-full rounded-md cursor-pointer"
                          onClick={() => setPreviewImage(`${API_URL}${file.url}`)}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600">
                          <div className="text-4xl">
                            {ext === "pdf" ? "📄" : ext === "txt" ? "📝" : "📁"}
                          </div>
                          <span className="text-xs text-center truncate max-w-[80px]">
                            {file.name}
                          </span>
                        </div>
                      )}

                      {!field.readonly && (
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = value.filter((_, i) => i !== index);
                            handleChange(filtered);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs w-5 h-5 flex items-center justify-center hover:bg-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>

            <p className="text-xs text-gray-500">
              You can upload multiple files (max total 3 MB)
            </p>
          </div>
        );

      // 🎨 HTML FIELD – renders inline HTML from field definition
      case "html":
        const htmlContent = field.html || "";
        return (
          <div
            className={field.className || "cms-block"}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        );

      // 🎨 CMS FIELD – renders CMS page content from m_cms_page
      case "cms":
        // Helper function to render CMS blocks
        const renderCmsBlocks = (blocks: any[]) => {
          if (!Array.isArray(blocks)) return null;

          return blocks.map((block, idx) => {
            switch (block.type) {
              case "heading":
                return <h2 key={idx} className="cms-heading text-2xl font-semibold mb-2">{block.text}</h2>;

              case "text":
                return <p key={idx} className="cms-text mb-2">{block.text}</p>;

              case "html":
                return (
                  <div
                    key={idx}
                    className="cms-html"
                    dangerouslySetInnerHTML={{ __html: block.html }}
                  />
                );

              case "image":
                return (
                  <img
                    key={idx}
                    src={block.src}
                    alt={block.alt || ""}
                    className="cms-image w-full max-w-md rounded-md my-2"
                  />
                );

              case "divider":
                return <hr key={idx} className="cms-divider my-4 border-gray-300" />;

              default:
                return null;
            }
          });
        };

        // Get moduleInfo from parent component (need to pass as prop)
        // For now, just render a placeholder
        const cmsPageId = field.cms_page_id;
        const cmsBlocks = field.cms_content || []; // Will be populated by parent

        return (
          <div className={field.className || "cms-block p-4 rounded-md bg-gray-50"}>
            {renderCmsBlocks(cmsBlocks)}
          </div>
        );

      default:
        return (
          <Input
            value={globalValues[field.name] ?? value ?? ""}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            readOnly={field.readonly}
            className={error ? "border-red-500" : ""}
          />
        );
    }
  };

  return (
    <div
      className={`space-y-2 col-span-1 ${field.columnSpan === 2
        ? "md:col-span-2"
        : field.columnSpan === 3
          ? "md:col-span-3"
          : ""
        }`}
    >
      <Label htmlFor={field.name} className="flex items-center gap-2">
        {field.label}
        {field.required && <span className="text-red-500">*</span>}
        {field.dependsOn && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            🔗 Linked: {field.dependsOn}
          </span>
        )}
      </Label>
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {field.note && <p className="text-sm text-gray-500">{field.note}</p>}

      {/* 🖼️ Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative bg-white rounded-xl shadow-2xl p-2 max-w-4xl max-h-[90vh] flex flex-col items-center justify-center animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="rounded-lg max-h-[85vh] object-contain"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
