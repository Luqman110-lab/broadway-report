
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { Student, ClassLevel, Stream, Gender, MarkRecord } from '../types';
import { Button } from '../components/Button';

// --- Components for Student Profile ---

const ProfileHeader = ({ student, onEdit, onBack }: { student: Student; onEdit: () => void; onBack: () => void }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
    <div className="h-24 bg-gradient-to-r from-primary-600 to-primary-800"></div>
    <div className="px-6 pb-6">
      <div className="relative flex justify-between items-end -mt-12 mb-4">
        <div className="flex items-end">
          <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
            <div className="h-full w-full rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 border-2 border-white">
              {student.name.substring(0, 2)}
            </div>
          </div>
          <div className="ml-4 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span>{student.indexNumber}</span>
              <span className="text-gray-300">•</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                {student.classLevel} {student.stream}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-2 mb-1">
          <Button variant="outline" size="sm" onClick={onBack}>Back to List</Button>
          <Button size="sm" onClick={onEdit}>Edit Profile</Button>
        </div>
      </div>
    </div>
  </div>
);

const AcademicHistory = ({ studentId }: { studentId: number }) => {
  const [history, setHistory] = useState<MarkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      const allMarks = await dbService.getMarks();
      const studentMarks = allMarks.filter(m => m.studentId === studentId).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        if (a.term !== b.term) return b.term - a.term;
        return 0;
      });
      setHistory(studentMarks);
      setLoading(false);
    };
    fetchHistory();
  }, [studentId]);

  if (loading) return <div className="p-4 text-center text-gray-500">Loading history...</div>;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-800">Academic History</h3>
        <span className="text-xs text-gray-500">{history.length} Records found</span>
      </div>
      {history.length === 0 ? (
        <div className="p-8 text-center text-gray-500">No academic records found for this student.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Agg</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Div</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.year}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Term {record.term}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs ${record.type === 'EOT' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'}`}>
                      {record.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center">{record.aggregate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-primary-600">{record.division}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const PersonalInfoCard = ({ student }: { student: Student }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden h-full">
    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
      <h3 className="font-semibold text-gray-800">Personal Details</h3>
    </div>
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Gender</label>
          <p className="text-sm font-medium text-gray-900">{student.gender === 'M' ? 'Male' : 'Female'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Pay Code</label>
          <p className="text-sm font-medium text-gray-900">{student.paycode || 'N/A'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Parent/Guardian</label>
          <p className="text-sm font-medium text-gray-900">{student.parentName || '-'}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 uppercase">Contact</label>
          <p className="text-sm font-medium text-gray-900">{student.parentContact || '-'}</p>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-100">
        <label className="text-xs font-medium text-gray-500 uppercase mb-2 block">Special Considerations</label>
        <div className="flex flex-wrap gap-2">
          {(!student.specialCases.fees && !student.specialCases.sickness && !student.specialCases.absenteeism) && (
            <span className="text-sm text-gray-400 italic">No special records</span>
          )}
          {student.specialCases.fees && (
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md font-medium border border-red-200">Fees Balance</span>
          )}
          {student.specialCases.sickness && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-md font-medium border border-yellow-200">Medical Issues</span>
          )}
          {student.specialCases.absenteeism && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-md font-medium border border-orange-200">Chronic Absenteeism</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// --- Main Students Component ---

export const Students: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'profile'>('list');
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [sortOption, setSortOption] = useState<'name' | 'index' | 'class'>('class');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    indexNumber: '',
    classLevel: ClassLevel.P1,
    stream: Stream.Red,
    gender: Gender.Male,
    paycode: '',
    parentName: '',
    parentContact: '',
    specialCases: { absenteeism: false, sickness: false, fees: false }
  });

  const loadStudents = async () => {
    const data = await dbService.getStudents();
    setStudents(data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // --- Handlers ---

  const handleViewProfile = (student: Student) => {
    setSelectedStudent(student);
    setViewMode('profile');
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({ ...student });
    setIsModalOpen(true);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedStudent(null);
  };

  const handleDelete = async (id: number | undefined) => {
    if (id === undefined || id === null) {
        alert("Cannot delete: Student ID is missing or invalid.");
        return;
    }
    if (window.confirm('Are you sure you want to delete this student? This will permanently remove the student profile AND all associated marks.')) {
      try {
        await dbService.deleteStudent(id);
        await loadStudents(); // Must reload to see changes
        
        if (viewMode === 'profile') {
            handleBackToList();
        }
      } catch (error: any) {
        console.error("Error deleting student:", error);
        // Extract the message to avoid [object Object]
        const errMsg = error.message || error.error_description || JSON.stringify(error);
        alert(`Failed to delete student: ${errMsg}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.indexNumber) {
      const studentToSave = {
        ...formData,
        name: formData.name.toUpperCase() // Ensure uppercase
      } as Student;

      if (studentToSave.id) {
        await dbService.updateStudent(studentToSave);
        // Update local state if in profile view
        if (selectedStudent && selectedStudent.id === studentToSave.id) {
          setSelectedStudent(studentToSave);
        }
      } else {
        await dbService.addStudent(studentToSave);
      }
      
      setIsModalOpen(false);
      // Reset form
      setFormData({
        name: '', indexNumber: '', classLevel: ClassLevel.P1, stream: Stream.Red, gender: Gender.Male, paycode: '', parentName: '', parentContact: '',
        specialCases: { absenteeism: false, sickness: false, fees: false }
      });
      loadStudents();
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const normalizeClassInput = (rawClass: string): ClassLevel => {
    // Remove spaces, dots, and convert to uppercase
    const cleaned = rawClass.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // 1. Direct Match (P1, P2...)
    if (Object.values(ClassLevel).includes(cleaned as ClassLevel)) {
        return cleaned as ClassLevel;
    }
    
    // 2. Handle "PRIMARY1", "GRADE1"
    if (cleaned.startsWith('PRIMARY')) {
        const num = cleaned.replace('PRIMARY', '');
        const candidate = 'P' + num;
        if (Object.values(ClassLevel).includes(candidate as ClassLevel)) return candidate as ClassLevel;
    }
    
    if (cleaned.startsWith('GRADE')) {
        const num = cleaned.replace('GRADE', '');
        const candidate = 'P' + num;
        if (Object.values(ClassLevel).includes(candidate as ClassLevel)) return candidate as ClassLevel;
    }

    // 3. Handle Just Numbers "1", "2"
    if (/^\d$/.test(cleaned)) {
        const candidate = 'P' + cleaned;
        if (Object.values(ClassLevel).includes(candidate as ClassLevel)) return candidate as ClassLevel;
    }

    // Default fallback
    return ClassLevel.P1;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      setImporting(true);
      const reader = new FileReader();
  
      reader.onload = async (event) => {
        try {
          const text = event.target?.result as string;
          const lines = text.split(/\r\n|\n/);
          const newStudents: Student[] = [];
          const CENTRE_NUMBER = "670135"; 
          let count = students.length;
          
          // Check if header exists, if so skip row 0
          const firstLine = lines[0].toLowerCase();
          const startIndex = (firstLine.includes('pay') || firstLine.includes('code') || firstLine.includes('name')) ? 1 : 0;
  
          for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
  
            const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols.length < 4) continue; 
  
            const paycode = cols[0];
            const firstName = cols[1];
            const lastName = cols[2];
            const rawClass = cols[3];

            const classLevel = normalizeClassInput(rawClass);
  
            const indexSuffix = String(count + i + 1).padStart(3, '0');
            const indexNumber = `${CENTRE_NUMBER}/${indexSuffix}`;
  
            const student: Student = {
              indexNumber,
              name: `${firstName} ${lastName}`.toUpperCase(),
              classLevel,
              stream: Stream.Red,
              gender: Gender.Male,
              paycode: paycode,
              specialCases: { absenteeism: false, sickness: false, fees: false }
            };
  
            newStudents.push(student);
          }
  
          if (newStudents.length > 0) {
            // USE BULK INSERT FOR PERFORMANCE
            await dbService.addStudents(newStudents);
            alert(`Successfully imported ${newStudents.length} students.`);
            loadStudents();
          } else {
            alert("No valid student records found in CSV. Please check format: pay_code, first_name, last_name, class");
          }
  
        } catch (error: any) {
          console.error("CSV Import Error:", error);
          const msg = error.message || "Unknown error";
          alert(`Error processing CSV file: ${msg}`);
        } finally {
          setImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    };

  let filteredStudents = students.filter(s => 
    (s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.indexNumber.includes(searchQuery) ||
    (s.paycode && s.paycode.includes(searchQuery)))
  );

  // Filter by Class
  if (filterClass !== 'All') {
      filteredStudents = filteredStudents.filter(s => s.classLevel === filterClass);
  }

  // Sort
  filteredStudents.sort((a, b) => {
      if (sortOption === 'name') return a.name.localeCompare(b.name);
      if (sortOption === 'class') {
        // Simple string compare works for P1-P7 because they are single digits mostly
        // but strict 'P1' < 'P2' works.
        return a.classLevel.localeCompare(b.classLevel);
      }
      if (sortOption === 'index') return a.indexNumber.localeCompare(b.indexNumber);
      return 0;
  });

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";

  // --- RENDER ---

  if (viewMode === 'profile' && selectedStudent) {
    return (
      <div className="max-w-6xl mx-auto">
        <ProfileHeader student={selectedStudent} onEdit={() => handleEdit(selectedStudent)} onBack={handleBackToList} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Personal Info */}
          <div className="md:col-span-1">
            <PersonalInfoCard student={selectedStudent} />
          </div>

          {/* Right Column: Academic History */}
          <div className="md:col-span-2">
            <AcademicHistory studentId={selectedStudent.id!} />
          </div>
        </div>

        {/* Delete Button Zone */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <Button variant="danger" size="sm" onClick={() => handleDelete(selectedStudent.id)}>
            Delete Learner Record
          </Button>
        </div>

        {/* Edit Modal Reused */}
        {isModalOpen && (
          <StudentModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onSubmit={handleSubmit} 
            formData={formData} 
            setFormData={setFormData} 
            isEdit={true}
          />
        )}
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Directory</h1>
          <p className="text-sm text-gray-500 mt-1">Manage learner profiles, enrollments, and details.</p>
        </div>
        <div className="flex gap-3">
           <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept=".csv" 
              className="hidden" 
            />
            <Button variant="outline" onClick={handleImportClick} disabled={importing}>
              {importing ? 'Importing...' : 'Import CSV'}
            </Button>
          <Button onClick={() => {
            setFormData({
              name: '', indexNumber: '', classLevel: ClassLevel.P1, stream: Stream.Red, gender: Gender.Male, paycode: '', parentName: '', parentContact: '',
              specialCases: { absenteeism: false, sickness: false, fees: false }
            });
            setIsModalOpen(true);
          }}>
            Add Student
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
            </div>
            <input 
                type="text" 
                placeholder="Search by name, index number, or paycode..." 
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        
        <div className="flex gap-4">
            <select 
                className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
            >
                <option value="All">All Classes</option>
                {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select 
                className="block w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
            >
                <option value="class">Sort by Class</option>
                <option value="name">Sort by Name</option>
                <option value="index">Sort by Index</option>
            </select>
        </div>
      </div>
      
      <div className="flex items-center justify-end text-xs text-gray-500">
        Showing {filteredStudents.length} students
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-blue-50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleViewProfile(student)}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-sm">
                        {student.name.substring(0, 2)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-xs text-gray-500">{student.indexNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleViewProfile(student)}>
                    <div className="text-sm text-gray-900">{student.gender === 'M' ? 'Male' : 'Female'}</div>
                    <div className="text-xs text-gray-500">{student.paycode || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleViewProfile(student)}>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {student.classLevel}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">{student.stream}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleViewProfile(student)}>
                     {student.specialCases.fees ? 
                        <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">Fees Issue</span> : 
                        <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">Active</span>
                     }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleViewProfile(student); }}
                      className="text-primary-600 hover:text-primary-900 p-1"
                      title="View Profile"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(student.id); }}
                      className="text-red-400 hover:text-red-600 p-1 transition-colors"
                      title="Delete Student"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No students found matching your search.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <StudentModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSubmit} 
          formData={formData} 
          setFormData={setFormData}
          isEdit={!!formData.id} 
        />
      )}
    </div>
  );
};

// Sub-component for the Modal to keep the main file cleaner
const StudentModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isEdit }: any) => {
  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 border border-gray-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">{isEdit ? 'Edit Student Profile' : 'Register New Student'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Section 1: Basic Info */}
          <div>
             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Academic Details</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name (Uppercase)</label>
                    <input 
                        type="text" 
                        className={inputClasses}
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        required
                        placeholder="e.g. MUKASA JOHN"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Index Number</label>
                    <input 
                        type="text" 
                        className={inputClasses}
                        value={formData.indexNumber}
                        onChange={e => setFormData({...formData, indexNumber: e.target.value})}
                        placeholder="000/000"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">School Paycode</label>
                    <input 
                        type="text" 
                        className={inputClasses}
                        value={formData.paycode}
                        onChange={e => setFormData({...formData, paycode: e.target.value})}
                        placeholder="Optional"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                    <select 
                        className={inputClasses}
                        value={formData.classLevel}
                        onChange={e => setFormData({...formData, classLevel: e.target.value as ClassLevel})}
                    >
                        {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                    <select 
                        className={inputClasses}
                        value={formData.stream}
                        onChange={e => setFormData({...formData, stream: e.target.value as Stream})}
                    >
                        {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
             </div>
          </div>

          {/* Section 2: Personal Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Personal & Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                    <select 
                        className={inputClasses}
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value as Gender})}
                    >
                        <option value={Gender.Male}>Male</option>
                        <option value={Gender.Female}>Female</option>
                    </select>
                </div>
                <div>
                     {/* Spacer for alignment if needed */}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
                    <input 
                        type="text" 
                        className={inputClasses}
                        value={formData.parentName || ''}
                        onChange={e => setFormData({...formData, parentName: e.target.value})}
                        placeholder="Mr. Parent Name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input 
                        type="text" 
                        className={inputClasses}
                        value={formData.parentContact || ''}
                        onChange={e => setFormData({...formData, parentContact: e.target.value})}
                        placeholder="07XX XXX XXX"
                    />
                </div>
            </div>
          </div>

          {/* Section 3: Special Cases */}
          <div>
             <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Administrative Flags</h3>
             <div className="bg-gray-50 p-4 rounded border border-gray-200 flex gap-6">
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="rounded text-primary-600 focus:ring-primary-500"
                        checked={formData.specialCases?.fees}
                        onChange={e => setFormData({...formData, specialCases: {...formData.specialCases!, fees: e.target.checked}})}
                    />
                    <span className="text-sm text-gray-700">Fees Defaulter</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="rounded text-primary-600 focus:ring-primary-500"
                        checked={formData.specialCases?.sickness}
                        onChange={e => setFormData({...formData, specialCases: {...formData.specialCases!, sickness: e.target.checked}})}
                    />
                    <span className="text-sm text-gray-700">Medical Condition</span>
                 </label>
                 <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                        type="checkbox" 
                        className="rounded text-primary-600 focus:ring-primary-500"
                        checked={formData.specialCases?.absenteeism}
                        onChange={e => setFormData({...formData, specialCases: {...formData.specialCases!, absenteeism: e.target.checked}})}
                    />
                    <span className="text-sm text-gray-700">Chronic Absenteeism</span>
                 </label>
             </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t mt-4">
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Student</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
