import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getParams, saveParam } from "@/api/workflowAdmin";
import { toast } from "@/components/ui/use-toast";

function WorkflowParamEditorPage() {
  const { workflow_id } = useParams();
  const navigate = useNavigate();

  const [params, setParams] = useState([]);
  const [keyName, setKeyName] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    loadParams();
  }, [workflow_id]);

  const loadParams = async () => {
    try {
      const res = await getParams(workflow_id);
      setParams(res.data.params || []);
    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  };

  const addParam = async () => {
    if (!keyName.trim()) {
      toast({ title: "Required", description: "Param key cannot be empty" });
      return;
    }

    try {
      await saveParam(workflow_id, {
        param_key: keyName,
        param_value: value
      });

      setKeyName("");
      setValue("");
      loadParams();
      toast({ title: "Added", description: "Parameter added." });
    } catch (err) {
      toast({ title: "Error", description: err.message });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-xl">
      <Button variant="outline" onClick={() => navigate(-1)}>
        ← Back
      </Button>

      <h1 className="text-2xl font-bold">Workflow Parameters</h1>

      {/* Add new param */}
      <div className="space-y-2 p-4 border rounded-lg bg-white shadow-sm dark:bg-neutral-900">
        <Input
          placeholder="Parameter Key"
          value={keyName}
          onChange={(e) => setKeyName(e.target.value)}
        />
        <Input
          placeholder="Parameter Value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Button onClick={addParam}>Add Parameter</Button>
      </div>

      {/* Existing params */}
      <div>
        <h2 className="font-semibold text-lg mb-2">Existing Parameters</h2>

        <ul className="space-y-2">
          {params.map((p, i) => (
            <li
              key={`${p.param_key}-${i}`}
              className="p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-800"
            >
              <div className="font-medium">{p.param_key}</div>
              <div className="text-gray-600 dark:text-gray-300">
                {p.param_value}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default WorkflowParamEditorPage;
