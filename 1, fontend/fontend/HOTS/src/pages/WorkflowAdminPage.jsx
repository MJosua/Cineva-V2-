import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { API_URL } from "@/config/sourceConfig";
import { toast } from "@/components/ui/use-toast";

import ServiceSelector from "@/components/workflow/ServiceSelector";
import WorkflowTable from "@/components/workflow/WorkflowTable";
import WorkflowFormModal from "@/components/workflow/WorkflowFormModal";
import WorkflowFlowchart from "@/components/workflow/WorkflowFlowchart";
import WorkflowParamsModal from "@/components/workflow/WorkflowParamsModal";

import {
  getWorkflow,
  addWorkflow,
  deleteWorkflow,
  updateWorkflow,
  getParams,
  saveParam
} from "@/api/workflowAdmin";

export default function WorkflowAdminPage() {
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [levels, setLevels] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // params modal
  const [showParams, setShowParams] = useState(false);
  const [paramTarget, setParamTarget] = useState(null);
  const [params, setParams] = useState([]);

  /* -------------------------------------------------------
     LOAD SERVICES
  -------------------------------------------------------- */
  useEffect(() => {
    fetch(`${API_URL}/enginemodule/admin/modules`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.ok) {
          toast({ title: "Error", description: j.message });
          return;
        }
        setServices(j.modules || j.data || []);
      })
      .catch((e) => toast({ title: "Error", description: e.message }));
  }, []);

  /* -------------------------------------------------------
     LOAD WORKFLOW LEVELS
  -------------------------------------------------------- */
  useEffect(() => {
    if (!serviceId) {
      setLevels([]);
      return;
    }
    loadWorkflow();
  }, [serviceId]);

  const loadWorkflow = async () => {
    try {
      const res = await getWorkflow(serviceId);
      if (!res?.data) {
        toast({ title: "Error", description: "Invalid workflow response" });
        setLevels([]);
        return;
      }
      // make sure params object exists on each step
      const rows = (res.data.levels || []).map((r) => ({ ...r, params: r.params || {} }));
      setLevels(rows);
    } catch (err) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err.message
      });
      setLevels([]);
    }
  };

  /* -------------------------------------------------------
     HANDLERS
  -------------------------------------------------------- */
  const addNew = () => {
    setEditing(null);
    setShowModal(true);
  };

  const save = async (form) => {
    try {
      if (editing) {
        await updateWorkflow(editing.workflow_id, form);
      } else {
        await addWorkflow({ ...form, service_id: serviceId });
      }
      setShowModal(false);
      loadWorkflow();
      toast({ title: "Saved", description: "Workflow updated successfully" });
    } catch (err) {
      console.error("save error", err);
      toast({
        title: "Error on save",
        description: err?.response?.data?.message || err.message
      });
    }
  };

  const remove = async (id) => {
    try {
      await deleteWorkflow(id);
      loadWorkflow();
      toast({ title: "Deleted", description: "Workflow step deleted" });
    } catch (err) {
      toast({
        title: "Error",
        description: err?.response?.data?.message || err.message
      });
    }
  };

  /* -------------------------------------------------------
     PARAMS MODAL HANDLERS
  -------------------------------------------------------- */
  const openParams = async (row) => {
    setParamTarget(row);
    try {
      const res = await getParams(row.workflow_id);
      setParams(res.data.params || []);
    } catch (err) {
      toast({ title: "Error", description: err?.message || "Failed to load params" });
      setParams([]);
    }
    setShowParams(true);
  };

  const addParam = async (workflow_id, key, value) => {
    try {
      await saveParam(workflow_id, { param_key: key, param_value: value });
      // reload
      const res = await getParams(workflow_id);
      setParams(res.data.params || []);
    } catch (err) {
      toast({ title: "Error", description: err?.message || "Failed to save param" });
    }
  };

  const deleteParam = async (param_id) => {
    // TODO: implement backend delete param API
    toast({ title: "Info", description: "Delete param API not implemented yet" });
  };

  /* -------------------------------------------------------
     RENDER
  -------------------------------------------------------- */
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Workflow Editor</h1>

      <div className="max-w-xs mb-4">
        <ServiceSelector services={services} serviceId={serviceId} onChange={setServiceId} />
      </div>

      <Button className="mb-4" onClick={addNew}>Add Workflow Step</Button>

      <WorkflowFlowchart levels={levels} />

      <WorkflowTable
        levels={levels}
        onEdit={(row) => { setEditing(row); setShowModal(true); }}
        onDelete={remove}
        onParams={openParams}
      />

      <WorkflowFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={save}
        initial={editing}
      />

      <WorkflowParamsModal
        isOpen={showParams}
        onClose={() => setShowParams(false)}
        workflow={paramTarget}
        params={params}
        onAddParam={addParam}
        onDeleteParam={deleteParam}
      />
    </div>
  );
}
