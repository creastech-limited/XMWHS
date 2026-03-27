import React, { useState, useEffect, useRef, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import {
  Search, Download, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, Eye,
} from 'lucide-react';
import AdminSidebar from '../../components/Adminsidebar';
import AdminHeader from '../../components/AdminHeader';
import type { Student, School, SchoolsResponse } from '../../types/student';
import {
  getAllSchools,
  getStudentsInSchoolByAdmin,
  uploadStudentPhotosZip,
} from '../../services/api/studentService';
import CardFront from '../../components/IDCard/CardFront';
import CardBack from '../../components/IDCard/CardBack';
import {
  drawCardFront,
  drawCardBack,
  type CardStudent,
} from '../../components/cardDrawer';

// ─── Helpers ──────────────────────────────────────────────────────────────
function normaliseStudents(raw: Student[]) {
  return raw.map((s) => ({
    ...s,
    displayName:
      s.fullName ||
      (s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : '') ||
      s.name || 'Unknown',
    photoUrl: (() => {
      const pic = s.profilePics || s.profilePicture || '';
      if (!pic) return '';
      if (pic.startsWith('http')) return pic.replace(/ /g, '%20');
      const path = pic.startsWith('/') ? pic : `/${pic}`;
      const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
      return `${base}${path}`.replace(/ /g, '%20');
    })(),
    qrData:          s.QRcode ?? s.qrcode ?? `GRACE-${s._id}`,
    className:       s.Class ?? s.academicDetails?.classAdmittedTo ?? s.classAdmittedTo ?? '',
    session:         '2024/2025',
    admissionNumber: s.admissionNumber ?? '',
  }));
}

type NormalisedStudent = ReturnType<typeof normaliseStudents>[number];
const PER_PAGE = 10;

const LOGO_URL  = '/graceschhollogo.png';
const XPAY_URL  = '/xpay.jpeg';
const CARD_MM_W = 54;
const CARD_MM_H = 85.6;

// ─── Separate Layout Component (prevents recreating on every render)
const Layout = ({ children, sidebarOpen, setSidebarOpen, activeMenu, setActiveMenu }: { children: React.ReactNode; sidebarOpen: boolean; setSidebarOpen: (v: boolean) => void; activeMenu: string; setActiveMenu: (v: string) => void; }) => (
  <div className="flex h-screen bg-gray-100">
    <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} setActiveMenu={setActiveMenu} />
    <div className="flex-1 flex flex-col overflow-hidden">
      <AdminHeader sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} />
      <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>
    </div>
  </div>
);

