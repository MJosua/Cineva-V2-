import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TicketFormPreview({ formValues }) {
  if (!formValues) return <p>No form data available.</p>;

  const entries = Object.entries(formValues);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Data</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {entries.map(([key, val]) => {
          // rowgroup
          if (Array.isArray(val)) {
            return (
              <div key={key}>
                <p className="font-semibold mb-1">{key}</p>

                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(val[0] || {}).map((col) => (
                        <th className="border px-2 py-1" key={col}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {val.map((row, idx) => (
                      <tr key={idx}>
                        {Object.keys(row).map((col) => (
                          <td className="border px-2 py-1" key={col}>
                            {row[col]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          // simple field
          return (
            <div key={key}>
              <p className="text-sm text-muted-foreground">{val.label || key}</p>
              <div className="font-medium">{val.value || "-"}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
