
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { ClassLevel, AssessmentType, SUBJECTS_UPPER, SUBJECTS_LOWER, SchoolSettings, MarkRecord, Student, Gender } from '../types';
import { calculateGrade, calculateAggregate, calculateDivision } from '../services/grading';
import { Button } from '../components/Button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

declare const jspdf: any;

export const Assessments: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel.P7);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [selectedType, setSelectedType] = useState<AssessmentType | 'BOTH'>('BOTH');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  
  // Analytics State
  const [stats, setStats] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      const s = await dbService.getSettings();
      setSettings(s);
      if (s) setSelectedTerm(s.currentTerm);
    };
    loadConfig();
  }, []);

  // Trigger analysis whenever filters change
  useEffect(() => {
    if (settings) runAnalysis();
  }, [selectedClass, selectedTerm, selectedType, settings]);

  const subjects = ['P1','P2','P3'].includes(selectedClass) ? SUBJECTS_LOWER : SUBJECTS_UPPER;
  const subjectShortNames: {[key:string]: string} = {
      'english': 'ENG',
      'maths': 'MTC',
      'science': 'SCI',
      'sst': 'SST',
      'literacy1': 'LIT1',
      'literacy2': 'LIT2'
  };

  const getFilteredData = async () => {
    const allStudents = await dbService.getStudents();
    const classStudents = allStudents.filter(s => s.classLevel === selectedClass);
    const allMarks = await dbService.getMarks();
    const year = settings?.currentYear || new Date().getFullYear();
    const typeToAnalyze = selectedType === 'BOTH' ? AssessmentType.EOT : selectedType; // Default to EOT for combined stats

    const processed = classStudents.map(student => {
        const record = allMarks.find(m => 
            m.studentId === student.id && 
            m.term === selectedTerm && 
            m.year === year && 
            m.type === typeToAnalyze
        );

        const marks = record ? record.marks : {};
        let totalMarks = 0;
        subjects.forEach(sub => totalMarks += (marks as any)[sub] || 0);

        return {
            student,
            marks,
            aggregate: record ? record.aggregate : 0,
            division: record ? record.division : 'X',
            totalMarks
        };
    }).filter(r => r.aggregate > 0); // Only analyze students with results

    return processed;
  };

  const runAnalysis = async () => {
      setAnalyzing(true);
      const data = await getFilteredData();
      
      // 1. Division Counts
      const divs = { I: 0, II: 0, III: 0, U: 0, X: 0 };
      data.forEach(d => {
          if (d.division in divs) divs[d.division as keyof typeof divs]++;
          else divs.X++;
      });

      // 2. Gender Analysis
      const genderStats = {
          M: { total: 0, aggSum: 0, count: 0 },
          F: { total: 0, aggSum: 0, count: 0 }
      };
      data.forEach(d => {
          const g = d.student.gender;
          genderStats[g].total++;
          if (d.aggregate > 0) {
            genderStats[g].aggSum += d.aggregate;
            genderStats[g].count++;
          }
      });

      // 3. Subject Averages
      const subjectStats = subjects.map(sub => {
          const scores = data.map(d => (d.marks as any)[sub]).filter(m => m !== undefined);
          const avg = scores.length ? (scores.reduce((a,b)=>a+b,0) / scores.length) : 0;
          return { name: subjectShortNames[sub], avg: Math.round(avg) };
      });

      setStats({
          totalStudents: data.length,
          divisions: [
              { name: 'Div I', value: divs.I },
              { name: 'Div II', value: divs.II },
              { name: 'Div III', value: divs.III },
              { name: 'Div U', value: divs.U }
          ],
          gender: {
              maleAvg: genderStats.M.count ? (genderStats.M.aggSum / genderStats.M.count).toFixed(1) : '-',
              femaleAvg: genderStats.F.count ? (genderStats.F.aggSum / genderStats.F.count).toFixed(1) : '-',
              maleCount: genderStats.M.total,
              femaleCount: genderStats.F.total
          },
          subjects: subjectStats
      });
      setAnalyzing(false);
  };

  const downloadCSV = async () => {
      const data = await getFilteredData();
      // Simple CSV generation
      const header = ['Index', 'Name', 'Gender', ...subjects.map(s => s.toUpperCase()), 'Total', 'Agg', 'Div'];
      const rows = data.map(row => [
          row.student.indexNumber,
          row.student.name,
          row.student.gender,
          ...subjects.map(s => (row.marks as any)[s] || ''),
          row.totalMarks,
          row.aggregate,
          row.division
      ]);

      const csvContent = [
          header.join(','),
          ...rows.map(r => r.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedClass}_Assessment_Data.csv`;
      link.click();
  };

  const generateSection = (doc: any, type: AssessmentType, classStudents: Student[], allMarks: MarkRecord[], settings: SchoolSettings, year: number) => {
      // Colors & Style Config
      const colors = {
          primary: [0, 51, 204], // Broadway Blue
          secondary: [240, 245, 255], // Very light blue
          text: [30, 41, 59], // Slate 800
          muted: [100, 116, 139], // Slate 500
          border: [203, 213, 225], // Slate 300
          white: [255, 255, 255]
      };

      // Process Marks
      const studentRows = classStudents.map(student => {
        const record = allMarks.find(m => 
            m.studentId === student.id && 
            m.term === selectedTerm && 
            m.year === year && 
            m.type === type
        );

        const marks = record ? record.marks : {};
        
        // Calculate total marks
        let totalMarks = 0;
        subjects.forEach(sub => {
            totalMarks += (marks as any)[sub] || 0;
        });

        return {
            student,
            marks,
            aggregate: record ? record.aggregate : 0,
            division: record ? record.division : '-',
            totalMarks
        };
    });

    // Sort by Aggregate (Asc) then Total Marks (Desc)
    studentRows.sort((a, b) => {
        if (a.aggregate === 0 && b.aggregate > 0) return 1;
        if (b.aggregate === 0 && a.aggregate > 0) return -1;
        if (a.aggregate !== b.aggregate) return a.aggregate - b.aggregate;
        return b.totalMarks - a.totalMarks;
    });

    const bestPerformer = studentRows.length > 0 ? studentRows[0] : null;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 14;

    // ================= HEADER =================
    
    // Top Accent Line
    doc.setDrawColor(...colors.primary);
    doc.setLineWidth(2);
    doc.line(0, 1, pageWidth, 1);

    // Logo logic
    if (settings.logoBase64) {
        try {
            const logoSize = 22;
            let format = 'PNG';
            if (settings.logoBase64.startsWith('data:image/jpeg')) format = 'JPEG';
            doc.addImage(settings.logoBase64, format, margin, 8, logoSize, logoSize);
        } catch(e) {
            // Fallback if image fails
        }
    }

    // School Info (Centered)
    doc.setTextColor(...colors.primary);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text(settings.schoolName.toUpperCase(), pageWidth / 2, 16, { align: "center" });
    
    doc.setTextColor(...colors.text);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`${settings.addressBox} • ${settings.contactPhones}`, pageWidth / 2, 22, { align: "center" });
    if (settings.motto) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...colors.muted);
        doc.text(`"${settings.motto}"`, pageWidth / 2, 26, { align: "center" });
    }

    // Title Banner
    const typeText = type === AssessmentType.BOT ? "BEGINNING OF TERM" : "END OF TERM";
    const termText = selectedTerm === 1 ? "ONE" : selectedTerm === 2 ? "TWO" : "THREE";
    
    doc.setFillColor(241, 245, 249); // Slate 100
    doc.setDrawColor(...colors.border);
    doc.roundedRect(margin, 30, pageWidth - (margin * 2), 11, 2, 2, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text(`${selectedClass} ${typeText} ASSESSMENT EVALUATION - TERM ${termText} ${year}`, pageWidth / 2, 37, { align: "center" });

    // ================= MAIN TABLE =================
    const head = [
        [
            { content: 'NO', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
            { content: 'NAME', rowSpan: 2, styles: { valign: 'middle', halign: 'left' } },
            { content: 'SUBJECT PERFORMANCE', colSpan: subjects.length * 2, styles: { halign: 'center', fillColor: [241, 245, 249], textColor: colors.text } }, 
            { content: 'OVERALL', colSpan: 3, styles: { halign: 'center', fillColor: [241, 245, 249], textColor: colors.text } }
        ],
        [
            ...subjects.flatMap(sub => [
                { content: subjectShortNames[sub] || sub.toUpperCase().substring(0,3), styles: { halign: 'center' } },
                { content: 'PT', styles: { halign: 'center', fontSize: 7, textColor: colors.muted } }
            ]),
            { content: 'AGG', styles: { halign: 'center', fontStyle: 'bold' } },
            { content: 'DIV', styles: { halign: 'center', fontStyle: 'bold' } },
            { content: 'TOT', styles: { halign: 'center', fontStyle: 'bold' } }
        ]
    ];

    const body = studentRows.map((row, index) => {
        const rowData: any[] = [
            (index + 1).toString(),
            row.student.name, 
        ];

        subjects.forEach(sub => {
            const mark = (row.marks as any)[sub];
            const { points } = calculateGrade(mark);
            rowData.push(mark !== undefined ? mark : '-');
            rowData.push(mark !== undefined ? points : '-');
        });

        rowData.push(row.aggregate || '-');
        rowData.push(row.division);
        rowData.push(row.totalMarks);

        return rowData;
    });

    // @ts-ignore
    doc.autoTable({
        startY: 45,
        head: head,
        body: body,
        theme: 'grid',
        styles: {
            font: 'helvetica',
            fontSize: 9,
            textColor: colors.text,
            lineColor: colors.border,
            lineWidth: 0.1,
            cellPadding: 1.5
        },
        headStyles: { 
            fillColor: colors.primary, 
            textColor: colors.white, 
            fontStyle: 'bold', 
            halign: 'center',
            lineWidth: 0
        },
        bodyStyles: {
            valign: 'middle'
        },
        alternateRowStyles: {
            fillColor: colors.secondary
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' }, // No
            1: { cellWidth: 55, halign: 'left', fontStyle: 'bold' }, // Name
            // Dynamic columns handled automatically or could be specific
        },
        margin: { left: margin, right: margin }
    });

    // Footer Stamp
    const totalPages = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    const timestamp = new Date().toLocaleString();
    doc.text(`Generated on ${timestamp} | Broadway Report System`, margin, pageHeight - 5);
    doc.text(`${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 5, { align: 'right' });


    // ================= PAGE 2: ANALYSIS =================
    doc.addPage();
    
    // Page 2 Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...colors.primary);
    doc.text(`PERFORMANCE ANALYSIS`, margin, 20);
    doc.setFontSize(10);
    doc.setTextColor(...colors.muted);
    doc.text(`${selectedClass} - ${typeText}`, margin, 25);

    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(margin, 28, pageWidth - margin, 28);

    // 1. Grade Distribution Table
    const grades = ['D1', 'D2', 'C3', 'C4', 'C5', 'C6', 'P7', 'P8', 'F9'];
    const analysisHead = [['SUBJECT', ...grades]];
    
    const analysisBody = subjects.map(sub => {
        const counts: {[key:string]: number} = {};
        grades.forEach(g => counts[g] = 0);
        
        studentRows.forEach(row => {
            const mark = (row.marks as any)[sub];
            if (mark !== undefined) {
                const { grade } = calculateGrade(mark);
                if (counts[grade] !== undefined) counts[grade]++;
            }
        });

        return [subjectShortNames[sub], ...grades.map(g => counts[g])];
    });

    doc.setFontSize(12);
    doc.setTextColor(...colors.text);
    doc.text("Grade Distribution Breakdown", margin, 38);

    // @ts-ignore
    doc.autoTable({
        startY: 42,
        head: analysisHead,
        body: analysisBody,
        theme: 'grid',
        styles: { fontSize: 9, lineColor: colors.border, lineWidth: 0.1, textColor: colors.text },
        headStyles: { fillColor: colors.primary, textColor: colors.white, fontStyle: 'bold', halign: 'center' },
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin },
        tableWidth: 180
    });

    // 2. Marks Analysis (Stats)
    const statsHead = [['SUBJECT', 'AVERAGE', 'HIGHEST', 'LOWEST']];
    const statsBody = subjects.map(sub => {
        const marks = studentRows.map(r => (r.marks as any)[sub]).filter(m => m !== undefined);
        const max = marks.length ? Math.max(...marks) : 0;
        const min = marks.length ? Math.min(...marks) : 0;
        const sum = marks.reduce((a, b) => a + b, 0);
        const avg = marks.length ? (sum / marks.length).toFixed(1) : '0.0';
        
        return [subjectShortNames[sub], avg, max, min];
    });

    // @ts-ignore
    doc.autoTable({
        startY: (doc as any).lastAutoTable.finalY + 15,
        head: statsHead,
        body: statsBody,
        theme: 'grid',
        styles: { fontSize: 9, lineColor: colors.border, lineWidth: 0.1, textColor: colors.text },
        headStyles: { fillColor: [71, 85, 105], textColor: colors.white, fontStyle: 'bold' }, // Slate 600
        columnStyles: { 0: { fontStyle: 'bold' } },
        margin: { left: margin },
        tableWidth: 120
    });

    // 3. Best Performer Box
    if (bestPerformer) {
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        
        // Draw a nice card for best performer
        doc.setFillColor(240, 253, 244); // Light green bg
        doc.setDrawColor(187, 247, 208); // Green border
        doc.roundedRect(margin, finalY, 120, 25, 2, 2, 'FD');

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(21, 128, 61); // Green 700
        doc.text("BEST PERFORMING LEARNER", margin + 5, finalY + 8);
        
        doc.setFontSize(14);
        doc.setTextColor(...colors.text);
        doc.text(bestPerformer.student.name, margin + 5, finalY + 18);
        
        doc.setFontSize(11);
        doc.text(`AGGREGATE: ${bestPerformer.aggregate}  |  DIVISION: ${bestPerformer.division}`, margin + 5, finalY + 23);
    }
    
    // Footer P2
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generated on ${timestamp}`, margin, pageHeight - 5);
    doc.text(`${doc.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
  };

  const generateSheet = async () => {
    if (!settings) return;
    setLoading(true);

    // 1. Fetch Data
    const allStudents = await dbService.getStudents();
    const classStudents = allStudents.filter(s => s.classLevel === selectedClass);
    const allMarks = await dbService.getMarks();
    const year = settings.currentYear || new Date().getFullYear();

    if (classStudents.length === 0) {
        alert("No students found for this class.");
        setLoading(false);
        return;
    }

    const doc = new jspdf.jsPDF('l', 'mm', 'a4'); // Landscape
    
    // Determine which reports to generate
    const reportsToGenerate = selectedType === 'BOTH' 
        ? [AssessmentType.BOT, AssessmentType.EOT] 
        : [selectedType];

    // Loop through reports
    for (let i = 0; i < reportsToGenerate.length; i++) {
        const type = reportsToGenerate[i];
        if (i > 0) doc.addPage(); // Add page for next report
        generateSection(doc, type, classStudents, allMarks, settings, year);
    }

    doc.save(`Assessment_Sheet_${selectedClass}_Term${selectedTerm}_${selectedType}.pdf`);
    setLoading(false);
  };

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Class Assessments & Analytics</h1>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select 
                    className={inputClasses}
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value as ClassLevel)}
                >
                    {Object.values(ClassLevel).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select 
                    className={inputClasses}
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as AssessmentType | 'BOTH')}
                >
                    <option value="BOTH">Combined (BOT & EOT)</option>
                    <option value={AssessmentType.BOT}>Beginning of Term</option>
                    <option value={AssessmentType.EOT}>End of Term</option>
                </select>
            </div>
            <div className="flex items-end gap-2">
                 <Button onClick={generateSheet} disabled={loading || !settings} className="flex-1 justify-center">
                    {loading ? 'Generating...' : '🖨️ PDF'}
                </Button>
                <Button onClick={downloadCSV} variant="outline" disabled={loading} className="flex-1 justify-center">
                    📊 CSV
                </Button>
            </div>
        </div>

        {/* Live Analytics Dashboard */}
        {analyzing ? <div className="py-10 text-center text-gray-500">Analyzing class data...</div> : stats && (
            <div className="border-t border-gray-100 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Card 1: Division Breakdown */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Division Performance</h3>
                        <div className="h-32 w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.divisions}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" fontSize={10} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" fill="#0033cc">
                                        {stats.divisions.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={['#28a745', '#17a2b8', '#ffc107', '#dc3545'][index]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                     {/* Card 2: Gender Comparison */}
                     <div className="bg-gray-50 p-4 rounded border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Average Aggregate by Gender</h3>
                        <div className="flex items-center justify-around h-24">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-blue-600">{stats.gender.maleAvg}</div>
                                <div className="text-xs text-gray-500">BOYS ({stats.gender.maleCount})</div>
                            </div>
                            <div className="h-10 w-px bg-gray-300"></div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-pink-600">{stats.gender.femaleAvg}</div>
                                <div className="text-xs text-gray-500">GIRLS ({stats.gender.femaleCount})</div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Subject Performance */}
                    <div className="bg-gray-50 p-4 rounded border border-gray-100 overflow-y-auto max-h-40">
                        <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">Subject Averages</h3>
                        <div className="space-y-2">
                            {stats.subjects.map((sub: any) => (
                                <div key={sub.name} className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-gray-600">{sub.name}</span>
                                    <div className="flex items-center w-2/3 gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{width: `${sub.avg}%`}}></div>
                                        </div>
                                        <span className="w-6 text-right font-bold text-gray-700">{sub.avg}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="text-center text-xs text-gray-400">
                    Analysis based on {stats.totalStudents} active records for {selectedType === 'BOTH' ? 'End of Term' : (selectedType === 'BOT' ? 'Beginning of Term' : 'End of Term')}.
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
