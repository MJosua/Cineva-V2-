import { useToast } from "@/hooks/use-toast";

export interface FieldRule {
    key: string;
    label?: string;
    value: any;
    required?: boolean;
    minValue?: number;
    maxValue?: number;
    customValidate?: (value: any) => boolean;
}

/**
 * Validate multiple fields and show toast if invalid
 * Returns true if all valid, false otherwise.
 */

const { toast } = useToast();

export const validateFields = (fields: FieldRule[]): boolean => {
    for (const field of fields) {
        const { key, label, value, required, minValue, maxValue, customValidate } = field;
        const name = label || key;

        // Required check
        if (required && (value === "" || value === null || value === undefined)) {
            toast.error(`${name} cannot be empty`);
            return false;
        }

        // Numeric checks
        if (typeof value === "number") {
            if (minValue !== undefined && value < minValue) {
                toast.error(`${name} must be at least ${minValue}`);
                return false;
            }
            if (maxValue !== undefined && value > maxValue) {
                toast.error(`${name} cannot exceed ${maxValue}`);
                return false;
            }
        }

        // Custom validation
        if (customValidate && !customValidate(value)) {
            toast.error(`${name} is invalid`);
            return false;
        }
    }

    return true;
};