// ─── Main Page ─────────────────────────────────────────────────────────────
const IDCardGenerator = () => {
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [activeMenu, setActiveMenu]           = useState('id-cards');
  const [schools, setSchools]                 = useState<School[]>([]);
  const [schoolsLoading, setSchoolsLoading]   = useState(true);
  const [schoolsError, setSchoolsError]       = useState('');
  const [selectedSchool, setSelectedSchool]   = useState<School | null>(null);
  const [schoolSearch, setSchoolSearch]       = useState('');
  const [students, setStudents]               = useState<NormalisedStudent[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError]     = useState('');
  const [search, setSearch]                   = useState('');
  const [classFilter, setClassFilter]         = useState('All');
  const [selected, setSelected]               = useState<Set<string>>(new Set());
  const [page, setPage]                       = useState(1);
  const [generating, setGenerating]           = useState(false);
  const [progress, setProgress]               = useState({ current: 0, total: 0, name: '' });
  const [previewStudent, setPreviewStudent]   = useState<NormalisedStudent | null>(null);
  const [zipUploading, setZipUploading]       = useState(false);
  const [zipResult, setZipResult]             = useState<{ message: string; updated: number } | null>(null);
  const [zipError, setZipError]               = useState('');
  const zipInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch schools
  useEffect(() => {
    setSchoolsLoading(true);
    getAllSchools()
      .then((res: SchoolsResponse) => {
        const raw = res.data ?? res.schools ?? (Array.isArray(res) ? (res as School[]) : []);
        setSchools(raw.filter((s) => (s.school_id || s._id) && s.schoolName));
      })
      .catch((e: { response?: { data?: { message?: string } } }) =>
        setSchoolsError(e?.response?.data?.message ?? 'Failed to load schools')
      )
      .finally(() => setSchoolsLoading(false));
  }, []);

  // ── Fetch students
  useEffect(() => {
    if (!selectedSchool) return;
    setStudentsLoading(true);
    setStudentsError('');
    setStudents([]);
    setSelected(new Set());
    setPage(1);
    setSearch('');
    setClassFilter('All');
    setZipResult(null);
    setZipError('');
    const id = selectedSchool.schoolId ?? selectedSchool.school_id ?? selectedSchool._id ?? '';
    getStudentsInSchoolByAdmin(id)
      .then((res) => setStudents(normaliseStudents(res.data ?? res.students ?? [])))
      .catch((e: { response?: { data?: { message?: string } } }) =>
        setStudentsError(e?.response?.data?.message ?? 'Failed to load students')
      )
      .finally(() => setStudentsLoading(false));
  }, [selectedSchool]);

  // ── Derived (using useMemo to prevent unnecessary recalculations)
  const classes = useMemo(() => 
    ['All', ...Array.from(new Set(students.map((s) => s.className).filter(Boolean))).sort()],
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((s) => {
      const matchSearch =
        s.displayName.toLowerCase().includes(q) ||
        (s.email?.toLowerCase() ?? '').includes(q) ||
        s._id.includes(q) ||
        (s.student_id?.toLowerCase() ?? '').includes(q) ||
        (s.admissionNumber?.toLowerCase() ?? '').includes(q);

      return matchSearch && (classFilter === 'All' || s.className === classFilter);
    });
  }, [students, search, classFilter]);

  const totalPages     = Math.ceil(filtered.length / PER_PAGE);
  const paginated      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const targetStudents = selected.size > 0 ? students.filter((s) => selected.has(s._id)) : filtered;

  const toggleSelect = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });

  const toggleSelectAll = () => {
    if (selected.size === filtered.length && filtered.length > 0) setSelected(new Set());
    else setSelected(new Set(filtered.map((s) => s._id)));
  };

  // ── Zip upload
  const handleZipUpload = async (file: File) => {
    if (!file.name.endsWith('.zip')) { setZipError('Please select a .zip file'); return; }
    setZipUploading(true); setZipError(''); setZipResult(null);
    try {
      const result = await uploadStudentPhotosZip(file);
      setZipResult(result);
      if (selectedSchool) {
        const id = selectedSchool.schoolId ?? selectedSchool.school_id ?? selectedSchool._id ?? '';
        const res = await getStudentsInSchoolByAdmin(id);
        setStudents(normaliseStudents(res.data ?? res.students ?? []));
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setZipError(err?.response?.data?.message ?? 'Upload failed.');
    } finally { setZipUploading(false); }
  };

  // ── PDF Generation
  const runPDFGeneration = async (studentList: NormalisedStudent[]) => {
    if (!studentList.length) { setStudentsError('No students to generate cards for.'); return; }

    setGenerating(true);
    setStudentsError('');
    setProgress({ current: 0, total: studentList.length, name: '' });

    const canvas = document.createElement('canvas');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [CARD_MM_W, CARD_MM_H] });
    let pagesAdded = 0;

    try {
      for (let i = 0; i < studentList.length; i++) {
        const s = studentList[i];
        setProgress({ current: i + 1, total: studentList.length, name: s.displayName });

        const cardStudent: CardStudent = {
          name:            s.displayName,
          email:           s.email,
          photoUrl:        s.photoUrl,
          qrData:          s.qrData,
          admissionNumber: s.admissionNumber,
        };

        await drawCardFront(canvas, cardStudent, LOGO_URL);
        const frontJpeg = canvas.toDataURL('image/jpeg', 0.92);
        if (pagesAdded > 0) pdf.addPage([CARD_MM_W, CARD_MM_H], 'portrait');
        pdf.addImage(frontJpeg, 'JPEG', 0, 0, CARD_MM_W, CARD_MM_H);
        pagesAdded++;

        await drawCardBack(canvas, LOGO_URL, XPAY_URL);
        const backJpeg = canvas.toDataURL('image/jpeg', 0.92);
        pdf.addPage([CARD_MM_W, CARD_MM_H], 'portrait');
        pdf.addImage(backJpeg, 'JPEG', 0, 0, CARD_MM_W, CARD_MM_H);
        pagesAdded++;

        await new Promise((r) => setTimeout(r, 50));
      }

      if (pagesAdded === 0) throw new Error('No cards were generated.');

      const schoolSlug = selectedSchool?.schoolName?.replace(/\s+/g, '-') ?? 'school';
      const label = studentList.length === 1
        ? studentList[0].displayName.replace(/\s+/g, '-')
        : selected.size > 0 ? `selected-${selected.size}` : `all-${studentList.length}`;

      pdf.save(`GraceSchools-${schoolSlug}-IDCards-${label}.pdf`);
    } catch (err) {
      console.error('[PDF]', err);
      setStudentsError(err instanceof Error ? err.message : 'Failed to generate PDF.');
    } finally {
      setGenerating(false);
      setProgress({ current: 0, total: 0, name: '' });
    }
  };

  const pct = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  const filteredSchools = schools.filter((sc) =>
    sc.schoolName?.toLowerCase().includes(schoolSearch.toLowerCase())
  );

  // ════════════════════════════════════════════════════════════════════════
  // School picker
  // ════════════════════════════════════════════════════════════════════════
  if (!selectedSchool) {
    return (
      <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ID Card Generator</h1>
          <p className="text-gray-600 mt-1">Select a school to generate student ID cards</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input type="text" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black" placeholder="Search schools..." value={schoolSearch} onChange={(e) => setSchoolSearch(e.target.value)} />
          </div>
        </div>
        {schoolsLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>}
        {schoolsError  && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{schoolsError}</div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSchools.map((sc) => (
            <button key={sc.school_id ?? sc._id} onClick={() => setSelectedSchool(sc)}
              className="bg-white border border-gray-200 rounded-lg p-5 text-left hover:border-blue-400 hover:shadow-md transition-all duration-200 group shadow-sm">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-white font-bold text-lg overflow-hidden bg-blue-600">
                {sc.logo ? <img src={sc.logo} alt={sc.schoolName} className="w-full h-full object-cover" /> : sc.schoolName?.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors leading-snug mb-1">{sc.schoolName}</h3>
              {sc.schoolEmail   && <p className="text-xs text-gray-400 truncate">{sc.schoolEmail}</p>}
              {sc.schoolAddress && <p className="text-xs text-gray-400 truncate mt-0.5">{sc.schoolAddress}</p>}
              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                Generate IDs <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>
        {!schoolsLoading && filteredSchools.length === 0 && !schoolsError && (
          <p className="text-gray-400 text-sm text-center py-12">No schools found.</p>
        )}
      </Layout>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // Student list
  // ════════════════════════════════════════════════════════════════════════
  return (
    <Layout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} activeMenu={activeMenu} setActiveMenu={setActiveMenu}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => { setSelectedSchool(null); setStudents([]); }}
          className="text-gray-400 hover:text-gray-700 transition p-1.5 rounded-lg hover:bg-gray-100 border border-gray-200">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{selectedSchool.schoolName}</h1>
          <p className="text-gray-600 mt-0.5 text-sm">ID Card Generator</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: students.length,                         color: 'bg-blue-100',   text: 'text-blue-600'   },
          { label: 'Filtered',       value: filtered.length,                         color: 'bg-purple-100', text: 'text-purple-600' },
          { label: 'Selected',       value: selected.size > 0 ? selected.size : '—', color: 'bg-orange-100', text: 'text-orange-600' },
          { label: 'Will Generate',  value: targetStudents.length,                   color: 'bg-green-100',  text: 'text-green-600'  },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`${stat.color} p-2 rounded-lg`}><Download className={`h-5 w-5 ${stat.text}`} /></div>
              <div className="ml-3">
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Zip Upload */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-gray-800">Upload Student Photos</p>
          <p className="text-xs text-gray-400 mt-0.5">Upload a <code className="bg-gray-100 px-1 rounded text-gray-600">photos.zip</code> file before generating cards</p>
        </div>
        {zipResult && <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2"><CheckCircle className="w-4 h-4" />{zipResult.updated} photos updated</div>}
        {zipError  && <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"><XCircle className="w-4 h-4" />{zipError}</div>}
        <input ref={zipInputRef} type="file" accept=".zip" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleZipUpload(f); e.target.value = ''; }} />
        <button className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50 bg-white" disabled={zipUploading} onClick={() => zipInputRef.current?.click()}>
          {zipUploading ? <><div className="animate-spin rounded-full h-4 w-4 border-t-2 border-blue-500" />Uploading...</> : <><Download className="w-4 h-4 rotate-180" />Upload photos.zip</>}
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
        <div className="flex gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input 
              ref={searchInputRef}
              type="text"
              autoComplete="off"
              spellCheck="false"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm text-black"
              placeholder="Search by name, email, ID or adm no..." 
              value={search} 
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 whitespace-nowrap" value={classFilter} onChange={(e) => { setClassFilter(e.target.value); setPage(1); }}>
            {classes.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition bg-white" onClick={toggleSelectAll}>
            {selected.size === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All Filtered'}
          </button>
          {selected.size > 0 && (
            <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 transition bg-white" onClick={() => setSelected(new Set())}>
              Clear ({selected.size})
            </button>
          )}
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2 text-sm font-medium transition flex items-center gap-2 disabled:opacity-60"
            disabled={generating || targetStudents.length === 0}
            onClick={() => runPDFGeneration(targetStudents)}
          >
            <Download className="w-4 h-4" />
            {generating ? `Generating… ${pct}%` : selected.size > 0 ? `Generate PDF (${selected.size} selected)` : `Generate PDF (all ${filtered.length})`}
          </button>
        </div>
      </div>

      {studentsLoading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" /></div>}
      {studentsError  && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{studentsError}</div>}

      {/* Table */}
      {!studentsLoading && !studentsError && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 w-10"><input type="checkbox" className="cursor-pointer" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} /></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Adm No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginated.length > 0 ? paginated.map((s) => (
                  <tr key={s._id} className={`hover:bg-gray-50 transition-colors ${selected.has(s._id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-6 py-4"><input type="checkbox" className="cursor-pointer" checked={selected.has(s._id)} onChange={() => toggleSelect(s._id)} onClick={(e) => e.stopPropagation()} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {s.photoUrl ? (
                          <img src={s.photoUrl} alt={s.displayName} crossOrigin="anonymous" className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">{s.displayName.charAt(0).toUpperCase()}</div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.displayName}</p>
                          <p className="text-xs text-gray-400">{s.student_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 hidden md:table-cell font-medium">{s.admissionNumber || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">{s.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{s.className || '—'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${s.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {s.status === 'Active' ? <CheckCircle size={11} className="mr-1" /> : <XCircle size={11} className="mr-1" />}{s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.photoUrl ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} />Ready</span> : <span className="text-xs text-amber-500">No photo</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition" onClick={(e) => { e.stopPropagation(); setPreviewStudent(s); }} title="Preview ID Card">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-gray-400 text-sm">No students found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * PER_PAGE + 1}</span>–<span className="font-medium">{Math.min(page * PER_PAGE, filtered.length)}</span> of <span className="font-medium">{filtered.length}</span>
              </p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-100" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /></button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let n = i + 1;
                  if (totalPages > 5 && page > 3)            n = page - 3 + i;
                  if (totalPages > 5 && page > totalPages - 2) n = totalPages - 4 + i;
                  return n <= totalPages ? (
                    <button key={n} onClick={() => setPage(n)} className={`px-3 py-1 border rounded-md text-sm ${page === n ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>{n}</button>
                  ) : null;
                })}
                <button className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-100" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Progress Overlay */}
      {generating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-10 text-center min-w-[320px] shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Generating ID Cards</h3>
            <p className="text-sm text-gray-500 mb-1">{progress.current} / {progress.total} processed</p>
            <p className="text-xs text-gray-400 h-4 mb-3 truncate">{progress.name}</p>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-200 bg-blue-600" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-2xl font-bold text-blue-600 mt-2">{pct}%</p>
            <p className="text-xs text-gray-400 mt-2">PDF will download automatically when complete</p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewStudent && (
        <div className="fixed inset-0 bg-black/85 flex flex-col items-center justify-center z-50 p-6 overflow-y-auto" onClick={() => setPreviewStudent(null)}>
          <p className="text-white font-semibold text-lg mb-1">{previewStudent.displayName}</p>
          <p className="text-gray-400 text-xs mb-1">{previewStudent.className} · Adm No: {previewStudent.admissionNumber || '—'}</p>
          <p className="text-gray-500 text-xs mb-5">Click outside to close</p>
          <div className="flex gap-5 flex-wrap justify-center" onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="text-xs text-gray-400 text-center mb-2 tracking-widest uppercase">Front</p>
              <CardFront student={{
                id: previewStudent._id,
                name: previewStudent.displayName,
                email: previewStudent.email,
                photoUrl: previewStudent.photoUrl,
                qrData: previewStudent.qrData,
                className: previewStudent.className,
                session: previewStudent.session,
                admissionNumber: previewStudent.admissionNumber,
              }} />
            </div>
            <div>
              <p className="text-xs text-gray-400 text-center mb-2 tracking-widest uppercase">Back</p>
              <CardBack />
            </div>
          </div>
          <div className="flex gap-3 mt-6" onClick={(e) => e.stopPropagation()}>
            <button className="border border-gray-500 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/10 transition" onClick={() => setPreviewStudent(null)}>Close</button>
            <button
              className="bg-blue-600 hover:bg-blue-700 rounded-xl px-6 py-2.5 text-sm font-bold text-white flex items-center gap-2 transition"
              onClick={async () => {
                const s = previewStudent;
                setPreviewStudent(null);
                await new Promise((r) => setTimeout(r, 150));
                await runPDFGeneration([s]);
              }}
            >
              <Download className="w-4 h-4" /> Download This Card
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default IDCardGenerator;