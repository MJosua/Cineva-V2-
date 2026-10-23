export interface factoryplant {
  plan_id: number;
  plant_no: number;
  plant_description: string;
  plant_shortname: string;
  country_id?: number;
  creation_date?: string;
  finished_date?: string;
}

export interface linkeddistributor {
  company_id: number;
  company_name: string;
}


export interface srfsamplecategory {
  samplecat_id: number;
  samplecat_name: string;
  samplecat_shortname: string;
  description: string;
  qty_type: number;
  creation_date: string;
  finished_date: string;
  samplecat_group: number;
}