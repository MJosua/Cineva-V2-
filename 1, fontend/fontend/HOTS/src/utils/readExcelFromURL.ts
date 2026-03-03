import * as XLSX from 'xlsx';
import axios from 'axios';

export const readExcelFromUrl = async (url: string): Promise<string[][]> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const workbook = XLSX.read(response.data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
  return jsonData;
};
