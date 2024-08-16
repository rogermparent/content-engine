export interface Education {
  school?: string;
  achievement?: string;
  startDate?: string;
  endDate?: string;
}

export interface Experience {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface Project {
  name?: string;
  url?: string[];
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface Resume {
  date: number;
  job: string;
  company: string;
  skills?: string[];
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  education?: Education[];
  experience?: Experience[];
  projects?: Project[];
}

export type ResumeEntryKey = [date: number, slug: string];
export interface ResumeEntryValue {
  job: string;
  company: string;
}

export interface ResumeEntry {
  key: ResumeEntryKey;
  value: ResumeEntryValue;
  version?: number;
}
