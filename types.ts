
export enum ClassLevel {
  P1 = 'P1', P2 = 'P2', P3 = 'P3',
  P4 = 'P4', P5 = 'P5', P6 = 'P6', P7 = 'P7'
}

export enum Stream {
  Red = 'Red',
  Blue = 'Blue',
  Green = 'Green'
}

export enum Gender {
  Male = 'M',
  Female = 'F'
}

export enum AssessmentType {
  BOT = 'BOT', // Beginning of Term
  EOT = 'EOT'  // End of Term
}

export interface SpecialCases {
  absenteeism: boolean;
  sickness: boolean;
  fees: boolean;
}

export interface Student {
  id?: number; // IndexedDB auto-increment
  indexNumber: string;
  name: string;
  classLevel: ClassLevel;
  stream: Stream;
  gender: Gender;
  paycode?: string;
  parentName?: string; // Added for profile
  parentContact?: string; // Added for profile
  specialCases: SpecialCases;
}

export interface Teacher {
  id?: number;
  name: string;
  gender: Gender;
  phone: string;
  email: string;
  roles: string[]; // 'Class Teacher' | 'Subject Teacher' | 'Headteacher' | 'DOS'
  assignedClass?: ClassLevel;
  assignedStream?: Stream;
  subjects: string[];
  teachingClasses: ClassLevel[];
}

export interface SubjectMarks {
  english?: number;
  maths?: number;
  science?: number; // P4-P7
  sst?: number;     // P4-P7
  literacy1?: number; // P1-P3
  literacy2?: number; // P1-P3
}

export interface MarkRecord {
  id?: number;
  studentId: number;
  term: number;
  year: number;
  type: AssessmentType;
  marks: SubjectMarks;
  aggregate: number;
  division: string;
}

export interface SchoolSettings {
  id?: string; // Fixed key 'config'
  schoolName: string;
  addressBox: string;
  contactPhones: string;
  motto: string;
  regNumber: string;
  centreNumber: string;
  logoBase64?: string;
  currentTerm: number;
  currentYear: number;
  nextTermBeginBoarders: string;
  nextTermBeginDay: string;
}

export const SUBJECTS_LOWER = ['english', 'maths', 'literacy1', 'literacy2'];
export const SUBJECTS_UPPER = ['english', 'maths', 'science', 'sst'];
export const ALL_SUBJECTS = [...new Set([...SUBJECTS_LOWER, ...SUBJECTS_UPPER])];
