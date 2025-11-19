
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Student, ClassLevel, SubjectMarks, AssessmentType, MarkRecord, SUBJECTS_LOWER, SUBJECTS_UPPER } from '../types';
import { calculateGrade, calculateAggregate, calculateDivision } from '../services/grading';
import { Button } from '../components/Button';

export const MarksEntry: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel.P7);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedType, setSelectedType] = useState<AssessmentType>(AssessmentType.EOT);
  const [students, setStudents] = useState<Student[]>([]);
  const [marksData, setMarksData] = useState<{ [studentId: number]: SubjectMarks }>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const subjects = ['P1','P2','P3'].includes(selectedClass) ? SUBJECTS_LOWER : SUBJECTS_UPPER;

  useEffect(() => {
    loadData();
  }, [selectedClass, selectedTerm, selectedType]);

  const loadData = async () => {
    setLoading(true);
    // 1. Get Students for Class
    const allStudents = await dbService.getStudents();
    const classStudents = allStudents.filter(s => s.classLevel === selectedClass);
    
    // 2. Get Existing Marks
    const allMarks = await dbService.getMarks();
    const currentMarks: { [id: number]: SubjectMarks } = {};
    
    classStudents.forEach(student => {
      const record = allMarks.find(m => 
        m.studentId === student.id && 
        m.term === selectedTerm && 
        m.year === new Date().getFullYear() &&
        m.type === selectedType
      );
      if (record) {
        currentMarks[student.id!] = record.marks;
      } else {
        currentMarks[student.id!] = {};
      }
    });

    setStudents(classStudents);
    setMarksData(currentMarks);
    setLoading(false);
  };

  const handleMarkChange = (studentId: number, subject: string, val: string) => {
    const numVal = val === '' ? undefined : parseInt(val, 10);
    
    // Validate 0-100
    if (numVal !== undefined && (numVal < 0 || numVal > 100)) return;

    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subject]: numVal
      }
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    const year = new Date().getFullYear();
    try {
      const promises = students.map(student => {
        const studentMarks = marksData[student.id!] || {};
        
        // Calculate computed values
        const aggregate = calculateAggregate(studentMarks as any, selectedClass);
        const division = calculateDivision(aggregate, selectedClass);

        const record: MarkRecord = {
          studentId: student.id!,
          term: selectedTerm,
          year,
          type: selectedType,
          marks: studentMarks,
          aggregate,
          division
        };
        return dbService.saveMark(record);
      });

      await Promise.all(promises);
      setMessage('Marks saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving marks.');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (mark: number | undefined) => {
    if (mark === undefined) return 'text-gray-400';
    if (mark >= 80) return 'text-success font-bold'; // D1, D2
    if (mark >= 50) return 'text-yellow-600'; // C3-C6
    return 'text-danger'; // P7-F9
  };

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
        <div className="flex items-center space-x-4">
            {message && <span className="text-success font-medium px-3 py-1 bg-green-50 rounded-md">{message}</span>}
            <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save All Marks'}
            </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select 
                className={inputClasses}
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
            >
                {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select 
                className={inputClasses}
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(Number(e.target.value))}
            >
                <option value={1}>Term 1</option>
                <option value={2}>Term 2</option>
                <option value={3}>Term 3</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select 
                className={inputClasses}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as AssessmentType)}
            >
                <option value={AssessmentType.BOT}>Beginning of Term</option>
                <option value={AssessmentType.EOT}>End of Term</option>
            </select>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48 sticky left-0 bg-gray-50 z-10 shadow-r">Student</th>
                {subjects.map(sub => (
                    <th key={sub} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">{sub}</th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Agg</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase bg-blue-50">Div</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                    <tr><td colSpan={subjects.length + 3} className="p-8 text-center text-gray-500">No students in this class.</td></tr>
                ) : students.map((student) => {
                    const sMarks = marksData[student.id!] || {};
                    const agg = calculateAggregate(sMarks as any, selectedClass);
                    const div = calculateDivision(agg, selectedClass);
                    
                    return (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-gray-100">
                                <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                <div className="text-xs text-gray-500">{student.indexNumber}</div>
                            </td>
                            {subjects.map(sub => {
                                const val = (sMarks as any)[sub];
                                const { grade } = calculateGrade(val);
                                return (
                                    <td key={sub} className="px-2 py-2 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <input 
                                                type="number" 
                                                className="w-16 px-2 py-1.5 border border-gray-300 rounded-md text-center text-gray-900 bg-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition-all text-sm"
                                                value={val !== undefined ? val : ''}
                                                onChange={(e) => handleMarkChange(student.id!, sub, e.target.value)}
                                                placeholder="-"
                                            />
                                            <span className={`text-xs mt-1 font-medium ${getGradeColor(val)}`}>{grade}</span>
                                        </div>
                                    </td>
                                );
                            })}
                            <td className="px-4 py-2 text-center font-bold text-gray-700 bg-gray-50/50">{agg || '-'}</td>
                            <td className="px-4 py-2 text-center font-bold text-gray-700 bg-gray-50/50">{div}</td>
                        </tr>
                    );
                })}
            </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
