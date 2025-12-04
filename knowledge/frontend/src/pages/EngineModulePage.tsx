import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_URL } from "@/config/sourceConfig";
import { DynamicForm } from "@/components/forms/DynamicForm";
import { useToast } from "@/hooks/use-toast";

export default function EngineModulePage() {
  const { moduleKey } = useParams();
  const { toast } = useToast();

  const [moduleData, setModuleData] = useState(null);
  const [formConfig, setFormConfig] = useState(null); // ✅ allow DynamicForm to modify config

  useEffect(() => {
    async function loadModule() {
      try {
        const res = await fetch(`${API_URL}/enginemodule/admin/modules/${moduleKey}`);
        const json = await res.json();

        if (!json.ok) {
          toast({
            title: "Engine Error",
            description: json.message,
            variant: "destructive",
          });
          return;
        }

        setModuleData(json.module);
        setFormConfig(json.module.form_json); // ✅ store editable schema
      } catch (err) {
        toast({ title: "Error", description: err.message, variant: "destructive" });
      }
    }

    loadModule();
  }, [moduleKey]);
  console.log("moduledata",moduleData)
  if (!moduleData || !formConfig)
    return <div className="p-4 text-gray-500">Loading engine module...</div>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        Engine Module: {moduleData.module_name}
      </h1>

      <DynamicForm
        config={formConfig}
        setConfig={setFormConfig}        // ✅ FIXED
        onSubmit={() => {}}              // (unused in module engine mode)
        serviceId={moduleData.service_id} // 🔥 FIXED — REQUIRED FOR ENGINE
        moduleKey={moduleKey}            // for engine module submit()
        handleReload={() => {}}         
      />
    </div>
  );
}
