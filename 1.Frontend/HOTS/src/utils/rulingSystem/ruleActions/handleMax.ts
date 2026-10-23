// utils/rules/ruleActions/handleMax.ts
export function handleMax(field: any, ruleThen: any) {
    if (ruleThen.maxnumber !== undefined) {
      field.maxnumber = ruleThen.maxnumber;
    }
    if (ruleThen.minnumber !== undefined) {
      field.minnumber = ruleThen.minnumber;
    }
    return field;
  }
  