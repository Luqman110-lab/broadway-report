import React, { useEffect, useState } from 'react';
import { dbService } from '../services/db';

const StatCard = ({ title, value, icon, color }: any) => {
  const colorStyles: {[key:string]: string} = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center space-x-4 transition-shadow hover:shadow-md">
      <div className={`p-4 rounded-xl ${colorStyles[color] || "bg-gray-100 text-gray-600"}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [counts, setCounts] = useState({ students: 0, teachers: 0, reports: 0 });

  useEffect(() => {
    const loadStats = async () => {
      const students = await dbService.getStudents();
      const teachers = await dbService.getTeachers();
      const marks = await dbService.getMarks();
      setCounts({
        students: students.length,
        teachers: teachers.length,
        reports: marks.length
      });
    };
    loadStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Overview</h1>
        <p className="text-gray-500">Welcome back to Broadway Report Card System.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Students" 
          value={counts.students} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} 
          color="blue" 
        />
        <StatCard 
          title="Teachers" 
          value={counts.teachers} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>} 
          color="green" 
        />
        <StatCard 
          title="Assessments Filed" 
          value={counts.reports} 
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>} 
          color="yellow" 
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <a href="#/students" className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all text-primary-600 group">
              <div className="mb-2 p-2 bg-primary-50 rounded-full group-hover:bg-primary-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
              </div>
              <span className="font-medium text-sm">Add Student</span>
           </a>
           <a href="#/marks" className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all text-primary-600 group">
              <div className="mb-2 p-2 bg-primary-50 rounded-full group-hover:bg-primary-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <span className="font-medium text-sm">Enter Marks</span>
           </a>
           <a href="#/reports" className="flex flex-col items-center justify-center p-4 border border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all text-primary-600 group">
              <div className="mb-2 p-2 bg-primary-50 rounded-full group-hover:bg-primary-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              </div>
              <span className="font-medium text-sm">Generate Reports</span>
           </a>
        </div>
      </div>
    </div>
  );
};