import React, { useEffect, useState } from 'react';
import { API_URL } from '@/config/sourceConfig';
import { useToast } from '@/hooks/use-toast';

export default function EngineModuleAdminPage(){
  const { toast } = useToast();
  const [modules,setModules]=useState([]);

  useEffect(()=>{
    fetch(`${API_URL}/enginemodule/admin/modules`)
      .then(r=>r.json())
      .then(j=>{
        if(!j.ok){ toast({title:"Error",description:j.message}); return;}
        setModules(j.modules);
      }).catch(e=>toast({title:"Error",description:e.message}));
  },[]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Engine Module Manager</h1>
      <ul className="space-y-2">
        {modules.map(m=>(
          <li key={m.service_id} className="p-3 bg-gray-800 rounded text-white">
            {m.module_key} — {m.module_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
