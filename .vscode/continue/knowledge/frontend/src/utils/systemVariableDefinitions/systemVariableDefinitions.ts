import { useAppSelector } from '@/hooks/useAppSelector';
import { useEffect } from 'react';

export type VariableType = 'string' | 'string[]' | 'array' | 'object' | 'array[]';


export interface SystemVariableContext {
  user?: {
    uid?: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    department_name?: string;
    division_name?: string;
  };
  superior?: { name?: string; username?: string;[key: string]: any }[];
  departments?: { department_name: string;[key: string]: any }[];
  divisions?: { division_name: string;[key: string]: any }[];
  teams?: { team_name: string }[];
  factoryplants?: { plant_shortname?: string; plant_description?: string;[key: string]: any }[];
  srfsamplecategoryes?: { samplecat_name: string;[key: string]: any }[];
  linkeddistributors?: { company_name: string;[key: string]: any }[];
  skulist?: { label: string; filter1: string;[key: string]: any }[];
  analyst?: { name: string;[key: string]: any }[];
  country?: { country: string;[key: string]: any }[];
  srf_purpose?: {
    [key: string]: any;
    purpose: string;
  }
  srf_po?: { po_number: string;[key: string]: any }[];
  srf_todaysweek?: { actualWeek: number;[key: string]: any }[];
  meetingrooms?: { id: number; name: string; capacity?: number; location?: string }[];
}

export const useSystemVariableContext = (): SystemVariableContext => {
  const auth = useAppSelector(state => state.auth);
  const userManagement = useAppSelector(state => state.userManagement);
  //srf
  const srf = useAppSelector(state => state.srf);
  const sku = useAppSelector(state => state.sku);
  const srf_purpose = useAppSelector(state => state.srf_purpose)
  const srf_po = useAppSelector(state => state.srf_purpose)
  //ps
  const analyst = useAppSelector(state => state.analyst);
  const country = useAppSelector(state => state.country);

  //meetingbook
  const meetingroom = useAppSelector((state) => state.meetingroom);


  const srf_todaysweek = useAppSelector(state => state.srf_todaysweek);
  return {
    user: auth.user,
    superior: userManagement.users?.filter(u =>
      u.role_name?.toLowerCase().includes('manager') ||
      u.role_name?.toLowerCase().includes('supervisor')
    ) || [],
    departments: userManagement.departments?.map(d => ({
      department_name: d.department_name,
      ...d
    })) || [],
    divisions: userManagement.departments?.map(d => ({
      division_name: d.department_name, // Use department_name as division_name fallback
      ...d
    })) || [],
    teams: userManagement.teams || [],
    factoryplants: srf.factoryplants?.map(f => ({
      plant_shortname: f.plant_shortname || '',
      plant_description: f.plant_description || '',
      ...f
    })) || [],
    srfsamplecategoryes: srf.srfsamplecategoryes || [],
    linkeddistributors: srf.linkeddistributors?.map(d => ({
      company_name: d.company_name || '',
      ...d
    })) || [],
    skulist: sku.skulist || [],
    analyst: analyst.data || [],
    country: (country as any)?.data || [],
    srf_purpose: (srf_purpose as any)?.data || {},
    srf_po: (srf_po as any)?.data || {},
    srf_todaysweek: (srf_todaysweek as any)?.data || {},
    meetingrooms: meetingroom?.rooms || [],
  };


};


export interface SystemVariableEntry {
  key: string;
  type: VariableType;
  description: string;
  resolve: (ctx: SystemVariableContext, options?: Record<string, any>) => any;
}

