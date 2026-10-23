import React, { useEffect, useState } from 'react';
import { readExcelFromUrl } from '@/utils/readExcelFromURL'; // your util

interface ExcelPreviewProps {
  url: string;
}

const ExcelPreview: React.FC<ExcelPreviewProps> = ({ url }) => {
  const [data, setData] = useState<any[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExcel = async () => {
      try {
        const parsedData = await readExcelFromUrl(url);
        setData(parsedData);
      } catch (err) {
        console.error('Failed to load Excel:', err);
      } finally {
        setLoading(false);
      }
    };

    if (url) loadExcel();
  }, [url]);

  if (loading) return <p className="text-gray-400">Loading Excel preview...</p>;

  if (!data.length) return <p className="text-red-400">No data found in Excel.</p>;

  return (
    <table className="border w-full text-sm text-left">
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border px-2 py-1">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default ExcelPreview;
