
import { createClient } from '@supabase/supabase-js';
import { Student, Teacher, MarkRecord, SchoolSettings } from "../types";

// --- SUPABASE CONFIGURATION ---
const SUPABASE_URL = 'https://izhsulkxtqousdzmggbp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6aHN1bGt4dHFvdXNkem1nZ2JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1MjcxMzgsImV4cCI6MjA3OTEwMzEzOH0.ItDALqrSXSPqB2bS-zC7n9gD7E36EVR1Hc7TRmS1N2ME';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- API IMPLEMENTATION ---

export const dbService = {
  // --- STUDENTS ---
  getStudents: async () => {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name', { ascending: true });
    if (error) throw error;
    return data as Student[];
  },

  addStudent: async (s: Student) => {
    // Remove ID if it exists to let DB generate it
    const { id, ...rest } = s; 
    const { data, error } = await supabase
        .from('students')
        .insert([rest])
        .select()
        .single();
    
    if (error) throw error;
    return data.id;
  },

  // Optimized Bulk Insert for CSV Imports
  addStudents: async (students: Student[]) => {
    // Clean data: remove IDs to allow DB to generate them
    const cleanStudents = students.map(({ id, ...rest }) => rest);
    
    const { data, error } = await supabase
        .from('students')
        .insert(cleanStudents)
        .select();
    
    if (error) throw error;
    return data;
  },

  updateStudent: async (s: Student) => {
    if (!s.id) throw new Error("Cannot update student without ID");
    const { error } = await supabase
        .from('students')
        .update(s)
        .eq('id', s.id);
    if (error) throw error;
  },
  
  // Robust Delete Logic
  deleteStudent: async (id: number | string) => {
    try {
        // 1. Delete related Marks first
        // We allow this to proceed even if marks deletion "fails" (e.g. no marks found)
        // but we check for hard errors like permissions
        const { error: marksError } = await supabase
            .from('marks')
            .delete()
            .eq('studentId', id);
        
        if (marksError) throw marksError;

        // 2. Delete Student
        const { error: studentError } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (studentError) throw studentError;
    } catch (error) {
        console.error("Delete operation failed:", error);
        throw error;
    }
  },
  
  // --- TEACHERS ---
  getTeachers: async () => {
    const { data, error } = await supabase.from('teachers').select('*');
    if (error) throw error;
    return data as Teacher[];
  },

  addTeacher: async (t: Teacher) => {
    const { id, ...rest } = t;
    const { data, error } = await supabase
        .from('teachers')
        .insert([rest])
        .select()
        .single();
    if (error) throw error;
    return data.id;
  },

  updateTeacher: async (t: Teacher) => {
    if (!t.id) throw new Error("Cannot update teacher without ID");
    const { error } = await supabase.from('teachers').update(t).eq('id', t.id);
    if (error) throw error;
  },

  deleteTeacher: async (id: number) => {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
  },
  
  // --- MARKS ---
  getMarks: async () => {
    const { data, error } = await supabase.from('marks').select('*');
    if (error) throw error;
    return data as MarkRecord[];
  },

  saveMark: async (m: MarkRecord) => {
    // Check if mark exists for this Student + Term + Year + Type
    const { data: existing, error: fetchError } = await supabase
        .from('marks')
        .select('id')
        .eq('studentId', m.studentId)
        .eq('term', m.term)
        .eq('year', m.year)
        .eq('type', m.type)
        .maybeSingle();
    
    if (fetchError) throw fetchError;

    if (existing) {
        // Update
        const { error } = await supabase
            .from('marks')
            .update(m)
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        // Insert
        const { id, ...rest } = m; // exclude ID
        const { error } = await supabase.from('marks').insert([rest]);
        if (error) throw error;
    }
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<SchoolSettings> => {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 'config')
        .maybeSingle();
    
    if (error) {
        console.error("Error fetching settings:", error);
    }

    if (data) {
        return data as SchoolSettings;
    } else {
        // Return defaults if DB is empty or connection fails
        return {
            id: 'config',
            schoolName: 'BROADWAY NURSERY AND PRIMARY SCHOOL',
            addressBox: 'P.O.BOX 10, NAAMA-MITYANA',
            contactPhones: '0772324288  0709087676  0744073812',
            motto: 'WE BUILD FOR THE FUTURE',
            regNumber: 'ME/P/10247',
            centreNumber: '670135',
            currentTerm: 1,
            currentYear: new Date().getFullYear(),
            nextTermBeginBoarders: '',
            nextTermBeginDay: ''
        };
    }
  },

  saveSettings: async (s: SchoolSettings) => {
    // Upsert settings
    const { error } = await supabase
        .from('settings')
        .upsert({ ...s, id: 'config' });
    if (error) throw error;
  },

  // --- DATA MIGRATION HELPERS ---

  exportData: async () => {
    const students = await dbService.getStudents();
    const teachers = await dbService.getTeachers();
    const marks = await dbService.getMarks();
    const settings = await dbService.getSettings();

    const data = {
        timestamp: new Date().toISOString(),
        students,
        teachers,
        marks,
        settings: [settings]
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Broadway_Supabase_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importData: async (jsonContent: string) => {
    try {
        const data = JSON.parse(jsonContent);
        
        if (data.students) {
             const { error } = await supabase.from('students').upsert(data.students, { onConflict: 'id' });
             if(error) throw error;
        }
        if (data.teachers) {
             const { error } = await supabase.from('teachers').upsert(data.teachers, { onConflict: 'id' });
             if(error) throw error;
        }
        if (data.marks) {
             const { error } = await supabase.from('marks').upsert(data.marks, { onConflict: 'id' });
             if(error) throw error;
        }
        if (data.settings) {
             const { error } = await supabase.from('settings').upsert(data.settings);
             if(error) throw error;
        }

    } catch (e: any) {
        console.error("Import failed", e);
        throw new Error("Import failed: " + (e.message || JSON.stringify(e)));
    }
  }
};
