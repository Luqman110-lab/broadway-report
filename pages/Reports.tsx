
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import { ClassLevel, AssessmentType, SUBJECTS_UPPER, SUBJECTS_LOWER, Teacher, SchoolSettings } from '../types';
import { calculateGrade, getComment, calculatePosition, getClassTeacherComment, getHeadTeacherComment } from '../services/grading';
import { Button } from '../components/Button';

// Declare jsPDF types roughly for TypeScript since we are using CDN
declare const jspdf: any;

export const Reports: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<ClassLevel>(ClassLevel.P7);
  const [selectedTerm, setSelectedTerm] = useState(1);
  const [reportType, setReportType] = useState<AssessmentType>(AssessmentType.EOT);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
      const loadConfig = async () => {
          const s = await dbService.getSettings();
          setSettings(s);
          if (s) setSelectedTerm(s.currentTerm);
      };
      loadConfig();
  }, []);

  // Helper to find the subject teacher
  const findSubjectTeacher = (teachers: Teacher[], subject: string, classLevel: ClassLevel): string => {
    const teacher = teachers.find(t => 
        t.roles.includes('Subject Teacher') && 
        t.subjects.includes(subject) && 
        t.teachingClasses.includes(classLevel)
    );
    return teacher ? teacher.name : "";
  };

  const formatDate = (dateString: string) => {
      if (!dateString) return 'TBA';
      const date = new Date(dateString);
      const dayNames = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      
      const dayOfWeek = dayNames[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      
      let suffix = 'TH';
      if (day === 1 || day === 21 || day === 31) suffix = 'ST';
      else if (day === 2 || day === 22) suffix = 'ND';
      else if (day === 3 || day === 23) suffix = 'RD';

      return `${dayOfWeek} ${day}${suffix} ${month} ${date.getFullYear()}`;
  };

  const generatePDF = async () => {
    if (!settings) {
        alert("Settings not loaded. Please refresh.");
        return;
    }
    setLoading(true);
    
    // 1. Fetch Data
    const allStudents = await dbService.getStudents();
    const classStudents = allStudents.filter(s => s.classLevel === selectedClass);
    const allMarks = await dbService.getMarks();
    const allTeachers = await dbService.getTeachers();
    
    // Use year from settings or current date
    const year = settings.currentYear || new Date().getFullYear();

    if (classStudents.length === 0) {
        alert("No students found for this class.");
        setLoading(false);
        return;
    }

    // 2. Prepare Ranking Data for both BOT and EOT
    const classBotMarks = allMarks.filter(m => 
        m.term === selectedTerm && 
        m.year === year && 
        m.type === AssessmentType.BOT &&
        classStudents.some(s => s.id === m.studentId)
    );

    const classEotMarks = allMarks.filter(m => 
        m.term === selectedTerm && 
        m.year === year && 
        m.type === AssessmentType.EOT &&
        classStudents.some(s => s.id === m.studentId)
    );

    const doc = new jspdf.jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10; // Tighter margins to fit everything

    // Define Colors
    const primaryColor = [0, 51, 204]; // #0033cc Broadway Blue
    const redColor = [200, 0, 0];      // Red for Footer bar

    // 3. Generate Pages
    for (let i = 0; i < classStudents.length; i++) {
        const student = classStudents[i];
        if (i > 0) doc.addPage();

        // Fetch marks
        const botRecord = classBotMarks.find(m => m.studentId === student.id);
        const eotRecord = classEotMarks.find(m => m.studentId === student.id);

        // Calculate Positions & Comments
        const botPos = calculatePosition(student.id!, classBotMarks);
        const eotPos = calculatePosition(student.id!, classEotMarks);
        
        // Determine which record to use for comments/aggregates based on Report Type
        const isBotReport = reportType === AssessmentType.BOT;
        const mainRecord = isBotReport ? botRecord : eotRecord;
        const mainAgg = mainRecord ? mainRecord.aggregate : 0;
        
        const ctComment = getClassTeacherComment(mainAgg, student);
        const htComment = getHeadTeacherComment(mainAgg, student);
        
        // Find specific teachers
        const classTeacher = allTeachers.find(t => t.roles.includes('Class Teacher') && t.assignedClass === selectedClass && t.assignedStream === student.stream);
        const headTeacher = allTeachers.find(t => t.roles.includes('Headteacher'));
        const headTeacherName = headTeacher ? headTeacher.name : "LUQMAN MUWONGE";
        const classTeacherName = classTeacher ? classTeacher.name : "";

        // ================= HEADER =================
        const logoSize = 25;
        
        // Logo
        if (settings.logoBase64) {
            try {
                const logoData = settings.logoBase64;
                let format = 'PNG';
                if (logoData.startsWith('data:image/jpeg') || logoData.startsWith('data:image/jpg')) format = 'JPEG';
                doc.addImage(logoData, format, margin, 10, logoSize, logoSize);
            } catch (e) {
                doc.setDrawColor(200);
                doc.setFillColor(240, 240, 240);
                doc.circle(margin + (logoSize/2), 22, 12, 'F');
            }
        }

        // School Details (Centered in remaining space to the right of logo)
        const contentStartX = margin + logoSize + 5;
        const contentWidth = pageWidth - contentStartX - margin;
        const textCenterX = contentStartX + (contentWidth / 2);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text(settings.schoolName, textCenterX, 15, { align: "center" });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(settings.addressBox, textCenterX, 21, { align: "center" });
        doc.text(settings.contactPhones, textCenterX, 26, { align: "center" });

        // Report Title Box
        doc.setFillColor(...primaryColor);
        doc.roundedRect(textCenterX - 50, 30, 100, 7, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        const termText = selectedTerm === 1 ? "ONE" : selectedTerm === 2 ? "TWO" : "THREE";
        const reportTitle = isBotReport 
            ? `BEGINNING OF TERM ${termText} REPORT ${year}`
            : `END OF TERM ${termText} REPORT ${year}`;
        doc.text(reportTitle, textCenterX, 35, { align: "center" });

        // ================= STUDENT PROFILE (Blue Block) =================
        let cursorY = 42;
        doc.setFillColor(...primaryColor);
        doc.roundedRect(margin, cursorY, pageWidth - (margin * 2), 16, 2, 2, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");

        // Row 1
        const row1Y = cursorY + 6;
        doc.text(`NAME:  ${student.name}`, margin + 5, row1Y);
        doc.text(`CLASS:  ${student.classLevel}`, pageWidth / 2, row1Y);
        doc.text(`STREAM:  ${student.stream}`, pageWidth - margin - 50, row1Y);

        // Row 2
        const row2Y = cursorY + 12;
        doc.text(`TERM:  ${termText}`, margin + 5, row2Y);
        doc.text(`YEAR:  ${year}`, pageWidth / 2, row2Y);
        doc.text(`SCHOOL PAYCODE:  ${student.paycode || ''}`, pageWidth - margin - 50, row2Y);

        // ================= ASSESSMENTS HELPER =================
        const subjects = ['P1','P2','P3'].includes(selectedClass) ? SUBJECTS_LOWER : SUBJECTS_UPPER;

        const drawAssessmentTable = (startY: number, title: string, record: any, position: string) => {
            // Title
            doc.setFillColor(...primaryColor);
            doc.roundedRect((pageWidth / 2) - 40, startY, 80, 6, 1, 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(title, pageWidth / 2, startY + 4.5, { align: "center" });

            // Table Data
            const tableBody = subjects.map(sub => {
                const mark = record?.marks ? (record.marks as any)[sub] : undefined;
                const { grade } = calculateGrade(mark);
                const teacherName = findSubjectTeacher(allTeachers, sub, selectedClass);
                const displayTeacher = teacherName ? teacherName.split(' ').pop() : ''; 
                
                return [
                    sub.toUpperCase(),
                    mark !== undefined ? mark : '-',
                    grade,
                    getComment(sub, mark || 0),
                    displayTeacher || ''
                ];
            });

            // Total Row logic
            const agg = record ? record.aggregate : '-';
            const div = record ? record.division : '-';
            
            // @ts-ignore
            doc.autoTable({
                startY: startY + 8,
                head: [['SUBJECT', 'MARKS', 'GRADE', 'COMMENT', 'TEACHER']],
                body: tableBody,
                theme: 'grid',
                headStyles: { 
                    fillColor: primaryColor, 
                    textColor: 255, 
                    fontStyle: 'bold', 
                    halign: 'left',
                    fontSize: 9
                },
                bodyStyles: { 
                    textColor: 0, 
                    fontSize: 9, 
                    cellPadding: 2, // reduced padding
                    valign: 'middle'
                },
                columnStyles: {
                    0: { cellWidth: 40, fontStyle: 'bold' },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 20, halign: 'center' },
                    3: { cellWidth: 'auto' },
                    4: { cellWidth: 35 }
                },
                margin: { left: margin, right: margin },
            });

            // Summary Row (Manually drawn to match the layout "TOTAL ... DIVISION ... POSN")
            let finalY = (doc as any).lastAutoTable.finalY;
            
            doc.setFillColor(...primaryColor);
            doc.rect(margin, finalY, pageWidth - (margin * 2), 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            
            const summaryY = finalY + 5;
            doc.text(`TOTAL AGGREGATE:   ${agg}`, margin + 2, summaryY);
            doc.text(`DIVISION:   ${div}`, pageWidth / 2, summaryY);
            doc.text(`CLASS POSN:   ${position}`, pageWidth - margin - 40, summaryY);

            return finalY + 10; // Return next Y
        };

        cursorY += 20; // Space after profile

        // Draw BOT (Always drawn for BOT reports. Drawn as history for EOT reports)
        if (isBotReport || botRecord || !isBotReport) { 
            // Logic: 
            // If Report Type is BOT: Draw BOT Table.
            // If Report Type is EOT: Draw BOT Table (as history).
            cursorY = drawAssessmentTable(cursorY, "BEGINNING OF TERM", botRecord, botPos);
        }

        // Draw EOT (Only if Report Type is EOT)
        if (!isBotReport) {
            cursorY += 5; // Gap between tables
            cursorY = drawAssessmentTable(cursorY, "END OF TERM", eotRecord, eotPos);
        }

        // ================= COMMENTS SECTION =================
        cursorY += 5;
        // Header
        doc.setFillColor(...primaryColor);
        doc.roundedRect((pageWidth / 2) - 30, cursorY, 60, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text("COMMENTS", pageWidth / 2, cursorY + 4.5, { align: "center" });
        
        cursorY += 8;

        // Comments Table Construction (Manual for custom styling)
        const commentBoxHeight = 12;
        const commentWidth = pageWidth - (margin * 2);
        
        // Class Teacher Row
        doc.setFillColor(...primaryColor);
        doc.rect(margin, cursorY, 35, commentBoxHeight, 'F'); // Label bg
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.text("CLASSTEACHER", margin + 2, cursorY + 7);

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(margin + 35, cursorY, commentWidth - 75, commentBoxHeight, 'S'); // Comment box border
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text(ctComment, margin + 37, cursorY + 7, { maxWidth: commentWidth - 77 });

        doc.setFillColor(...primaryColor);
        doc.rect(pageWidth - margin - 40, cursorY, 40, commentBoxHeight, 'F'); // Name bg
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        const ctNameParts = doc.splitTextToSize(classTeacherName.toUpperCase(), 38);
        doc.text(ctNameParts, pageWidth - margin - 38, cursorY + 5);

        cursorY += commentBoxHeight + 1; // Gap

        // Head Teacher Row
        doc.setFillColor(...primaryColor);
        doc.rect(margin, cursorY, 35, commentBoxHeight, 'F'); 
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "normal"); 
        doc.text("HEADTEACHER", margin + 2, cursorY + 7);

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(margin + 35, cursorY, commentWidth - 75, commentBoxHeight, 'S');
        doc.setTextColor(0, 0, 0);
        doc.text(htComment, margin + 37, cursorY + 7, { maxWidth: commentWidth - 77 });

        doc.setFillColor(...primaryColor);
        doc.rect(pageWidth - margin - 40, cursorY, 40, commentBoxHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        const htNameParts = doc.splitTextToSize(headTeacherName.toUpperCase(), 38);
        doc.text(htNameParts, pageWidth - margin - 38, cursorY + 5);


        // ================= FOOTER =================
        // Anchor to bottom with safe margin
        const bottomMargin = 10;
        const footerContentHeight = 35;
        const footerY = pageHeight - footerContentHeight - bottomMargin;

        // 1. Blue Bar (Next Term)
        doc.setFillColor(...primaryColor);
        doc.rect(0, footerY, pageWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        
        const nextTermY = footerY + 5;
        doc.text("NEXT TERM STARTS ON:", margin, nextTermY);
        // More even spacing for dates
        const dateStr = `BOARDERS: ${formatDate(settings.nextTermBeginBoarders)}      DAY LEARNERS: ${formatDate(settings.nextTermBeginDay)}`;
        doc.text(dateStr, margin + 50, nextTermY);

        // 2. Red Bar (Location & Reg)
        const redBarY = footerY + 10;
        const redBarHeight = 15; 
        doc.setFillColor(...redColor);
        doc.roundedRect(margin, redBarY, pageWidth - (margin * 2), redBarHeight, 3, 3, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        
        const lineHeight = 4;
        const redTextStartY = redBarY + 5;
        
        doc.text("WE ARE LOCATED IN NAAMA-MITYANA ALONG THE KAMPALA-MUBENDE HIGHWAY", pageWidth / 2, redTextStartY, { align: "center" });
        doc.text(`REGISTRATION NUMBER: ${settings.regNumber}`, pageWidth / 2, redTextStartY + lineHeight, { align: "center" });
        doc.text(`CENTRE NUMBER ${settings.centreNumber}`, pageWidth / 2, redTextStartY + (lineHeight * 2), { align: "center" });

        // 3. Motto
        const mottoY = redBarY + redBarHeight + 6;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(settings.motto, pageWidth / 2, mottoY, { align: "center" });

    }

    doc.save(`Broadway_Report_${selectedClass}_Term${selectedTerm}_${reportType}.pdf`);
    setLoading(false);
  };

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-gray-900 shadow-sm focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none sm:text-sm transition-all duration-200";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Report Cards</h1>
      
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select 
                    className={inputClasses}
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as AssessmentType)}
                >
                    <option value={AssessmentType.BOT}>Beginning of Term (BOT)</option>
                    <option value={AssessmentType.EOT}>End of Term (EOT)</option>
                </select>
            </div>
        </div>

        <div className="flex justify-start">
             <Button onClick={generatePDF} disabled={loading || !settings} size="lg">
                {loading ? 'Generating PDFs...' : 'Generate Class Report Cards (PDF)'}
            </Button>
        </div>
        
        {!settings && (
            <p className="mt-4 text-sm text-red-500">
                Settings not loaded. Please check your internet connection or reload.
            </p>
        )}
      </div>
    </div>
  );
};