export const SYSTEM_VARIABLE_ENTRIES: SystemVariableEntry[] = [
  {
    key: '${user}',
    type: 'string',
    description: 'Full name or UID of the current user',
    resolve: (ctx) => {
      const { firstname, lastname, uid } = ctx.user || {};
      if (firstname || lastname) return `${firstname || ''} ${lastname || ''}`.trim();
      return uid || '';
    },
  },
  {
    key: '${user.email}',
    type: 'string',
    description: 'Email address of the current user',
    resolve: (ctx) => ctx.user?.email || '',
  },
  {
    key: '${user.department}',
    type: 'string',
    description: 'Department name of the current user',
    resolve: (ctx) => ctx.user?.department_name || '',
  },
  {
    key: '${user.division}',
    type: 'string',
    description: 'Division name of the current user',
    resolve: (ctx) => ctx.user?.division_name || '',
  },
  {
    key: '${superior}',
    type: 'string[]',
    description: 'List of supervisors/managers',
    resolve: (ctx) => ctx.superior?.map(s => s.name || s.username) || [],
  },
  {
    key: '${departments}',
    type: 'string[]',
    description: 'All departments',
    resolve: (ctx) => ctx.departments?.map(d => d.department_name) || [],
  },
  {
    key: '${divisions}',
    type: 'string[]',
    description: 'All divisions',
    resolve: (ctx) => ctx.divisions?.map(d => d.division_name) || [],
  },
  {
    key: '${teams}',
    type: 'string[]',
    description: 'All teams',
    resolve: (ctx) => ctx.teams?.map(t => t.team_name) || [],
  },
  {
    key: '${factoryplants}',
    type: 'string[]',
    description: 'Factory plant objects with id and label for filtering',
    resolve: (ctx) => {
      if (!Array.isArray(ctx.factoryplants)) return [];
      return ctx.factoryplants.map(item => ({
        item_name: item.plant_shortname,
        filter: item.plant_id
      }));
    },
  },
  {
    key: '${srfsamplecategoryes}',
    type: 'array[]',
    description: 'SRF sample category names',
    resolve: (ctx) => {
      if (!Array.isArray(ctx.srfsamplecategoryes)) return [];
      return ctx.srfsamplecategoryes.map(item => ({
        item_name: item.samplecat_name,
        filter: item.bom_type
      }));
    },
  },
  {
    key: '${linkeddistributors}',
    type: 'string[]',
    description: 'Linked distributor names',
    resolve: (ctx) => {
      if (!Array.isArray(ctx.srfsamplecategoryes)) return [];
      return ctx.linkeddistributors.map(item => ({
        item_name: item.company_name,
        filter: item.company_id
      }));
    }
  },
  {
    key: '${skulist}',
    type: 'array[]',
    description: 'List all SKUs and RM Types grouped by category',
    resolve: (ctx) => {
      if (!Array.isArray(ctx.skulist)) return [];
      return ctx.skulist.map(item => ({
        item_name: item.product_name_complete,
        filter: item.rm_type
      }));
    },
  },
  {
    key: '${analystlist}',
    type: 'string[]',
    description: 'List All Analysts',
    resolve: (ctx) => ctx.analyst?.map(d => `${d.employee_id}:${d.name}`) || [],
  },
  {
    key: '${countrylist}',
    type: 'string[]',
    description: 'Country objects with id and employee for filtering',
    resolve: (ctx) => ctx.country?.map(f => `${f.country_id}:${f.country}`) || [],
  },
  {
    key: '${srf_purpose}',
    type: 'string[]',
    description: 'List All purpose for srf',
    resolve: (ctx) => Array.isArray(ctx.srf_purpose) ? ctx.srf_purpose.map(d => d.purpose) : [],
  },
  {
    key: '${ponumber}',
    type: 'string[]',
    description: 'List All PO for current company in Deliver To for srf',
    resolve: (ctx) => Array.isArray(ctx.srf_purpose) ? ctx.srf_purpose.map(d => d.purpose) : [],
  },
  {
    key: '${typesrf}',
    type: 'object[]',
    description: 'Manually defined SRF purposes with filter mapping',
    resolve: () => [
      {
        item_name: 'pcs',
        filter: '1, 2, 3',
      },
      {
        item_name: 'ctns',
        filter: '0, 4, 5',
      },
    ],
  },
  {
    key: '${todaysweek}',
    type: 'number[]',
    description: 'Get today`s week',
    resolve: (ctx) => ctx.srf_todaysweek?.actualWeek ?? 0,
  },
  {
    key: '${today}',
    type: 'string',
    description: 'Current date (YYYY-MM-DD)',
    resolve: () => {
      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    },
  },
  {
    key: '${meetingrooms}',
    type: 'array[]',
    description: 'List of available meeting rooms',
    resolve: (ctx) => {
      if (!Array.isArray(ctx.meetingrooms)) return [];
      return ctx.meetingrooms.map(room => ({
        item_name: room.room_name,
        filter: room.id,
      }));
    },
  },
];
