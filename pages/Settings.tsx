
import React, { useState, useEffect, useRef } from 'react';
import { dbService } from '../services/db';
import { SchoolSettings } from '../types';
import { Button } from '../components/Button';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const s = await dbService.getSettings();
    setSettings(s);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    try {
        await dbService.saveSettings(settings);
        setMessage('Settings saved successfully!');
        setTimeout(() => setMessage(''), 3000);
    } catch (err) {
        setMessage('Error saving settings.');
    } finally {
        setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
              setSettings(prev => prev ? { ...prev, logoBase64: ev.target?.result as string } : null);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleRemoveLogo = () => {
      setSettings(prev => prev ? { ...prev, logoBase64: undefined } : null);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = () => {
      dbService.exportData();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (window.confirm("WARNING: Restoring data will OVERWRITE all current students, marks, and teachers. Are you sure?")) {
          const reader = new FileReader();
          reader.onload = async (ev) => {
              try {
                  await dbService.importData(ev.target?.result as string);
                  alert("Data restored successfully. The page will reload.");
                  window.location.reload();
              } catch (err) {
                  alert("Failed to restore data. Invalid file format.");
              }
          };
          reader.readAsText(file);
      }
      if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  if (loading || !settings) return <div className="p-6">Loading settings...</div>;

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* School Profile Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">School Profile</h3>
                <p className="mt-1 text-sm text-gray-500">Information displayed on the Report Card headers.</p>
            </div>
            <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">School Name</label>
                    <input 
                        type="text" 
                        className={inputClasses} 
                        value={settings.schoolName}
                        onChange={e => setSettings({...settings, schoolName: e.target.value.toUpperCase()})}
                    />
                </div>
                <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Address / P.O Box</label>
                    <input 
                        type="text" 
                        className={inputClasses} 
                        value={settings.addressBox}
                        onChange={e => setSettings({...settings, addressBox: e.target.value.toUpperCase()})}
                    />
                </div>
                <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Contact Phone Numbers</label>
                    <input 
                        type="text" 
                        className={inputClasses} 
                        value={settings.contactPhones}
                        onChange={e => setSettings({...settings, contactPhones: e.target.value})}
                    />
                </div>
                <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700">Motto</label>
                    <input 
                        type="text" 
                        className={inputClasses} 
                        value={settings.motto}
                        onChange={e => setSettings({...settings, motto: e.target.value.toUpperCase()})}
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Registration Number</label>
                    <input 
                        type="text" 
                        className={inputClasses} 
                        value={settings.regNumber}
                        onChange={e => setSettings({...settings, regNumber: e.target.value})}
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Centre Number</label>
                    <input 
                        type="text" 
                        className={inputClasses} 
                        value={settings.centreNumber}
                        onChange={e => setSettings({...settings, centreNumber: e.target.value})}
                    />
                </div>
            </div>
        </div>

        {/* Logo Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">School Logo</h3>
                <p className="mt-1 text-sm text-gray-500">Upload a school badge to appear on reports (PNG/JPG).</p>
            </div>
            <div className="p-6 flex items-center space-x-6">
                <div className="flex-shrink-0 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                    {settings.logoBase64 ? (
                        <img src={settings.logoBase64} alt="School Logo" className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-gray-400 text-xs text-center">No Logo</span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-primary
                        hover:file:bg-blue-100"
                        onChange={handleLogoUpload}
                    />
                    {settings.logoBase64 && (
                        <button type="button" onClick={handleRemoveLogo} className="text-red-600 text-sm hover:underline text-left">
                            Remove Logo
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Academic Configuration */}
        <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Academic Configuration</h3>
                <p className="mt-1 text-sm text-gray-500">Manage current term and next term dates.</p>
            </div>
            <div className="p-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Current Term</label>
                    <select 
                        className={inputClasses} 
                        value={settings.currentTerm}
                        onChange={e => setSettings({...settings, currentTerm: Number(e.target.value)})}
                    >
                        <option value={1}>Term 1</option>
                        <option value={2}>Term 2</option>
                        <option value={3}>Term 3</option>
                    </select>
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Current Year</label>
                    <input 
                        type="number" 
                        className={inputClasses} 
                        value={settings.currentYear}
                        onChange={e => setSettings({...settings, currentYear: Number(e.target.value)})}
                    />
                </div>

                <div className="sm:col-span-6 border-t pt-4 mt-2">
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Next Term Start Dates</h4>
                </div>

                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Boarders Start Date</label>
                    <input 
                        type="date" 
                        className={inputClasses} 
                        value={settings.nextTermBeginBoarders}
                        onChange={e => setSettings({...settings, nextTermBeginBoarders: e.target.value})}
                    />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700">Day Scholars Start Date</label>
                    <input 
                        type="date" 
                        className={inputClasses} 
                        value={settings.nextTermBeginDay}
                        onChange={e => setSettings({...settings, nextTermBeginDay: e.target.value})}
                    />
                </div>
            </div>
        </div>

        <div className="flex items-center justify-between">
             {message && <span className="text-green-600 font-medium animate-pulse">{message}</span>}
             {!message && <span></span>}
             <Button type="submit" disabled={saving} size="lg">
                {saving ? 'Saving...' : 'Save Settings'}
             </Button>
        </div>

      </form>

      {/* Data Management Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 mt-10">
         <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <h3 className="text-lg font-medium leading-6 text-red-800">Data Management Zone</h3>
            <p className="mt-1 text-sm text-red-600">Backup your database or restore from a previous backup.</p>
         </div>
         <div className="p-6 flex gap-4 items-center">
             <Button variant="outline" onClick={handleExport}>Download Backup (JSON)</Button>
             
             <div className="relative">
                 <input 
                    type="file" 
                    ref={restoreInputRef} 
                    onChange={handleRestore} 
                    accept=".json" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                 />
                 <Button variant="danger">Restore Data from Backup</Button>
             </div>
         </div>
      </div>
    </div>
  );
};
