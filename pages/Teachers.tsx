
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { Teacher, ClassLevel, Stream, Gender, ALL_SUBJECTS } from '../types';
import { Button } from '../components/Button';

const ROLES = ['Class Teacher', 'Subject Teacher', 'Headteacher', 'DOS'];

// --- Teacher Profile Component ---
const TeacherProfile = ({ teacher, onEdit, onDelete, onBack }: { teacher: Teacher; onEdit: () => void; onDelete: () => void; onBack: () => void }) => (
  <div className="max-w-4xl mx-auto">
     <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 overflow-hidden">
      <div className="h-24 bg-gradient-to-r from-slate-600 to-slate-800"></div>
      <div className="px-6 pb-6">
        <div className="relative flex justify-between items-end -mt-12 mb-4">
          <div className="flex items-end">
            <div className="h-24 w-24 rounded-full bg-white p-1 shadow-md">
              <div className="h-full w-full rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 border-2 border-white">
                {teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
            </div>
            <div className="ml-4 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">{teacher.name}</h2>
              <div className="flex gap-2 mt-1">
                {teacher.roles.map(role => (
                   <span key={role} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200">
                     {role}
                   </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mb-1">
            <Button variant="outline" size="sm" onClick={onBack}>Back to List</Button>
            <Button size="sm" onClick={onEdit}>Edit Details</Button>
          </div>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact & Personal Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Contact Information</h3>
            </div>
            <div className="p-6 space-y-4">
                <div>
                   <label className="text-xs font-medium text-gray-500 uppercase">Phone Number</label>
                   <p className="text-sm font-medium text-gray-900">{teacher.phone || 'Not provided'}</p>
                </div>
                <div>
                   <label className="text-xs font-medium text-gray-500 uppercase">Email Address</label>
                   <p className="text-sm font-medium text-gray-900">{teacher.email || 'Not provided'}</p>
                </div>
                <div>
                   <label className="text-xs font-medium text-gray-500 uppercase">Gender</label>
                   <p className="text-sm font-medium text-gray-900">{teacher.gender === 'M' ? 'Male' : 'Female'}</p>
                </div>
            </div>
        </div>

        {/* Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Academic Assignments</h3>
            </div>
            <div className="p-6 space-y-6">
                {teacher.roles.includes('Class Teacher') && (
                    <div className="bg-blue-50 p-4 rounded border border-blue-100">
                        <h4 className="text-xs font-bold text-blue-800 uppercase mb-2">Class Teacher</h4>
                        <p className="text-lg font-bold text-blue-900">{teacher.assignedClass} {teacher.assignedStream}</p>
                        <p className="text-xs text-blue-600 mt-1">Responsible for report card signing and comment generation.</p>
                    </div>
                )}

                {teacher.roles.includes('Subject Teacher') && (
                     <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Subject Teaching</h4>
                        <div className="space-y-3">
                             <div>
                                <label className="text-xs text-gray-400">Subjects</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {teacher.subjects.map(sub => (
                                        <span key={sub} className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded border border-green-200 uppercase font-semibold">
                                            {sub}
                                        </span>
                                    ))}
                                    {teacher.subjects.length === 0 && <span className="text-sm text-gray-500 italic">No subjects assigned</span>}
                                </div>
                             </div>
                             <div>
                                <label className="text-xs text-gray-400">Classes</label>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {teacher.teachingClasses.map(cls => (
                                        <span key={cls} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200 font-medium">
                                            {cls}
                                        </span>
                                    ))}
                                    {teacher.teachingClasses.length === 0 && <span className="text-sm text-gray-500 italic">No classes assigned</span>}
                                </div>
                             </div>
                        </div>
                     </div>
                )}
                
                {!teacher.roles.includes('Class Teacher') && !teacher.roles.includes('Subject Teacher') && (
                    <p className="text-sm text-gray-500 italic">This staff member has administrative roles only.</p>
                )}
            </div>
        </div>
    </div>

    <div className="mt-8 flex justify-end border-t border-gray-200 pt-6">
         <Button variant="danger" onClick={onDelete}>Delete Teacher Record</Button>
    </div>
  </div>
);

export const Teachers: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'profile'>('list');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const initialFormState: Partial<Teacher> = {
    name: '',
    gender: Gender.Male,
    phone: '',
    email: '',
    roles: [],
    assignedClass: undefined,
    assignedStream: undefined,
    subjects: [],
    teachingClasses: []
  };

  const [formData, setFormData] = useState<Partial<Teacher>>(initialFormState);

  const loadTeachers = async () => {
    const data = await dbService.getTeachers();
    setTeachers(data);
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleOpenModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingId(teacher.id!);
      setFormData({ ...teacher });
    } else {
      setEditingId(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleViewProfile = (teacher: Teacher) => {
      setSelectedTeacher(teacher);
      setViewMode('profile');
  };

  const handleBackToList = () => {
      setSelectedTeacher(null);
      setViewMode('list');
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this teacher? This cannot be undone.')) {
      await dbService.deleteTeacher(id);
      loadTeachers();
      if (viewMode === 'profile') handleBackToList();
    }
  };

  const toggleArrayItem = (array: any[], item: any) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    } else {
      return [...array, item];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.roles?.length === 0) {
      alert('Name and at least one role are required.');
      return;
    }

    const teacherData = formData as Teacher;

    if (editingId) {
      await dbService.updateTeacher(teacherData);
      // Update local selected teacher if in profile view
      if (selectedTeacher && selectedTeacher.id === editingId) {
          setSelectedTeacher(teacherData);
      }
    } else {
      await dbService.addTeacher(teacherData);
    }

    setIsModalOpen(false);
    loadTeachers();
  };

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";
  const checkboxClasses = "h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer";

  // --- RENDER ---
  
  if (viewMode === 'profile' && selectedTeacher) {
      return (
          <TeacherProfile 
             teacher={selectedTeacher} 
             onEdit={() => handleOpenModal(selectedTeacher)}
             onDelete={() => handleDelete(selectedTeacher.id!)}
             onBack={handleBackToList}
          />
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Staff Directory</h1>
            <p className="text-sm text-gray-500 mt-1">Manage teaching and administrative staff.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Add Teacher</Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignments</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {teachers.map((teacher) => (
              <tr key={teacher.id} className="hover:bg-blue-50 transition-colors group cursor-pointer" onClick={() => handleViewProfile(teacher)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                  <div className="text-xs text-gray-500">{teacher.gender}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{teacher.phone}</div>
                  <div className="text-xs text-gray-500">{teacher.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {teacher.roles.map(role => (
                      <span key={role} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {role}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-500">
                    {teacher.roles.includes('Class Teacher') && (
                      <div className="mb-1">
                        <span className="font-semibold text-gray-700">Class:</span> {teacher.assignedClass} {teacher.assignedStream}
                      </div>
                    )}
                    {teacher.roles.includes('Subject Teacher') && teacher.subjects.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700">Subjects:</span> {teacher.subjects.join(', ')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleViewProfile(teacher); }}
                    className="text-primary-600 hover:text-primary-900 p-1"
                    title="View Profile"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(teacher.id!); }}
                    className="text-red-400 hover:text-red-600 p-1"
                    title="Delete Teacher"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
            {teachers.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No teachers found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200">
            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">{editingId ? 'Edit Teacher' : 'Add Teacher'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    className={inputClasses}
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g. MR. OKELLO JOHN"
                  />
                </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="text" 
                    className={inputClasses}
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="e.g. 0700 000 000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className={inputClasses}
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder="teacher@example.com"
                  />
                </div>
              </div>

              {/* Roles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Roles</label>
                <div className="flex flex-wrap gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                  {ROLES.map(role => (
                    <label key={role} className="inline-flex items-center cursor-pointer hover:text-primary transition-colors">
                      <input
                        type="checkbox"
                        className={checkboxClasses}
                        checked={formData.roles?.includes(role)}
                        onChange={() => setFormData({
                          ...formData,
                          roles: toggleArrayItem(formData.roles || [], role)
                        })}
                      />
                      <span className="ml-2 text-gray-700 font-medium">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Class Teacher Assignments */}
              {formData.roles?.includes('Class Teacher') && (
                <div className="bg-blue-50 p-5 rounded-md border border-blue-200 shadow-sm">
                  <h3 className="text-sm font-bold text-blue-800 mb-4 uppercase tracking-wide">Class Teacher Assignment</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Assigned Class</label>
                      <select 
                        className={`${inputClasses} border-blue-300 focus:border-blue-500 focus:ring-blue-500`}
                        value={formData.assignedClass || ''}
                        onChange={e => setFormData({...formData, assignedClass: e.target.value as ClassLevel})}
                      >
                        <option value="">Select Class</option>
                        {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-1">Assigned Stream</label>
                      <select 
                        className={`${inputClasses} border-blue-300 focus:border-blue-500 focus:ring-blue-500`}
                        value={formData.assignedStream || ''}
                        onChange={e => setFormData({...formData, assignedStream: e.target.value as Stream})}
                      >
                        <option value="">Select Stream</option>
                        {Object.values(Stream).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Subject Teacher Assignments */}
              {formData.roles?.includes('Subject Teacher') && (
                <div className="bg-green-50 p-5 rounded-md border border-green-200 shadow-sm">
                  <h3 className="text-sm font-bold text-green-800 mb-4 uppercase tracking-wide">Subject Teacher Assignment</h3>
                  
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-green-900 mb-2">Subjects Taught</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {ALL_SUBJECTS.map(sub => (
                        <label key={sub} className="inline-flex items-center p-2 bg-white rounded border border-green-100 hover:border-green-300 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className={`${checkboxClasses} text-green-600 focus:ring-green-500`}
                            checked={formData.subjects?.includes(sub)}
                            onChange={() => setFormData({
                              ...formData,
                              subjects: toggleArrayItem(formData.subjects || [], sub)
                            })}
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize font-medium">{sub}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-green-900 mb-2">Classes Taught</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ClassLevel).map(level => (
                        <label key={level} className="inline-flex items-center bg-white px-3 py-1.5 rounded border border-green-200 hover:border-green-300 transition-colors cursor-pointer">
                          <input
                            type="checkbox"
                            className={`${checkboxClasses} text-green-600 focus:ring-green-500`}
                            checked={formData.teachingClasses?.includes(level)}
                            onChange={() => setFormData({
                              ...formData,
                              teachingClasses: toggleArrayItem(formData.teachingClasses || [], level)
                            })}
                          />
                          <span className="ml-2 text-sm text-gray-700 font-medium">{level}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button variant="outline" type="button" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit">Save Teacher</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
