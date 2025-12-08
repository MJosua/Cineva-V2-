import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function TicketRevisionCompare({ oldData, newData }) {
  if (!oldData || !newData) return null;

  const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revision Comparison</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {allKeys.map((key) => {
          let o = oldData[key];
          let n = newData[key];

          const changed =
            (o?.value !== n?.value) ||
            JSON.stringify(o) !== JSON.stringify(n);

          return (
            <div
              key={key}
              className={`p-3 rounded border ${
                changed ? "border-red-500 bg-red-50 dark:bg-red-900/30" : "border-muted"
              }`}
            >
              <p className="font-semibold">{key}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Old</p>
                  <pre className="whitespace-pre-wrap">
                    {typeof o === "object" ? JSON.stringify(o, null, 2) : o}
                  </pre>
                </div>

                <div>
                  <p className="text-muted-foreground">New</p>
                  <pre className="whitespace-pre-wrap">
                    {typeof n === "object" ? JSON.stringify(n, null, 2) : n}
                  </pre>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
