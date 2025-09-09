// generated file - do not edit

export interface KnexMigrations {
  id: number;
  name?: string;
  batch?: number;
  migration_time?: string;
}

export interface KnexMigrationsLock {
  index: number;
  is_locked?: number;
}

export interface Prefectures {
  id: number;
  name: string;
}

export interface Sites {
  id: number;
  name: string;
  type: string;
  prefecture_id: number;
  address?: string;
  lat?: string;
  lng?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface GoshuinRecords {
  id: number;
  site_id: number;
  image_path: string;
  visit_date: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
