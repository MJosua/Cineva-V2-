// utils/rules/ruleActions/handleRounding.ts
export function handleRounding(field: any, ruleThen: any) {
    if (ruleThen.rounding !== undefined) {
      field.rounding = ruleThen.rounding;
    }
    return field;
  }
  