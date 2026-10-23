import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
  } from "@/components/ui/dialog";
  
  import { Input } from "@/components/ui/input";
  import { Button } from "@/components/ui/button";
  import { useState, useEffect } from "react";
  
  export default function WorkflowParamsModal({
    isOpen,
    onClose,
    workflow,
    loadParams,
    params,
    onAddParam,
    onDeleteParam,
  }) {
    const [keyName, setKeyName] = useState("");
    const [value, setValue] = useState("");
  
    useEffect(() => {
      if (workflow) {
        setKeyName("");
        setValue("");
      }
    }, [workflow]);
  
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Workflow Parameters (Level {workflow?.level})
            </DialogTitle>
          </DialogHeader>
  
          <div className="space-y-4 py-2">
  
            {/* Add param */}
            <div className="space-y-2 border p-3 rounded-md bg-neutral-50 dark:bg-neutral-900">
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
              <Button
                onClick={() => {
                  if (!keyName.trim()) return;
                  onAddParam(workflow.workflow_id, keyName, value);
                  setKeyName("");
                  setValue("");
                }}
              >
                Add Parameter
              </Button>
            </div>
  
            {/* Existing params */}
            <div>
              <h2 className="font-semibold">Existing</h2>
              <ul className="space-y-2">
                {params.map((p) => (
                  <li
                    key={p.param_key}
                    className="flex justify-between p-3 border rounded-md bg-white dark:bg-neutral-800"
                  >
                    <div>
                      <div className="font-medium">{p.param_key}</div>
                      <div className="text-gray-600 dark:text-gray-300">
                        {p.param_value}
                      </div>
                    </div>
  
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDeleteParam(p.param_id)}
                    >
                      Delete
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
  
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  