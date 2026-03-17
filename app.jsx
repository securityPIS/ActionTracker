import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { initializeApp, deleteApp } from 'firebase/app';
import app, { db, auth, storage } from './firebase.js';
import { collection, collectionGroup, doc, addDoc, updateDoc, deleteDoc, onSnapshot, setDoc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword, getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import {
  CheckCircle, Circle, Plus, Users, FileText, Upload, Briefcase, AlertCircle,
  Image as ImageIcon, Calendar, CalendarDays, Layout, Trash2, Edit2, X, Clock, AlertTriangle,
  Check, XCircle, ArrowLeft, BarChart2, List, History, Menu, Home, User,
  LayoutDashboard, LogOut, ChevronDown, ChevronUp, ChevronRight, Settings, ClipboardList,
  Search, Save, ExternalLink, File, Table, Presentation, FileImage, Mail,
  Building, UserPlus, PieChart, Activity, Lock, Eye, EyeOff, Power, LogIn, PenSquare, MapPin,
  ChevronLeft, Copy, Bell, CheckCheck
} from 'lucide-react';

// --- DATA AWAL (DEFAULT) ---
const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Penyusunan Laporan Tahunan 2024",
    description: "Mengumpulkan data dari semua departemen dan menyusun layout buku tahunan.",
    pic: "Budi Santoso",
    deadline: "2024-03-30",
    progress: 33,
    subtasks: [
      {
        id: 101,
        title: "Kompilasi Data Keuangan",
        assignee: "Siti Aminah",
        deadline: "2024-03-20",
        status: "completed",
        evidence: "Laporan_Keuangan_Final.pdf",
        comments: [
          { text: "Sudah divalidasi finance.", user: "Siti Aminah", type: "evidence", timestamp: "26/01/2024 10:00" },
          { text: "Tolong pastikan format sesuai template baru.", user: "Budi Santoso", type: "revision", timestamp: "25/01/2024 14:00" }
        ],
        lastUpdated: "26/01/2024 10:00"
      },
      {
        id: 102,
        title: "Drafting Narasi CEO",
        assignee: "Rudi Hartono",
        deadline: "2024-03-25",
        status: "waiting_review",
        evidence: "Draft_Narasi_v1.docx",
        comments: [
          { text: "Mohon direview pak.", user: "Rudi Hartono", type: "evidence", timestamp: "26/01/2024 14:30" }
        ],
        lastUpdated: "26/01/2024 14:30"
      },
      {
        id: 103,
        title: "Desain Cover & Layout",
        assignee: "Siti Aminah",
        deadline: "2024-03-28",
        status: "pending",
        evidence: null,
        comments: [],
        lastUpdated: "20/01/2024 09:00"
      },
    ]
  },
  {
    id: 2,
    title: "Maintenance Server & Keamanan",
    description: "Update patch keamanan rutin dan backup database Q1.",
    pic: "Andi Wijaya",
    deadline: "2024-02-15",
    progress: 0,
    subtasks: [
      {
        id: 201,
        title: "Backup Database Utama",
        assignee: "Rudi Hartono",
        deadline: "2024-02-10",
        status: "revision",
        evidence: "Backup_Log.txt",
        comments: [
          { text: "File corrupt, tolong ulang backup manual.", user: "Andi Wijaya", type: "revision", timestamp: "25/01/2024 16:45" },
          { text: "Backup otomatis gagal kemarin.", user: "Rudi Hartono", type: "evidence", timestamp: "25/01/2024 09:00" }
        ],
        lastUpdated: "25/01/2024 16:45"
      },
      {
        id: 202,
        title: "Update Firewall Rules",
        assignee: "Rudi Hartono",
        deadline: "2024-02-12",
        status: "pending",
        evidence: null,
        comments: [],
        lastUpdated: "20/01/2024 08:00"
      },
    ]
  }
];

const DEFAULT_USERS = [
  { id: 1, name: "Budi Santoso", email: "budi.s@pertamina.com", role: "PIC", department: "Strategic Planning", status: "Active" },
  { id: 2, name: "Siti Aminah", email: "siti.a@pertamina.com", role: "Assignee", department: "Finance", status: "Active" },
  { id: 3, name: "Rudi Hartono", email: "rudi.h@pertamina.com", role: "Assignee", department: "IT Infrastructure", status: "Active" },
  { id: 4, name: "Andi Wijaya", email: "andi.w@pertamina.com", role: "PIC", department: "IT Support", status: "Active" },
  { id: 5, name: "Sarah Larasati", email: "sarah.l@pertamina.com", role: "PIC", department: "Digital Product", status: "Active" },
  { id: 6, name: "Dimas Anggara", email: "dimas.a@pertamina.com", role: "Assignee", department: "Software Engineering", status: "Active" },
  { id: 7, name: "Jessica Tan", email: "jessica.t@pertamina.com", role: "PIC", department: "Human Resources", status: "Active" },
  { id: 8, name: "Reza Mahendra", email: "reza.m@pertamina.com", role: "Assignee", department: "Legal", status: "Active" },
];

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png'];

const DEFAULT_KPIS = [
  { id: 1, title: "Revenue Growth", group: "FINANCE" },
  { id: 2, title: "Cost Reduction", group: "FINANCE" },
  { id: 3, title: "Customer Satisfaction Index", group: "CUSTOMER FOCUS" },
  { id: 4, title: "Market Share", group: "CUSTOMER FOCUS" },
  { id: 5, title: "Operational Efficiency", group: "INTERNAL PROCESS" },
  { id: 6, title: "Employee Training Hours", group: "LEARNING & GROWTH" },
];

const DEFAULT_EVENTS = [
  {
    id: 1,
    title: "Annual Security Drill",
    startDate: "2026-03-15",
    endDate: "2026-03-16",
    eventType: "external",
    location: "Main Gate, Area A",
    participants: ["Budi Santoso", "Reza Mahendra"]
  }
];

const KPI_GROUPS = ['FINANCE', 'CUSTOMER FOCUS', 'INTERNAL PROCESS', 'LEARNING & GROWTH'];
const MAX_EVIDENCE_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EVIDENCE_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'ppt', 'pptx', 'jpg', 'jpeg', 'png']);
const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
]);
const INACTIVITY_LOGOUT_MINUTES = 30;
const INACTIVITY_LOGOUT_MS = INACTIVITY_LOGOUT_MINUTES * 60 * 1000;

const DEFAULT_TEMPLATES = [
  {
    id: 1,
    name: "IT Project Template",
    subtasks: [
      { title: "Requirement Analysis", assignee: "", deadline: "" },
      { title: "Design & Planning", assignee: "", deadline: "" },
      { title: "Development", assignee: "", deadline: "" },
      { title: "Testing & QA", assignee: "", deadline: "" },
      { title: "Deployment", assignee: "", deadline: "" },
    ]
  },
  {
    id: 2,
    name: "Report Submission Template",
    subtasks: [
      { title: "Pengumpulan Data", assignee: "", deadline: "" },
      { title: "Penyusunan Draft", assignee: "", deadline: "" },
      { title: "Review & Revisi", assignee: "", deadline: "" },
      { title: "Finalisasi Dokumen", assignee: "", deadline: "" },
    ]
  },
];

// --- HELPER COMPONENTS ---
const UserAvatar = ({ name, photoURL = "", className = "w-6 h-6", size = 128 }) => {
  const safeName = typeof name === 'string' ? name : 'User';
  const [hasPhotoError, setHasPhotoError] = React.useState(false);
  const seed = encodeURIComponent(safeName);
  const src = !hasPhotoError && photoURL
    ? photoURL
    : `https://ui-avatars.com/api/?name=${seed}&background=random&color=fff&size=${size}&rounded=true&bold=true`;

  React.useEffect(() => {
    setHasPhotoError(false);
  }, [photoURL, safeName]);

  return (
    <img
      src={src}
      alt={safeName}
      className={`rounded-full object-cover border border-white shadow-sm flex-shrink-0 ${className}`}
      title={safeName}
      onError={() => setHasPhotoError(true)}
      referrerPolicy="no-referrer"
    />
  );
};

const DonutChart = ({ data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercent = 0;
  const getCoordinatesForPercent = (percent) => { const x = Math.cos(2 * Math.PI * percent); const y = Math.sin(2 * Math.PI * percent); return [x, y]; };

  if (total === 0) return <div className="flex items-center justify-center h-48 w-48 rounded-full border-4 border-slate-100"><span className="text-slate-400 text-xs">No Data</span></div>;

  return (
    <div className="relative w-48 h-48">
      <svg viewBox="-1 -1 2 2" style={{ transform: 'rotate(-90deg)' }} className="w-full h-full">
        {data.map((slice, index) => {
          if (slice.value === 0) return null;
          const startPercent = cumulativePercent; const slicePercent = slice.value / total; cumulativePercent += slicePercent; const endPercent = cumulativePercent;
          const [startX, startY] = getCoordinatesForPercent(startPercent); const [endX, endY] = getCoordinatesForPercent(endPercent);
          const largeArcFlag = slicePercent > 0.5 ? 1 : 0;
          const pathData = `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
          return <path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="0.05" />;
        })}
        <circle cx="0" cy="0" r="0.6" fill="white" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col"><span className="text-2xl font-bold text-slate-800">{total}</span><span className="text-xs text-slate-500">Subtasks</span></div>
    </div>
  );
};

// --- HELPER FUNCTIONS ---
const getCurrentDateTime = () => {
  const now = new Date();
  return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const formatDateIndo = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return "-";
  try {
    const parsed = parseDateValue(dateStr);
    if (!parsed) return dateStr;
    return parsed.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch (e) {
    return dateStr;
  }
};

const parseDateValue = (dateStr) => {
  if (!dateStr || dateStr === 'TBD') return null;
  const parsed = new Date(`${dateStr}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toDateInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 10);
};

const toLocalDateKey = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const diffDays = (start, end) => Math.round((end - start) / (1000 * 60 * 60 * 24));

const getTimelinePercent = (date, start, segments, zoomLevel, edge = 'center') => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !(start instanceof Date) || Number.isNaN(start.getTime()) || !Array.isArray(segments) || segments.length === 0) {
    return -1;
  }

  const segmentSpanDays = zoomLevel === 'week' ? 7 : 1;
  const offsetDays = diffDays(start, date);
  const segmentIndex = Math.floor(offsetDays / segmentSpanDays);
  const dayInSegment = offsetDays - (segmentIndex * segmentSpanDays);

  let segmentFraction = (dayInSegment + 0.5) / segmentSpanDays;
  if (edge === 'start') {
    segmentFraction = dayInSegment / segmentSpanDays;
  } else if (edge === 'end') {
    segmentFraction = (dayInSegment + 1) / segmentSpanDays;
  }

  return Math.min(100, Math.max(0, ((segmentIndex + segmentFraction) / segments.length) * 100));
};

const getTimelineMarkerPlacement = (date, start, segments, zoomLevel, edge = 'center') => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !(start instanceof Date) || Number.isNaN(start.getTime()) || !Array.isArray(segments) || segments.length === 0) {
    return null;
  }

  const segmentSpanDays = zoomLevel === 'week' ? 7 : 1;
  const offsetDays = diffDays(start, date);
  if (offsetDays < 0) return null;

  const segmentIndex = Math.floor(offsetDays / segmentSpanDays);
  if (segmentIndex < 0 || segmentIndex >= segments.length) return null;

  const dayInSegment = offsetDays - (segmentIndex * segmentSpanDays);
  let offsetPercent = ((dayInSegment + 0.5) / segmentSpanDays) * 100;
  if (edge === 'start') {
    offsetPercent = (dayInSegment / segmentSpanDays) * 100;
  } else if (edge === 'end') {
    offsetPercent = ((dayInSegment + 1) / segmentSpanDays) * 100;
  }

  return {
    segmentIndex,
    offsetPercent: Math.min(100, Math.max(0, offsetPercent)),
  };
};

const formatTimelineLabel = (date, zoomLevel) => {
  if (zoomLevel === 'week') {
    const weekEnd = addDays(date, 6);
    return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${weekEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  }
  return date.toLocaleDateString('id-ID', { day: 'numeric' });
};

const getGanttStatusLabel = (status) => {
  if (status === 'waiting_review') return 'Review';
  if (status === 'revision') return 'Revise';
  if (status === 'completed') return 'Completed';
  return 'Ready';
};

const getDefaultSubtaskStartDate = (deadlineStr) => {
  const deadlineDate = parseDateValue(deadlineStr);
  if (!deadlineDate) return "";
  return toDateInputValue(addDays(deadlineDate, -3));
};

const getEventTypeMeta = (eventType) => {
  if (eventType === 'internal') {
    return {
      label: 'Internal',
      cardClass: 'border-blue-200 bg-blue-50/40',
      badgeClass: 'bg-blue-100 text-blue-700 border-blue-200',
      chipClass: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
      accentClass: 'bg-blue-600',
    };
  }

  return {
    label: 'External',
    cardClass: 'border-emerald-200 bg-emerald-50/40',
    badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    chipClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    accentClass: 'bg-emerald-600',
  };
};

const getLatestProjectUpdate = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return "-";
  const sorted = [...task.subtasks].sort((a, b) => {
    const parse = d => { if (!d) return 0; const [D, T] = d.split(' '); const [dd, mm, yy] = D.split('/'); const [hh, mn] = T.split(':'); return new Date(yy, mm - 1, dd, hh, mn).getTime(); };
    return parse(b.lastUpdated) - parse(a.lastUpdated);
  });
  return sorted[0]?.lastUpdated || "-";
};

const getFileMeta = (filename) => {
  if (!filename) return { type: 'unknown', icon: File, color: 'text-slate-500', bg: 'bg-slate-100', label: 'FILE' };
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': return { type: 'pdf', icon: FileText, color: 'text-red-500', bg: 'bg-red-50', label: 'PDF' };
    case 'doc': case 'docx': return { type: 'word', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50', label: 'WORD' };
    case 'xls': case 'xlsx': case 'csv': return { type: 'excel', icon: Table, color: 'text-green-600', bg: 'bg-green-50', label: 'EXCEL' };
    case 'ppt': case 'pptx': return { type: 'ppt', icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50', label: 'PPT' };
    case 'jpg': case 'jpeg': case 'png': case 'gif': return { type: 'image', icon: ImageIcon, color: 'text-purple-500', bg: 'bg-purple-50', label: 'IMG' };
    default: return { type: 'file', icon: File, color: 'text-slate-500', bg: 'bg-slate-100', label: ext.toUpperCase() };
  }
};

const UserTaskPage = lazy(() => import('./pages/UserTaskPage.jsx'));
const FilePage = lazy(() => import('./pages/FilePage.jsx'));
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'));
const ManageUserPage = lazy(() => import('./pages/ManageUserPage.jsx'));
const KpiPage = lazy(() => import('./pages/KpiPage.jsx'));
const CoePage = lazy(() => import('./pages/CoePage.jsx'));
const TemplateTaskPage = lazy(() => import('./pages/TemplateTaskPage.jsx'));

const validateEvidenceFiles = (files) => {
  const invalidFile = files.find((file) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    const extensionAllowed = extension && ALLOWED_EVIDENCE_EXTENSIONS.has(extension);
    const mimeAllowed = !file.type || ALLOWED_EVIDENCE_MIME_TYPES.has(file.type);
    return !extensionAllowed || !mimeAllowed || file.size > MAX_EVIDENCE_FILE_SIZE;
  });

  if (!invalidFile) return { ok: true, files };

  if (invalidFile.size > MAX_EVIDENCE_FILE_SIZE) {
    return { ok: false, message: `File ${invalidFile.name} melebihi batas 10 MB.` };
  }

  return {
    ok: false,
    message: `File ${invalidFile.name} tidak diizinkan. Hanya PDF, Office, CSV, JPG, dan PNG yang diperbolehkan.`,
  };
};

const getProjectStatus = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) return { label: 'SUBMITTED', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' };
  const hasRevision = task.subtasks.some(s => s.status === 'revision');
  const hasWaitingReview = task.subtasks.some(s => s.status === 'waiting_review');
  const isAllCompleted = task.subtasks.every(s => s.status === 'completed');
  if (hasRevision) return { label: 'REVISE', color: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', ring: 'ring-red-500' };
  if (hasWaitingReview) return { label: 'REVIEW', color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800', ring: 'ring-yellow-500' };
  if (isAllCompleted) return { label: 'COMPLETED', color: 'bg-green-50 border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', ring: 'ring-green-500' };
  return { label: 'SUBMITTED', color: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-500' };
};

const calculateTaskProgress = (subtasksList = []) => {
  if (subtasksList.length === 0) return 0;
  const completedCount = subtasksList.filter((subtask) => subtask.status === 'completed').length;
  return Math.round((completedCount / subtasksList.length) * 100);
};

// --- LOGIN PAGE ---
const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password, setError);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Pertamina" className="h-16 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Action Tracker</h1>
          <p className="text-slate-500 text-sm">Masuk untuk mengelola task monitoring</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
          <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><div className="relative"><Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type="email" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><div className="relative"><Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2"><LogIn className="w-5 h-5" /> Masuk</button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} Pertamina Action Tracker</div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function App() {
  // Firebase Realtime State
  const [taskDocs, setTaskDocs] = useState([]);
  const [subtaskDocs, setSubtaskDocs] = useState([]);
  const [users, setUsers] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [events, setEvents] = useState([]);
  const [taskTemplates, setTaskTemplates] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Auth State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const inactivityTimerRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        if (inactivityTimerRef.current) {
          window.clearTimeout(inactivityTimerRef.current);
          inactivityTimerRef.current = null;
        }
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserRole('');
        setTaskDocs([]);
        setSubtaskDocs([]);
        setUsers([]);
        setKpis([]);
        setEvents([]);
        setTaskTemplates([]);
        setNotifications([]);
        setDataLoaded(true);
        return;
      }

      setDataLoaded(false);

      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (!userDoc.exists()) {
          await signOut(auth);
          return;
        }

        const userData = { id: userDoc.id, ...userDoc.data() };
        if (userData.status === 'Inactive') {
          await signOut(auth);
          return;
        }

        setCurrentUser(userData);
        setUserRole(userData.role);
        setIsLoggedIn(true);
        setActivePage('jobtask');
      } catch (error) {
        console.error('Failed to restore auth session:', error);
        setIsLoggedIn(false);
        setCurrentUser(null);
        setUserRole('');
      }
    });

    return () => unsubscribe();
  }, []);

  // UI States
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [activePage, setActivePage] = useState('jobtask');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuExpanded, setIsUserMenuExpanded] = useState(false);
  const [coeViewMode, setCoeViewMode] = useState('calendar');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [editingMainTaskId, setEditingMainTaskId] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [ganttRangePreset, setGanttRangePreset] = useState('fit');
  const [ganttRangeStart, setGanttRangeStart] = useState('');
  const [ganttRangeEnd, setGanttRangeEnd] = useState('');
  const [ganttZoomLevel, setGanttZoomLevel] = useState('day');
  const [ganttShowCompleted, setGanttShowCompleted] = useState(true);
  const [ganttTooltip, setGanttTooltip] = useState(null);
  const [showGanttFilters, setShowGanttFilters] = useState(false);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Ya, lanjutkan",
    cancelLabel: "Batal",
    tone: "blue",
  });
  const confirmationResolverRef = useRef(null);

  // Fetch Public Holidays
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const year = currentCalendarDate.getFullYear();
        const response = await fetch(`https://libur.deno.dev/api?year=${year}`);
        if (response.ok) {
          const data = await response.json();
          setHolidays(data);
        }
      } catch (error) {
        console.error("Failed to fetch holidays:", error);
      }
    };
    fetchHolidays();
  }, [currentCalendarDate.getFullYear()]);

  // Modal States
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [showSubtaskModal, setShowSubtaskModal] = useState(false);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [showUserTaskDetailModal, setShowUserTaskDetailModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showEventDetailModal, setShowEventDetailModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Data Selection States
  const [selectedSubtask, setSelectedSubtask] = useState(null);
  const [subtaskToRevise, setSubtaskToRevise] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedEventDetail, setSelectedEventDetail] = useState(null);

  // Form States
  const [evidenceText, setEvidenceText] = useState("");
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [evidenceLink, setEvidenceLink] = useState("");
  const [evidenceUploading, setEvidenceUploading] = useState(false);
  const evidenceFileInputRef = useRef(null);
  const [reviseComment, setReviseComment] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPic, setNewTaskPic] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskIsEvent, setNewTaskIsEvent] = useState(false);
  const [newEventStartDate, setNewEventStartDate] = useState("");
  const [newEventEndDate, setNewEventEndDate] = useState("");
  const [newEventLocation, setNewEventLocation] = useState("");
  const [newEventParticipants, setNewEventParticipants] = useState([]);
  const [subtaskFormTitle, setSubtaskFormTitle] = useState("");
  const [subtaskFormAssignee, setSubtaskFormAssignee] = useState("");
  const [subtaskFormDeadline, setSubtaskFormDeadline] = useState("");
  const [subtaskFormStartDate, setSubtaskFormStartDate] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [newUserForm, setNewUserForm] = useState({ name: "", email: "", password: "", role: "Assignee", department: "", photoURL: "" });
  const [editUserForm, setEditUserForm] = useState({ id: null, name: "", email: "", role: "", department: "", photoURL: "" });
  const [newUserAvatarFile, setNewUserAvatarFile] = useState(null);
  const [editUserAvatarFile, setEditUserAvatarFile] = useState(null);
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [kpiForm, setKpiForm] = useState({ title: "", group: "FINANCE" });
  const [expandedKPIGroups, setExpandedKPIGroups] = useState({
    'FINANCE': true, 'CUSTOMER FOCUS': true, 'INTERNAL PROCESS': true, 'LEARNING & GROWTH': true
  });
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({ title: "", startDate: "", endDate: "", location: "", participants: [], linkedTaskId: "", eventType: "external" });
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ name: "", subtasks: [{ title: "", assignee: "", deadline: "" }] });
  const [selectedTemplateId, setSelectedTemplateId] = useState("");

  // Search States
  const [userTaskSearch, setUserTaskSearch] = useState("");
  const [fileSearch, setFileSearch] = useState("");

  // Collapsible State for Subtasks
  const [expandedSubtasks, setExpandedSubtasks] = useState({});

  const dataNeeds = useMemo(() => ({
    tasks: ['jobtask', 'user-task', 'file', 'dashboard', 'coe'].includes(activePage) || showNewTaskModal || showSubtaskModal || showReviseModal || showEvidenceModal || showUserTaskDetailModal || showEventModal || showEventDetailModal,
    users: ['jobtask', 'user-task', 'dashboard', 'manage-user', 'coe'].includes(activePage) || showAddUserModal || showEditUserModal || showTemplateModal || showEventModal || showSubtaskModal || showNewTaskModal,
    kpis: activePage === 'kpi' || showKPIModal,
    events: activePage === 'coe' || activePage === 'jobtask' || showEventModal || showEventDetailModal,
    templates: activePage === 'template-task' || showTemplateModal || showNewTaskModal,
  }), [
    activePage,
    showAddUserModal,
    showEditUserModal,
    showEvidenceModal,
    showEventDetailModal,
    showEventModal,
    showKPIModal,
    showNewTaskModal,
    showReviseModal,
    showSubtaskModal,
    showTemplateModal,
    showUserTaskDetailModal,
  ]);

  const tasks = useMemo(() => {
    const subtaskOverridesByParent = new Map();

    subtaskDocs.forEach((subtask) => {
      const parentKey = String(subtask.parentId || '');
      if (!parentKey) return;
      if (!subtaskOverridesByParent.has(parentKey)) {
        subtaskOverridesByParent.set(parentKey, new Map());
      }
      subtaskOverridesByParent.get(parentKey).set(String(subtask.id), subtask);
    });

    return taskDocs.map((task) => {
      const embeddedSubtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const overrides = subtaskOverridesByParent.get(String(task.id)) || new Map();
      const mergedSubtasks = embeddedSubtasks.map((subtask) => {
        const override = overrides.get(String(subtask.id));
        if (!override) return subtask;
        if (subtask.assignee && override.assignee && subtask.assignee !== override.assignee) {
          return subtask;
        }
        return { ...subtask, ...override, id: subtask.id };
      });

      return {
        ...task,
        subtasks: mergedSubtasks,
        progress: calculateTaskProgress(mergedSubtasks),
      };
    });
  }, [subtaskDocs, taskDocs]);

  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);
  const activeUsers = useMemo(() => users.filter((user) => user.status === 'Active'), [users]);
  const activePicUsers = useMemo(() => activeUsers.filter((user) => user.role === 'PIC'), [activeUsers]);
  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );
  const eventsSorted = useMemo(
    () => [...events].sort((a, b) => new Date(a?.startDate || 0) - new Date(b?.startDate || 0)),
    [events]
  );
  const eventByLinkedTaskId = useMemo(() => {
    const linkedEvents = new Map();
    events.forEach((event) => {
      if (event.linkedTaskId && !linkedEvents.has(event.linkedTaskId)) {
        linkedEvents.set(event.linkedTaskId, event);
      }
    });
    return linkedEvents;
  }, [events]);
  const eventByTitle = useMemo(() => {
    const titledEvents = new Map();
    events.forEach((event) => {
      if (event.title && !titledEvents.has(event.title)) {
        titledEvents.set(event.title, event);
      }
    });
    return titledEvents;
  }, [events]);
  const holidaysByDate = useMemo(() => new Map(holidays.map((holiday) => [holiday.date, holiday])), [holidays]);
  const kpisByGroup = useMemo(() => {
    const grouped = new Map(KPI_GROUPS.map((group) => [group, []]));
    kpis.forEach((kpi) => {
      if (!grouped.has(kpi.group)) grouped.set(kpi.group, []);
      grouped.get(kpi.group).push(kpi);
    });
    return grouped;
  }, [kpis]);
  const calendarEventsByDate = useMemo(() => {
    const map = new Map();
    events.forEach((event) => {
      if (!event?.startDate) return;
      const start = parseDateValue(event.startDate);
      const end = parseDateValue(event.endDate || event.startDate);
      if (!start || !end) return;
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
        const key = toLocalDateKey(cursor);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(event);
      }
    });
    return map;
  }, [events]);

  const activeTask = selectedTaskId ? taskById.get(selectedTaskId) || null : null;

  // Firestore Realtime Listeners
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    setDataLoaded(false);
    const unsubs = [];
    if (dataNeeds.tasks) {
      unsubs.push(onSnapshot(collection(db, 'tasks'), (snap) => {
        setTaskDocs(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }));
      unsubs.push(onSnapshot(collectionGroup(db, 'subtasks'), (snap) => {
        setSubtaskDocs(
          snap.docs.map((subtaskDoc) => {
            const data = subtaskDoc.data();
            return {
              ...data,
              id: data.id ?? subtaskDoc.id,
              parentId: data.parentId ?? subtaskDoc.ref.parent.parent?.id ?? "",
            };
          })
        );
      }));
    } else {
      setTaskDocs([]);
      setSubtaskDocs([]);
    }
    if (dataNeeds.users) {
      unsubs.push(onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }));
    } else {
      setUsers([]);
    }
    if (dataNeeds.kpis) {
      unsubs.push(onSnapshot(collection(db, 'kpis'), (snap) => {
        setKpis(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }));
    } else {
      setKpis([]);
    }
    if (dataNeeds.events) {
      unsubs.push(onSnapshot(collection(db, 'events'), (snap) => {
        setEvents(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              ...data,
              id: d.id,
              eventType: data.eventType || (data.linkedTaskId ? 'internal' : 'external'),
            };
          })
        );
      }));
    } else {
      setEvents([]);
    }
    if (dataNeeds.templates) {
      unsubs.push(onSnapshot(collection(db, 'templates'), (snap) => {
        setTaskTemplates(snap.docs.map(d => ({ ...d.data(), id: d.id })));
      }));
    } else {
      setTaskTemplates([]);
    }
    const timer = setTimeout(() => setDataLoaded(true), 300);
    return () => { unsubs.forEach(u => u()); clearTimeout(timer); };
  }, [dataNeeds, isLoggedIn]);

  useEffect(() => {
    if (!tasks.length) {
      setSelectedTaskId(null);
      return;
    }

    if (!selectedTaskId || !taskById.has(selectedTaskId)) {
      setSelectedTaskId(tasks[0].id);
    }
  }, [selectedTaskId, taskById, tasks]);

  // --- LOGIC ---

  const toggleSubtask = (subtaskId) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [subtaskId]: !prev[subtaskId]
    }));
  };

  const handleLogin = async (email, password, setErrorCallback) => {
    try {
      setDataLoaded(false);
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrorCallback('Email atau password salah.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorCallback('Terlalu banyak percobaan login. Coba lagi beberapa saat lagi.');
      } else {
        setErrorCallback('Terjadi kesalahan. Silakan coba lagi.');
      }
    }
  };

  const performLogout = async (message = '') => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    await signOut(auth);
    setIsSidebarOpen(false);
    if (message) {
      window.alert(message);
    }
  };

  const handleLogout = async () => {
    setShowNotificationsPanel(false);
    await performLogout();
  };

  useEffect(() => {
    if (!isLoggedIn) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      return undefined;
    }

    const resetInactivityTimer = () => {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }

      inactivityTimerRef.current = window.setTimeout(() => {
        void performLogout(`Sesi berakhir karena tidak ada aktivitas selama ${INACTIVITY_LOGOUT_MINUTES} menit.`);
      }, INACTIVITY_LOGOUT_MS);
    };

    const handleUserActivity = () => {
      resetInactivityTimer();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        resetInactivityTimer();
      }
    };

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetInactivityTimer();

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    };
  }, [isLoggedIn]);

  // Filter Logic
  const filteredUserTasks = useMemo(() => {
    if (!currentUser) return [];
    const filtered = tasks.flatMap(t =>
      t.subtasks.map(s => ({ ...s, parentId: t.id, parentTitle: t.title, parentPic: t.pic }))
    ).filter(sub =>
      (sub.assignee === currentUser.name || sub.parentPic === currentUser.name) &&
      (sub.title.toLowerCase().includes(userTaskSearch.toLowerCase()) || sub.parentTitle.toLowerCase().includes(userTaskSearch.toLowerCase()))
    );
    const statusOrder = { 'revision': 1, 'waiting_review': 2, 'pending': 3, 'completed': 4 };
    return filtered.sort((a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99));
  }, [tasks, currentUser, userTaskSearch]);

  const dashboardStats = useMemo(() => {
    const totalProjects = tasks.length;
    const allSubtasks = tasks.flatMap(t => t.subtasks);
    const totalSubtasks = allSubtasks.length;
    const completedSubtasks = allSubtasks.filter(s => s.status === 'completed').length;
    const waitingReview = allSubtasks.filter(s => s.status === 'waiting_review').length;
    const revision = allSubtasks.filter(s => s.status === 'revision').length;
    const pending = allSubtasks.filter(s => s.status === 'pending').length;
    const workload = {};
    allSubtasks.forEach(s => {
      if (!workload[s.assignee]) workload[s.assignee] = { total: 0, completed: 0 };
      workload[s.assignee].total++;
      if (s.status === 'completed') workload[s.assignee].completed++;
    });
    return { totalProjects, totalSubtasks, completedSubtasks, waitingReview, revision, pending, workload: Object.entries(workload).map(([name, stats]) => ({ name, ...stats })) };
  }, [tasks]);

  const userByName = useMemo(() => {
    const entries = users
      .filter((user) => user?.name)
      .map((user) => [user.name, user]);
    return new Map(entries);
  }, [users]);

  useEffect(() => {
    if (!currentUser?.id || users.length === 0) return;

    const latestCurrentUser = users.find((user) => user.id === currentUser.id);
    if (!latestCurrentUser) return;

    const hasChanged =
      latestCurrentUser.name !== currentUser.name ||
      latestCurrentUser.email !== currentUser.email ||
      latestCurrentUser.role !== currentUser.role ||
      latestCurrentUser.department !== currentUser.department ||
      latestCurrentUser.status !== currentUser.status ||
      latestCurrentUser.photoURL !== currentUser.photoURL;

    if (hasChanged) {
      setCurrentUser(latestCurrentUser);
      setUserRole(latestCurrentUser.role);
    }
  }, [users, currentUser]);

  useEffect(() => {
    if (!isLoggedIn || !currentUser?.id) {
      setNotifications([]);
      return undefined;
    }

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientUserId', '==', currentUser.id)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snap) => {
      const nextNotifications = snap.docs
        .map((notificationDoc) => ({ id: notificationDoc.id, ...notificationDoc.data() }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setNotifications(nextNotifications);
    });

    return () => unsubscribe();
  }, [currentUser?.id, isLoggedIn]);

  const newUserAvatarPreview = useMemo(
    () => (newUserAvatarFile ? URL.createObjectURL(newUserAvatarFile) : ""),
    [newUserAvatarFile]
  );

  const editUserAvatarPreview = useMemo(
    () => (editUserAvatarFile ? URL.createObjectURL(editUserAvatarFile) : ""),
    [editUserAvatarFile]
  );

  useEffect(() => {
    return () => {
      if (newUserAvatarPreview) {
        URL.revokeObjectURL(newUserAvatarPreview);
      }
    };
  }, [newUserAvatarPreview]);

  useEffect(() => {
    return () => {
      if (editUserAvatarPreview) {
        URL.revokeObjectURL(editUserAvatarPreview);
      }
    };
  }, [editUserAvatarPreview]);

  useEffect(() => {
    if (!activeTask?.subtasks?.length) return;

    const datedSubtasks = activeTask.subtasks
      .filter((subtask) => subtask.deadline)
      .map((subtask) => parseDateValue(subtask.deadline))
      .filter(Boolean);

    const mainDeadlineDate = parseDateValue(activeTask.deadline);
    if (mainDeadlineDate) {
      datedSubtasks.push(mainDeadlineDate);
    }
    if (datedSubtasks.length === 0) return;

    const earliest = new Date(Math.min(...datedSubtasks.map((date) => date.getTime())));
    const latest = new Date(Math.max(...datedSubtasks.map((date) => date.getTime())));
    const fitStart = addDays(earliest, -3);
    const fitEnd = addDays(latest, 7);
    const fitSpanDays = Math.max(1, diffDays(fitStart, fitEnd) + 1);

    setGanttRangePreset('fit');
    setGanttRangeStart(toDateInputValue(fitStart));
    setGanttRangeEnd(toDateInputValue(fitEnd));
    setGanttZoomLevel(fitSpanDays > 45 ? 'week' : 'day');
    setGanttShowCompleted(true);
    setGanttTooltip(null);
    setShowGanttFilters(false);
  }, [activeTask?.id]);

  const ganttData = useMemo(() => {
    if (!activeTask?.subtasks?.length || !ganttRangeStart || !ganttRangeEnd) return null;

    const start = parseDateValue(ganttRangeStart);
    const end = parseDateValue(ganttRangeEnd);
    if (!start || !end || end < start) return null;

    const visibleSubtasks = activeTask.subtasks
      .filter((subtask) => subtask.deadline)
      .filter((subtask) => ganttShowCompleted || subtask.status !== 'completed')
      .map((subtask) => {
        const deadlineDate = parseDateValue(subtask.deadline);
        return deadlineDate ? { ...subtask, deadlineDate } : null;
      })
      .filter(Boolean)
      .sort((a, b) => {
        const statusOrder = { revision: 1, waiting_review: 2, pending: 3, completed: 4 };
        const orderDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (orderDiff !== 0) return orderDiff;
        return a.deadlineDate - b.deadlineDate;
      });

    const totalDays = Math.max(1, diffDays(start, end) + 1);
    const zoomDays = ganttZoomLevel === 'week' ? 7 : 1;
    const segments = [];
    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, zoomDays)) {
      segments.push(new Date(cursor));
    }

    const mainTaskDeadlineDate = parseDateValue(activeTask.deadline);
    const mainTaskDeadlinePlacement = mainTaskDeadlineDate
      ? getTimelineMarkerPlacement(mainTaskDeadlineDate, start, segments, ganttZoomLevel, 'center')
      : null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPlacement = today >= start && today <= end
      ? getTimelineMarkerPlacement(today, start, segments, ganttZoomLevel, 'center')
      : null;

    return {
      start,
      end,
      segments,
      subtasks: visibleSubtasks,
      totalDays,
      mainTaskDeadlinePlacement,
      todayPlacement,
      zoomLevel: ganttZoomLevel,
    };
  }, [activeTask, ganttRangeStart, ganttRangeEnd, ganttShowCompleted, ganttZoomLevel]);

  const applyGanttPreset = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === '2w') {
      const nextStart = addDays(today, -7);
      const nextEnd = addDays(today, 7);
      setGanttRangePreset(preset);
      setGanttRangeStart(toDateInputValue(nextStart));
      setGanttRangeEnd(toDateInputValue(nextEnd));
      setGanttZoomLevel('day');
      return;
    }

    if (preset === '1m') {
      const nextStart = addDays(today, -7);
      const nextEnd = addDays(today, 30);
      setGanttRangePreset(preset);
      setGanttRangeStart(toDateInputValue(nextStart));
      setGanttRangeEnd(toDateInputValue(nextEnd));
      setGanttZoomLevel('day');
      return;
    }

    if (preset === '3m') {
      const nextStart = addDays(today, -14);
      const nextEnd = addDays(today, 90);
      setGanttRangePreset(preset);
      setGanttRangeStart(toDateInputValue(nextStart));
      setGanttRangeEnd(toDateInputValue(nextEnd));
      setGanttZoomLevel('week');
      return;
    }

    const datedSubtasks = (activeTask?.subtasks || [])
      .filter((subtask) => subtask.deadline)
      .map((subtask) => parseDateValue(subtask.deadline))
      .filter(Boolean);
    const mainDeadlineDate = parseDateValue(activeTask?.deadline);
    if (mainDeadlineDate) datedSubtasks.push(mainDeadlineDate);
    if (datedSubtasks.length === 0) return;

    const earliest = new Date(Math.min(...datedSubtasks.map((date) => date.getTime())));
    const latest = new Date(Math.max(...datedSubtasks.map((date) => date.getTime())));
    const nextStart = addDays(earliest, -3);
    const nextEnd = addDays(latest, 7);
    const spanDays = Math.max(1, diffDays(nextStart, nextEnd) + 1);

    setGanttRangePreset('fit');
    setGanttRangeStart(toDateInputValue(nextStart));
    setGanttRangeEnd(toDateInputValue(nextEnd));
    setGanttZoomLevel(spanDays > 45 ? 'week' : 'day');
  };

  const handleGanttTooltipMove = (event, subtask) => {
    setGanttTooltip({
      subtask,
      x: event.clientX + 16,
      y: event.clientY + 16,
    });
  };

  // Actions
  const recalculateProgress = (task, subtasksList) => {
    return { ...task, subtasks: subtasksList, progress: calculateTaskProgress(subtasksList) };
  };

  const getSubtaskDocRef = (taskId, subtaskId) => doc(db, 'tasks', String(taskId), 'subtasks', String(subtaskId));

  const buildSubtaskDocPayload = (task, subtask) => ({
    id: subtask.id,
    parentId: String(task.id),
    title: subtask.title,
    assignee: subtask.assignee || "Unassigned",
    startDate: subtask.startDate || "",
    deadline: subtask.deadline || "TBD",
    status: subtask.status || "pending",
    evidence: subtask.evidence || null,
    evidenceUrl: subtask.evidenceUrl || null,
    evidenceUrls: Array.isArray(subtask.evidenceUrls) ? subtask.evidenceUrls : [],
    evidenceLinks: Array.isArray(subtask.evidenceLinks) ? subtask.evidenceLinks : [],
    comments: Array.isArray(subtask.comments) ? subtask.comments : [],
    lastUpdated: subtask.lastUpdated || getCurrentDateTime(),
  });

  const syncSubtaskDoc = async (task, subtask, overrides = {}) => {
    const payload = { ...buildSubtaskDocPayload(task, subtask), ...overrides };
    await setDoc(getSubtaskDocRef(task.id, subtask.id), payload, { merge: true });
    return payload;
  };

  const deleteSubtaskDoc = async (taskId, subtaskId) => {
    await deleteDoc(getSubtaskDocRef(taskId, subtaskId));
  };

  const createNotifications = async (recipients, notificationInput) => {
    if (!currentUser?.id || !currentUser?.name || !Array.isArray(recipients) || recipients.length === 0) return;

    const uniqueRecipients = recipients.filter((recipient, index, array) => (
      recipient?.id
      && recipient.id !== currentUser.id
      && array.findIndex((item) => item?.id === recipient.id) === index
    ));

    if (uniqueRecipients.length === 0) return;

    await Promise.all(uniqueRecipients.map((recipient) => addDoc(collection(db, 'notifications'), {
      recipientUserId: recipient.id,
      recipientName: recipient.name,
      type: notificationInput.type,
      priority: notificationInput.priority || 'medium',
      title: notificationInput.title,
      message: notificationInput.message,
      targetType: notificationInput.targetType || 'subtask',
      targetId: notificationInput.targetId || '',
      parentTaskId: notificationInput.parentTaskId || '',
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      isRead: false,
      createdAt: Date.now(),
      meta: notificationInput.meta || {},
    })));
  };

  const getUserByName = (name) => userByName.get(name) || null;

  const getNotificationTimeLabel = (createdAt) => {
    if (!createdAt) return '';
    const diffMinutes = Math.max(0, Math.round((Date.now() - createdAt) / (1000 * 60)));
    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes}m lalu`;
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}j lalu`;
    const diffDays = Math.round(diffHours / 24);
    return `${diffDays}h lalu`;
  };

  const markNotificationAsRead = async (notificationId) => {
    const notification = notifications.find((item) => item.id === notificationId);
    if (!notification || notification.isRead) return;
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  };

  const markAllNotificationsAsRead = async () => {
    const unreadNotifications = notifications.filter((notification) => !notification.isRead);
    await Promise.all(unreadNotifications.map((notification) => updateDoc(doc(db, 'notifications', notification.id), { isRead: true })));
  };

  const openConfirmationDialog = ({
    title = "Konfirmasi",
    message,
    confirmLabel = "Ya, lanjutkan",
    cancelLabel = "Batal",
    tone = "blue",
  }) => new Promise((resolve) => {
    confirmationResolverRef.current = resolve;
    setConfirmationDialog({
      open: true,
      title,
      message,
      confirmLabel,
      cancelLabel,
      tone,
    });
  });

  const closeConfirmationDialog = (confirmed) => {
    setConfirmationDialog((prev) => ({ ...prev, open: false }));
    if (confirmationResolverRef.current) {
      confirmationResolverRef.current(confirmed);
      confirmationResolverRef.current = null;
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification) return;
    await markNotificationAsRead(notification.id);
    setShowNotificationsPanel(false);

    if (notification.targetType === 'subtask' && notification.parentTaskId) {
      const task = taskById.get(notification.parentTaskId);
      const targetSubtask = task?.subtasks?.find((subtask) => String(subtask.id) === String(notification.targetId));
      setSelectedTaskId(notification.parentTaskId);
      setActivePage('jobtask');
      setShowMobileDetail(true);
      setViewMode('list');

      if (targetSubtask) {
        setSelectedSubtask({
          ...targetSubtask,
          taskId: task.id,
          parentId: task.id,
          parentTitle: task.title,
          parentPic: task.pic,
        });
        setEvidenceText("");
        setShowUserTaskDetailModal(true);
      }
      return;
    }

    if (notification.targetType === 'task' && notification.targetId) {
      setSelectedTaskId(notification.targetId);
      setActivePage('jobtask');
      setShowMobileDetail(true);
    }
  };

  const submitEvidence = async () => {
    if (!selectedSubtask) return;
    if (evidenceFiles.length === 0 && !evidenceText && !evidenceLink) {
        alert("Pekerjaan wajib menyertakan setidaknya satu file atau satu tautan bukti, atau catatan.");
        return;
    }
    const confirmed = await openConfirmationDialog({
      title: "Kirim Subtask",
      message: `Apakah Anda yakin ingin mengirim subtask "${selectedSubtask.title}"? PIC akan menerima notifikasi untuk review.`,
      confirmLabel: "Ya, kirim",
      tone: "emerald",
    });
    if (!confirmed) {
      return;
    }
    const parentId = selectedSubtask.parentId || selectedSubtask.taskId;
    const task = taskById.get(parentId);
    if (!task) return;
    setEvidenceUploading(true);
    try {
      await syncSubtaskDoc(task, selectedSubtask);
      let uploadedEvidenceUrls = selectedSubtask.evidenceUrls || [];
      
      if (evidenceFiles.length > 0) {
        const uploadPromises = evidenceFiles.map(async (file) => {
          const ownerId = currentUser?.id || auth.currentUser?.uid;
          if (!ownerId) {
            throw new Error('Sesi pengguna tidak valid. Silakan login ulang.');
          }
          const filePath = `evidence/${parentId}/${selectedSubtask.id}/${ownerId}/${Date.now()}_${file.name}`;
          const fileRef = storageRef(storage, filePath);
          await uploadBytes(fileRef, file);
          const url = await getDownloadURL(fileRef);
          return { name: file.name, url };
        });
        
        const newUrls = await Promise.all(uploadPromises);
        uploadedEvidenceUrls = [...uploadedEvidenceUrls, ...newUrls];
      }
      
      // Handle legacy string evidence backward compatibility
      let legacyEvidenceName = selectedSubtask.evidence || null;
      let legacyEvidenceUrl = selectedSubtask.evidenceUrl || null;
      
      // if it's the first time uploading, keep legacy fields alive for simple UI
      if (!legacyEvidenceName && uploadedEvidenceUrls.length > 0) {
          legacyEvidenceName = uploadedEvidenceUrls[0].name;
          legacyEvidenceUrl = uploadedEvidenceUrls[0].url;
      }
      
      let evidenceLinksArray = selectedSubtask.evidenceLinks || [];
      if (evidenceLink) {
          evidenceLinksArray = [...evidenceLinksArray, evidenceLink];
      }

      let commentFilesStr = "";
      if (evidenceFiles.length > 0) {
          commentFilesStr = `File: ${evidenceFiles.map(f=>f.name).join(', ')} `;
      }
      let commentLinkStr = "";
      if (evidenceLink) {
          commentLinkStr = `Link: ${evidenceLink} `;
      }
        
      const commentText = evidenceText || (commentFilesStr + commentLinkStr).trim() || 'Evidence submitted';
      const newComment = { text: commentText, type: 'evidence', user: currentUser.name, timestamp: getCurrentDateTime() };
      const updatedSubtask = {
        ...selectedSubtask,
        status: 'waiting_review',
        evidence: legacyEvidenceName,
        evidenceUrl: legacyEvidenceUrl,
        evidenceUrls: uploadedEvidenceUrls,
        evidenceLinks: evidenceLinksArray,
        comments: [newComment, ...(selectedSubtask.comments || [])],
        lastUpdated: getCurrentDateTime(),
      };
      await syncSubtaskDoc(task, updatedSubtask);
      const picUser = getUserByName(task.pic);
      await createNotifications(picUser ? [picUser] : [], {
        type: 'subtask_waiting_review',
        priority: 'high',
        title: 'Subtask menunggu review',
        message: `${currentUser.name} mengirim update untuk "${selectedSubtask.title}".`,
        targetType: 'subtask',
        targetId: String(selectedSubtask.id),
        parentTaskId: String(parentId),
      });
      setShowEvidenceModal(false); setShowUserTaskDetailModal(false); setSelectedSubtask(null); 
      setEvidenceFiles([]); setEvidenceLink(""); setEvidenceText("");
    } catch (error) {
      console.error('Error submitting evidence:', error);
      alert('Gagal mengupload file: ' + (error.message || 'Silakan coba lagi.'));
    } finally {
      setEvidenceUploading(false);
    }
  };

  const handleSendRevision = async () => {
    if (!subtaskToRevise) return;
    const task = taskById.get(subtaskToRevise.taskId);
    if (!task) return;
    const targetSubtask = task.subtasks.find((subtask) => String(subtask.id) === String(subtaskToRevise.id));
    if (!targetSubtask) return;
    if (!reviseComment.trim()) {
      alert("Komentar revisi wajib diisi.");
      return;
    }
    const confirmed = await openConfirmationDialog({
      title: "Kirim Revisi",
      message: `Apakah Anda yakin ingin mengirim revisi untuk subtask "${targetSubtask.title}"? Assignee akan menerima notifikasi revisi.`,
      confirmLabel: "Ya, kirim revisi",
      tone: "red",
    });
    if (!confirmed) {
      return;
    }
    const newComment = { text: reviseComment, type: 'revision', user: currentUser.name, timestamp: getCurrentDateTime() };
    await syncSubtaskDoc(task, {
      ...targetSubtask,
      status: 'revision',
      comments: [newComment, ...(targetSubtask.comments || [])],
      lastUpdated: getCurrentDateTime(),
    });
    const assigneeUser = getUserByName(targetSubtask.assignee);
    await createNotifications(assigneeUser ? [assigneeUser] : [], {
      type: 'subtask_revision',
      priority: 'high',
      title: 'Subtask direvisi',
      message: `${task.pic || currentUser.name} merevisi "${targetSubtask.title}".`,
      targetType: 'subtask',
      targetId: String(targetSubtask.id),
      parentTaskId: String(task.id),
    });
    setShowReviseModal(false); setSubtaskToRevise(null);
  };

  const approveSubtask = async (subtaskId, parentTaskId = null) => {
    const targetTaskId = parentTaskId || activeTask?.id;
    if (!targetTaskId) return false;
    const task = taskById.get(targetTaskId);
    if (!task) return false;
    const targetSubtask = task.subtasks.find((subtask) => String(subtask.id) === String(subtaskId));
    if (!targetSubtask) return false;
    const confirmed = await openConfirmationDialog({
      title: "Approve Subtask",
      message: `Apakah Anda yakin ingin meng-approve subtask "${targetSubtask.title}"?`,
      confirmLabel: "Ya, approve",
      tone: "emerald",
    });
    if (!confirmed) {
      return false;
    }
    try {
      const approvalTimestamp = getCurrentDateTime();
      const updatedSubtasks = task.subtasks.map((sub) =>
        String(sub.id) === String(subtaskId)
          ? { ...sub, status: 'completed', lastUpdated: approvalTimestamp }
          : sub
      );
      const updated = recalculateProgress(task, updatedSubtasks);
      const approvedSubtask = updated.subtasks.find((subtask) => String(subtask.id) === String(subtaskId));
      await Promise.all([
        updateDoc(doc(db, 'tasks', targetTaskId), { subtasks: updated.subtasks, progress: updated.progress }),
        approvedSubtask ? syncSubtaskDoc(task, approvedSubtask) : Promise.resolve(),
      ]);
      if (approvedSubtask) {
        setSelectedSubtask((prev) => (
          prev && String(prev.id) === String(approvedSubtask.id)
            ? { ...prev, ...approvedSubtask, parentId: prev.parentId || String(targetTaskId) }
            : prev
        ));
        const assigneeUser = getUserByName(approvedSubtask.assignee);
        await createNotifications(assigneeUser ? [assigneeUser] : [], {
          type: 'subtask_approved',
          priority: 'medium',
          title: 'Subtask di-approve',
          message: `"${approvedSubtask.title}" telah di-approve oleh ${task.pic || currentUser.name}.`,
          targetType: 'subtask',
          targetId: String(approvedSubtask.id),
          parentTaskId: String(targetTaskId),
        });
      }
      return true;
    } catch (error) {
      console.error('Error approving subtask:', error);
      alert('Gagal meng-approve subtask. Silakan coba lagi.');
      return false;
    }
  };


  const deleteSubtask = async (subtaskId) => {
    const task = taskById.get(activeTask.id);
    if (!task) return;
    const deletedSubtask = task.subtasks.find((subtask) => String(subtask.id) === String(subtaskId));
    if (!deletedSubtask) return;
    const confirmed = await openConfirmationDialog({
      title: "Hapus Subtask",
      message: `Apakah Anda yakin ingin menghapus subtask "${deletedSubtask.title}"? Perubahan ini akan mengirimkan notifikasi ke assignee terkait.`,
      confirmLabel: "Ya, hapus",
      tone: "red",
    });
    if (!confirmed) return;
    const updatedSubtasks = task.subtasks.filter(st => st.id !== subtaskId);
    const updated = recalculateProgress(task, updatedSubtasks);
    await Promise.all([
      updateDoc(doc(db, 'tasks', activeTask.id), { subtasks: updated.subtasks, progress: updated.progress }),
      deleteSubtaskDoc(activeTask.id, subtaskId),
    ]);
    if (deletedSubtask) {
      const assigneeUser = getUserByName(deletedSubtask.assignee);
      await createNotifications(assigneeUser ? [assigneeUser] : [], {
        type: 'subtask_deleted',
        priority: 'high',
        title: 'Subtask dihapus',
        message: `Subtask "${deletedSubtask.title}" telah dihapus dari project "${task.title}".`,
        targetType: 'task',
        targetId: String(task.id),
        parentTaskId: String(task.id),
      });
    }
  };

  const saveSubtask = async () => {
    if (!subtaskFormTitle) return;
    const task = taskById.get(activeTask.id);
    if (!task) return;
    const mainTaskDeadline = parseDateValue(task.deadline);
    const subtaskDeadline = parseDateValue(subtaskFormDeadline);
    const resolvedStartDate = subtaskFormStartDate || getDefaultSubtaskStartDate(subtaskFormDeadline);
    const subtaskStartDate = parseDateValue(resolvedStartDate);

    if (subtaskFormDeadline && mainTaskDeadline && subtaskDeadline && subtaskDeadline > mainTaskDeadline) {
      alert("Deadline subtask tidak boleh melewati deadline main task.");
      return;
    }

    if (resolvedStartDate && mainTaskDeadline && subtaskStartDate && subtaskStartDate > mainTaskDeadline) {
      alert("Start date subtask tidak boleh melewati deadline main task.");
      return;
    }

    if (subtaskStartDate && subtaskDeadline && subtaskStartDate > subtaskDeadline) {
      alert("Start date subtask tidak boleh lebih besar dari deadline subtask.");
      return;
    }

    const confirmationMessage = editingSubtaskId
      ? `Apakah Anda yakin ingin menyimpan perubahan subtask "${subtaskFormTitle}"? Perubahan ini akan mengirimkan notifikasi ke assignee terkait.`
      : `Apakah Anda yakin ingin menambahkan subtask "${subtaskFormTitle}"? Assignee terkait akan menerima notifikasi tugas baru.`;
    const confirmed = await openConfirmationDialog({
      title: editingSubtaskId ? "Simpan Perubahan Subtask" : "Tambah Subtask",
      message: confirmationMessage,
      confirmLabel: editingSubtaskId ? "Ya, simpan" : "Ya, tambah",
      tone: "blue",
    });
    if (!confirmed) {
      return;
    }

    let updatedSubtasks;
    let savedSubtask;
    const previousSubtask = editingSubtaskId
      ? task.subtasks.find((subtask) => String(subtask.id) === String(editingSubtaskId))
      : null;
    if (editingSubtaskId) {
      updatedSubtasks = task.subtasks.map(st => st.id === editingSubtaskId ? { ...st, title: subtaskFormTitle, assignee: subtaskFormAssignee, startDate: resolvedStartDate || st.startDate || "", deadline: subtaskFormDeadline || st.deadline, lastUpdated: getCurrentDateTime() } : st);
      savedSubtask = updatedSubtasks.find((subtask) => subtask.id === editingSubtaskId);
    } else {
      savedSubtask = { id: Date.now(), title: subtaskFormTitle, assignee: subtaskFormAssignee || "Unassigned", startDate: resolvedStartDate || "", deadline: subtaskFormDeadline || "TBD", status: "pending", evidence: null, comments: [], lastUpdated: getCurrentDateTime() };
      updatedSubtasks = [...task.subtasks, savedSubtask];
    }
    const updated = recalculateProgress(task, updatedSubtasks);
    await Promise.all([
      updateDoc(doc(db, 'tasks', activeTask.id), { subtasks: updated.subtasks, progress: updated.progress }),
      savedSubtask ? syncSubtaskDoc(task, savedSubtask) : Promise.resolve(),
    ]);
    if (savedSubtask) {
      if (editingSubtaskId) {
        const importantChanged = !previousSubtask
          || previousSubtask.title !== savedSubtask.title
          || previousSubtask.assignee !== savedSubtask.assignee
          || (previousSubtask.startDate || '') !== (savedSubtask.startDate || '')
          || (previousSubtask.deadline || '') !== (savedSubtask.deadline || '');
        if (importantChanged) {
          const recipients = [
            getUserByName(previousSubtask?.assignee),
            getUserByName(savedSubtask.assignee),
          ].filter(Boolean);
          await createNotifications(recipients, {
            type: previousSubtask?.assignee !== savedSubtask.assignee ? 'subtask_reassigned' : 'subtask_updated',
            priority: previousSubtask?.assignee !== savedSubtask.assignee || previousSubtask?.deadline !== savedSubtask.deadline ? 'high' : 'medium',
            title: previousSubtask?.assignee !== savedSubtask.assignee ? 'Subtask diperbarui dan dipindahkan' : 'Subtask diperbarui',
            message: `${task.pic || currentUser.name} memperbarui "${savedSubtask.title}" pada project "${task.title}".`,
            targetType: 'subtask',
            targetId: String(savedSubtask.id),
            parentTaskId: String(task.id),
            meta: {
              oldAssignee: previousSubtask?.assignee || '',
              newAssignee: savedSubtask.assignee,
              oldDeadline: previousSubtask?.deadline || '',
              newDeadline: savedSubtask.deadline || '',
            },
          });
        }
      } else {
        const assigneeUser = getUserByName(savedSubtask.assignee);
        await createNotifications(assigneeUser ? [assigneeUser] : [], {
          type: 'subtask_assigned',
          priority: 'medium',
          title: 'Subtask baru',
          message: `Anda mendapat subtask baru: "${savedSubtask.title}".`,
          targetType: 'subtask',
          targetId: String(savedSubtask.id),
          parentTaskId: String(task.id),
        });
      }
    }
    setShowSubtaskModal(false);
  };

  const addNewTask = async () => {
    const resolvedEventStartDate = newEventStartDate || newTaskDeadline || new Date().toISOString().split('T')[0];
    const resolvedEventEndDate = newEventEndDate || newTaskDeadline || resolvedEventStartDate;
    const resolvedEventLocation = newEventLocation.trim() || "TBD";
    const resolvedEventParticipants = newEventParticipants.length > 0
      ? newEventParticipants
      : (newTaskPic ? [newTaskPic] : (currentUser ? [currentUser.name] : []));

    if (editingMainTaskId) {
      // Handle Edit
      await updateDoc(doc(db, 'tasks', editingMainTaskId), {
        title: newTaskTitle,
        description: newTaskDesc,
        pic: newTaskPic,
        deadline: newTaskDeadline,
        isEvent: newTaskIsEvent
      });

      if (newTaskIsEvent) {
        const existingEvent = events.find(e => e.linkedTaskId === editingMainTaskId) || events.find(e => e.title === newTaskTitle && e.eventType === 'internal');
        if (!existingEvent) {
          await addDoc(collection(db, 'events'), {
            title: newTaskTitle,
            startDate: resolvedEventStartDate,
            endDate: resolvedEventEndDate,
            location: resolvedEventLocation,
            participants: resolvedEventParticipants,
            linkedTaskId: editingMainTaskId,
            eventType: 'internal',
          });
        } else {
          await updateDoc(doc(db, 'events', existingEvent.id), {
            ...existingEvent,
            title: newTaskTitle,
            startDate: resolvedEventStartDate,
            endDate: resolvedEventEndDate,
            location: resolvedEventLocation,
            participants: resolvedEventParticipants,
            linkedTaskId: editingMainTaskId,
            eventType: 'internal',
          });
        }
      } else {
        const existingEvent = events.find((e) => e.linkedTaskId === editingMainTaskId && e.eventType === 'internal');
        if (existingEvent) {
          await deleteDoc(doc(db, 'events', existingEvent.id));
        }
      }
    } else {
      // Handle Add New
      const newId = Date.now();
      const calculateSubtaskDeadline = (mainDeadline, daysBeforeStr) => {
          if (!mainDeadline || daysBeforeStr === "" || daysBeforeStr === null || daysBeforeStr === undefined) return "TBD";
          const daysBefore = parseInt(daysBeforeStr, 10);
          if (isNaN(daysBefore)) return daysBeforeStr; // fallback for backwards compatibility with legacy strings
          
          const d = new Date(mainDeadline);
          d.setDate(d.getDate() - daysBefore);
          return d.toISOString().split('T')[0];
      };

      const selectedTemplate = selectedTemplateId ? taskTemplates.find(t => t.id === selectedTemplateId || t.id === Number(selectedTemplateId)) : null;
      const generatedSubtasks = selectedTemplate
        ? selectedTemplate.subtasks.map((s, i) => ({
          id: newId + i + 1,
          title: s.title,
          assignee: s.assignee || "Unassigned",
          deadline: calculateSubtaskDeadline(newTaskDeadline, s.deadline),
          status: "pending",
          evidence: null,
          comments: [],
          lastUpdated: getCurrentDateTime()
        }))
        : [];
      const newTaskData = {
        title: newTaskTitle,
        description: newTaskDesc,
        pic: newTaskPic || currentUser?.name || "Unknown",
        deadline: newTaskDeadline || "TBD",
        progress: 0,
        subtasks: generatedSubtasks,
        isEvent: newTaskIsEvent
      };

      const docRef = await addDoc(collection(db, 'tasks'), newTaskData);
      if (generatedSubtasks.length > 0) {
        const createdTask = { ...newTaskData, id: docRef.id };
        await Promise.all(generatedSubtasks.map((subtask) => syncSubtaskDoc(createdTask, subtask)));
      }
      setSelectedTaskId(docRef.id);

      if (newTaskIsEvent) {
        await addDoc(collection(db, 'events'), {
          title: newTaskTitle,
          startDate: resolvedEventStartDate,
          endDate: resolvedEventEndDate,
          location: resolvedEventLocation,
          participants: resolvedEventParticipants,
          linkedTaskId: docRef.id,
          eventType: 'internal',
        });
      }
    }

    setShowNewTaskModal(false);
    setEditingMainTaskId(null);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPic("");
    setNewTaskDeadline("");
    setNewTaskIsEvent(false);
    setNewEventStartDate("");
    setNewEventEndDate("");
    setNewEventLocation("");
    setNewEventParticipants([]);
    setSelectedTemplateId("");
  };

  const openNewTaskModal = (options = {}) => {
    const shouldAddToEvent = options.addToEvent === true;
    setEditingMainTaskId(null);
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPic(currentUser?.name || "");
    setNewTaskDeadline("");
    setNewTaskIsEvent(shouldAddToEvent);
    setNewEventStartDate("");
    setNewEventEndDate("");
    setNewEventLocation("");
    setNewEventParticipants(currentUser?.name ? [currentUser.name] : []);
    setSelectedTemplateId("");
    setShowNewTaskModal(true);
  };

  const openInternalEventTaskModal = () => {
    openNewTaskModal({ addToEvent: true });
  };

  const handleEditMainTask = (task) => {
    const existingEvent = events.find((event) => String(event.linkedTaskId) === String(task.id) && event.eventType === 'internal')
      || events.find((event) => event.eventType === 'internal' && event.title === task.title);
    setEditingMainTaskId(task.id);
    setNewTaskTitle(task.title);
    setNewTaskDesc(task.description);
    setNewTaskPic(task.pic);
    setNewTaskDeadline(task.deadline);
    setNewTaskIsEvent(task.isEvent || false);
    setNewEventStartDate(existingEvent?.startDate || "");
    setNewEventEndDate(existingEvent?.endDate || "");
    setNewEventLocation(existingEvent?.location || "");
    setNewEventParticipants(Array.isArray(existingEvent?.participants) ? existingEvent.participants : (task.pic ? [task.pic] : []));
    setShowNewTaskModal(true);
  };

  const handleDeleteMainTask = async (taskId) => {
    if (confirm("Yakin ingin menghapus Main Task ini beserta seluruh subtask-nya?")) {
      const subtaskSnapshots = await getDocs(collection(db, 'tasks', String(taskId), 'subtasks'));
      await Promise.all(subtaskSnapshots.docs.map((subtaskDoc) => deleteDoc(subtaskDoc.ref)));
      await deleteDoc(doc(db, 'tasks', taskId));
      if (selectedTaskId === taskId) {
        const remainingTasks = tasks.filter(t => t.id !== taskId);
        if (remainingTasks.length > 0) {
          setSelectedTaskId(remainingTasks[0].id);
        } else {
          setSelectedTaskId(null);
        }
      }
    }
  };

  const validateAvatarFile = (file) => {
    if (!file) {
      return { ok: true };
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      return { ok: false, message: 'Foto avatar harus berformat JPG atau PNG.' };
    }

    if (file.size > AVATAR_MAX_BYTES) {
      return { ok: false, message: 'Ukuran foto avatar maksimal 2 MB.' };
    }

    return { ok: true };
  };

  const handleAvatarFileSelection = (file, mode) => {
    const validation = validateAvatarFile(file);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }

    if (mode === 'new') {
      setNewUserAvatarFile(file || null);
      return;
    }

    setEditUserAvatarFile(file || null);
  };

  const uploadUserAvatar = async (userId, file) => {
    if (!file) return "";

    const safeExt = file.type === 'image/png' ? 'png' : 'jpg';
    const fileRef = storageRef(storage, `avatars/${userId}/avatar-${Date.now()}.${safeExt}`);
    await uploadBytes(fileRef, file, { contentType: file.type });
    return getDownloadURL(fileRef);
  };

  const handleAddUser = async () => {
    if (!newUserForm.name || !newUserForm.email || !newUserForm.password) return;
    const secondaryApp = initializeApp(app.options, `action-tracker-admin-${Date.now()}`);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      setIsSavingUser(true);
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newUserForm.email, newUserForm.password);
      const uploadedPhotoURL = await uploadUserAvatar(userCredential.user.uid, newUserAvatarFile);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: newUserForm.name,
        email: newUserForm.email,
        role: newUserForm.role,
        department: newUserForm.department,
        photoURL: uploadedPhotoURL,
        status: "Inactive"
      });
      setShowAddUserModal(false);
      setNewUserForm({ name: "", email: "", password: "", role: "Assignee", department: "", photoURL: "" });
      setNewUserAvatarFile(null);
      setShowPassword(false);
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Gagal membuat user: ' + error.message);
    } finally {
      setIsSavingUser(false);
      await deleteApp(secondaryApp);
    }
  };

  const toggleUserStatus = async (e, userId) => {
    e.stopPropagation();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await updateDoc(doc(db, 'users', userId), { status: user.status === 'Active' ? 'Inactive' : 'Active' });
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    if (selectedUser.status === 'Active') { alert("Hanya user Inactive yang dapat dihapus."); return; }
    if (confirm(`Yakin ingin menghapus user ${selectedUser.name}?`)) {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      setShowUserDetailModal(false); setSelectedUser(null);
    }
  };

  const handleUpdateUser = async () => {
    if (!editUserForm.name || !editUserForm.email) return;
    try {
      setIsSavingUser(true);
      const { id, ...updateData } = editUserForm;
      const uploadedPhotoURL = editUserAvatarFile ? await uploadUserAvatar(id, editUserAvatarFile) : (updateData.photoURL || "").trim();
      await updateDoc(doc(db, 'users', id), {
        ...updateData,
        photoURL: uploadedPhotoURL,
      });
      setShowEditUserModal(false);
      setEditUserForm({ id: null, name: "", email: "", role: "", department: "", photoURL: "" });
      setEditUserAvatarFile(null);
    } catch (error) {
      console.error('Error updating user:', error);
      const storageHint = editUserAvatarFile ? ' Jika gagal saat upload avatar, pastikan Storage Rules terbaru sudah di-deploy.' : '';
      alert('Gagal menyimpan perubahan user: ' + error.message + storageHint);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleEvidenceFileSelection = (files) => {
    const incomingFiles = Array.from(files || []);
    const validation = validateEvidenceFiles(incomingFiles);
    if (!validation.ok) {
      alert(validation.message);
      return;
    }
    setEvidenceFiles(validation.files);
  };

  const handleSaveKPI = async () => {
    if (!kpiForm.title) return;
    if (editingKPI) {
      await updateDoc(doc(db, 'kpis', editingKPI.id), kpiForm);
    } else {
      await addDoc(collection(db, 'kpis'), kpiForm);
    }
    setShowKPIModal(false); setKpiForm({ title: "", group: "FINANCE" }); setEditingKPI(null);
  };

  const handleDeleteKPI = async (id) => {
    if (confirm("Hapus KPI ini?")) {
      await deleteDoc(doc(db, 'kpis', id));
    }
  };

  const openKPIModal = (kpi = null) => {
    if (kpi) {
      setEditingKPI(kpi);
      setKpiForm({ title: kpi.title, group: kpi.group });
    } else {
      setEditingKPI(null);
      setKpiForm({ title: "", group: "FINANCE" });
    }
    setShowKPIModal(true);
  };

  const toggleKPIGroup = (group) => {
    if (expandedKPIGroups) {
      setExpandedKPIGroups(prev => ({ ...prev, [group]: !prev[group] }));
    }
  };

  const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1));
  };

  // Nav Helpers
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleUserMenu = () => setIsUserMenuExpanded(!isUserMenuExpanded);
  const navigateTo = (page) => { setActivePage(page); setIsSidebarOpen(false); setShowNotificationsPanel(false); };
  const handleTaskClick = (taskId) => { setSelectedTaskId(taskId); setShowMobileDetail(true); setViewMode('list'); };
  const handleOpenUserTaskDetail = (sub) => { setSelectedSubtask(sub); setEvidenceText(""); setShowUserTaskDetailModal(true); };
  const handleOpenUserDetail = (user) => { setSelectedUser(user); setShowUserDetailModal(true); };
  const openAddSubtaskModal = () => { setSubtaskFormTitle(""); setSubtaskFormAssignee(""); setSubtaskFormDeadline(""); setSubtaskFormStartDate(""); setEditingSubtaskId(null); setShowSubtaskModal(true); };
  const openEditSubtaskModal = (sub) => { setSubtaskFormTitle(sub.title); setSubtaskFormAssignee(sub.assignee); setSubtaskFormDeadline(sub.deadline || ""); setSubtaskFormStartDate(sub.startDate || getDefaultSubtaskStartDate(sub.deadline || "")); setEditingSubtaskId(sub.id); setShowSubtaskModal(true); };
  const openReviseModal = (task, sub) => { setSubtaskToRevise({ taskId: task.id, parentTitle: task.title, parentPic: task.pic, ...sub }); setReviseComment(""); setShowReviseModal(true); };
  const openEvidenceModal = (task, sub) => { setSelectedSubtask({ taskId: task.id, parentTitle: task.title, parentPic: task.pic, ...sub }); setEvidenceText(""); setEvidenceFiles([]); setEvidenceLink(""); setShowEvidenceModal(true); };
  const handleOpenEditUser = (user) => {
    const { password, ...safeUser } = user || {};
    setEditUserForm({ photoURL: "", ...safeUser });
    setEditUserAvatarFile(null);
    setShowUserDetailModal(false);
    setShowEditUserModal(true);
  };

  const openEventModal = (ev = null) => {
    if (ev) {
      setEditingEvent(ev);
      setEventForm({ title: ev.title, startDate: ev.startDate, endDate: ev.endDate, location: ev.location, participants: ev.participants || [], linkedTaskId: ev.linkedTaskId || "", eventType: ev.eventType || (ev.linkedTaskId ? 'internal' : 'external') });
    } else {
      setEditingEvent(null);
      setEventForm({ title: "", startDate: "", endDate: "", location: "", participants: [], linkedTaskId: "", eventType: "external" });
    }
    setShowEventModal(true);
  };

  const handleOpenEventDetail = (ev) => {
    setSelectedEventDetail(ev);
    setShowEventDetailModal(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title || !eventForm.startDate || !eventForm.endDate) return;
    if (editingEvent) {
      await updateDoc(doc(db, 'events', editingEvent.id), eventForm);
    } else {
      await addDoc(collection(db, 'events'), { ...eventForm, eventType: 'external', linkedTaskId: "" });
    }
    setShowEventModal(false); setEventForm({ title: "", startDate: "", endDate: "", location: "", participants: [], linkedTaskId: "", eventType: "external" }); setEditingEvent(null);
  };

  const handleDeleteEvent = async (id) => {
    if (confirm("Hapus event ini?")) {
      const targetEvent = events.find((event) => String(event.id) === String(id));
      await deleteDoc(doc(db, 'events', id));
      if (targetEvent?.linkedTaskId) {
        await updateDoc(doc(db, 'tasks', targetEvent.linkedTaskId), { isEvent: false });
      }
      if (selectedEventDetail?.id === id) {
        setSelectedEventDetail(null);
      }
    }
  };

  // Template CRUD handlers
  const openTemplateModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({ name: template.name, subtasks: template.subtasks.map(s => ({ ...s })) });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ name: "", subtasks: [{ title: "", assignee: "", deadline: "" }] });
    }
    setShowTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name) return;
    const validSubtasks = templateForm.subtasks.filter(s => s.title.trim() !== "");
    if (validSubtasks.length === 0) return;
    if (editingTemplate) {
      await updateDoc(doc(db, 'templates', editingTemplate.id), { name: templateForm.name, subtasks: validSubtasks });
    } else {
      await addDoc(collection(db, 'templates'), { name: templateForm.name, subtasks: validSubtasks });
    }
    setShowTemplateModal(false);
    setEditingTemplate(null);
    setTemplateForm({ name: "", subtasks: [{ title: "", assignee: "", deadline: "" }] });
  };

  const handleDeleteTemplate = async (id) => {
    if (confirm("Hapus template ini?")) {
      await deleteDoc(doc(db, 'templates', id));
    }
  };

  const addTemplateSubtaskRow = () => {
    setTemplateForm(prev => ({ ...prev, subtasks: [...prev.subtasks, { title: "", assignee: "", deadline: "" }] }));
  };

  const removeTemplateSubtaskRow = (index) => {
    setTemplateForm(prev => ({ ...prev, subtasks: prev.subtasks.filter((_, i) => i !== index) }));
  };

  const updateTemplateSubtaskRow = (index, field, value) => {
    setTemplateForm(prev => ({
      ...prev,
      subtasks: prev.subtasks.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const toggleEventParticipant = (userName) => {
    setEventForm(prev => {
      const isSelected = prev.participants.includes(userName);
      const newParticipants = isSelected
        ? prev.participants.filter(name => name !== userName)
        : [...prev.participants, userName];
      return { ...prev, participants: newParticipants };
    });
  };

  const toggleNewTaskEventParticipant = (userName) => {
    setNewEventParticipants((prev) => (
      prev.includes(userName)
        ? prev.filter((name) => name !== userName)
        : [...prev, userName]
    ));
  };

  // Show loading screen while data is being fetched from Firestore
  if (!dataLoaded) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="h-16 object-contain mx-auto mb-4 animate-pulse" />
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-slate-500 text-sm">Memuat data...</p>
      </div>
    </div>
  );

  if (!isLoggedIn) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col h-screen overflow-hidden">

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="w-8 h-8 object-contain" />
            Menu
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 lg:hidden"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          <button onClick={() => navigateTo('jobtask')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'jobtask' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Home className="w-5 h-5" /><span className="font-medium text-sm">Jobtask</span>
          </button>
          <button onClick={() => navigateTo('user-task')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'user-task' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ClipboardList className="w-5 h-5" /><span className="font-medium text-sm">User Task</span>
          </button>
          <button onClick={() => navigateTo('coe')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'coe' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CalendarDays className="w-5 h-5" /><span className="font-medium text-sm">Calendar Of Event</span>
          </button>
          <button onClick={() => navigateTo('file')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'file' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-5 h-5" /><span className="font-medium text-sm">File</span>
          </button>
          <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-5 h-5" /><span className="font-medium text-sm">Dashboard</span>
          </button>
          {userRole === 'PIC' && (
            <button onClick={() => navigateTo('manage-user')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'manage-user' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="w-5 h-5" /><span className="font-medium text-sm">Manage User</span>
            </button>
          )}
          <button onClick={() => navigateTo('kpi')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'kpi' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <BarChart2 className="w-5 h-5" /><span className="font-medium text-sm">KPI</span>
          </button>
          <button onClick={() => navigateTo('template-task')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'template-task' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Copy className="w-5 h-5" /><span className="font-medium text-sm">Template Task</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </nav>
      </div>

      <header className="bg-white shadow-sm border-b border-slate-200 z-10 flex-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Menu className="w-6 h-6" /></button>
            <div className="p-1 hidden md:block"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="w-8 h-8 object-contain" /></div>
            <h1 className="text-lg font-bold text-slate-900">ActionTracker <span className="text-slate-400 font-normal text-sm hidden md:inline">| Task Monitoring</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationsPanel((prev) => !prev)}
                className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-[18px] text-white">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsPanel && (
                <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-400">{unreadNotificationsCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={unreadNotificationsCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-400">
                        Belum ada notifikasi.
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${notification.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{notification.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                            </div>
                            {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="uppercase tracking-[0.08em]">{notification.priority || 'medium'}</span>
                            <span>{getNotificationTimeLabel(notification.createdAt)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {currentUser && <div className="text-right hidden md:block"><p className="text-sm font-bold text-slate-800">{currentUser.name}</p><p className="text-xs text-slate-500 uppercase">{currentUser.role}</p></div>}
            {currentUser && <UserAvatar name={currentUser.name} photoURL={currentUser.photoURL} className="w-8 h-8" />}
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full bg-slate-50">

        {activePage === 'jobtask' && (
          <>
            <aside className={`w-full md:w-1/3 border-r border-slate-200 bg-white flex-col h-full ${showMobileDetail ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-700 flex items-center gap-2"><Layout className="w-4 h-4" /> Main Task</h2>
                {userRole === 'PIC' && <button onClick={openNewTaskModal} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>}
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {tasks.map((task) => {
                  const status = getProjectStatus(task);
                  const latestUpdate = getLatestProjectUpdate(task);
                  return (
                    <div key={task.id} onClick={() => handleTaskClick(task.id)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative ${selectedTaskId === task.id ? `${status.color} ${status.ring} ring-1 shadow-sm` : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.badge}`}>{status.label}</span><span className="text-[10px] text-slate-400 font-medium">{task.deadline}</span></div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Users className="w-3 h-3" /><span className="truncate font-medium">{task.pic}</span></div>
                      <h3 className={`font-bold text-sm mb-1 line-clamp-2 ${status.text}`}>{task.title}</h3>
                      <div className="mt-3">
                        <div className="flex items-center gap-2 w-full"><div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${status.label === 'COMPLETED' ? 'bg-green-500' : status.label === 'REVISE' ? 'bg-red-500' : status.label === 'REVIEW' ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${task.progress}%` }}></div></div><span className="text-xs font-bold text-slate-600">{task.progress}%</span></div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 justify-end"><History className="w-3 h-3" /><span>Update: {latestUpdate}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
            <main className={`flex-1 bg-slate-50 flex-col h-full overflow-hidden ${showMobileDetail ? 'flex' : 'hidden md:flex'}`}>
              {activeTask ? (
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  <div className="md:hidden mb-4"><button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-slate-600 font-medium hover:text-blue-600 transition-colors p-2 -ml-2 rounded-lg active:bg-slate-200"><ArrowLeft className="w-5 h-5" />Kembali ke List</button></div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                          <Briefcase className="w-4 h-4" /><span>Task Detail</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 pr-4">{activeTask.title}</h2>
                          {userRole === 'PIC' && activeTask.pic === currentUser?.name && (
                            <div className="flex items-center gap-2 mb-2 flex-shrink-0">
                              <button onClick={() => openEventModal({ linkedTaskId: activeTask.id, title: activeTask.title })} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Jadwalkan Event Terkait">
                                <CalendarDays className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditMainTask(activeTask)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Main Task">
                                <PenSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMainTask(activeTask.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Main Task">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <p className="text-slate-600 mb-4 text-sm md:text-base">{activeTask.description}</p>
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm">
                          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-start gap-2">
                            <UserAvatar name={activeTask.pic} photoURL={userByName.get(activeTask.pic)?.photoURL} className="w-5 h-5 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">PIC:</span>
                              <span className="font-semibold text-slate-900">{activeTask.pic}</span>
                            </div>
                          </div>
                          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Deadline:</span>
                              <span className="font-semibold text-slate-900">{formatDateIndo(activeTask.deadline)}</span>
                            </div>
                          </div>
                          {(() => {
                            const relatedEvent = eventByLinkedTaskId.get(activeTask.id) || eventByTitle.get(activeTask.title);
                            if (!relatedEvent) return null;
                            return (
                              <div
                                onClick={() => {
                                  if (relatedEvent && relatedEvent.startDate) {
                                    const eventDate = parseDateValue(relatedEvent.startDate);
                                    if (eventDate) {
                                      setCurrentCalendarDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), 1));
                                    }
                                  } else if (activeTask.deadline && activeTask.deadline !== "TBD") {
                                    const fallbackDate = parseDateValue(activeTask.deadline);
                                    if (fallbackDate) {
                                      setCurrentCalendarDate(new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), 1));
                                    }
                                  }
                                  setCoeViewMode('calendar');
                                  navigateTo('coe');
                                }}
                                className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg flex gap-2 text-blue-800 items-start cursor-pointer hover:bg-blue-100 transition-all"
                                title="Lihat di Calendar Of Event"
                              >
                                <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">Event:</span>
                                  <span className="font-semibold text-sm">{activeTask.title}</span>
                                  <span className="text-xs text-blue-600 font-medium">{(() => {
                                    let dateDisplay = formatDateIndo(activeTask.deadline);
                                    const formatDmy = (dateStr) => {
                                      if (!dateStr) return "";
                                      const [y, m, d] = dateStr.split('-');
                                      return `${d}/${m}/${y}`;
                                    };
                                    if (relatedEvent) {
                                      dateDisplay = `${formatDmy(relatedEvent.startDate)}${relatedEvent.endDate && relatedEvent.endDate !== relatedEvent.startDate ? ` - ${formatDmy(relatedEvent.endDate)}` : ''}`;
                                    }
                                    return dateDisplay;
                                  })()}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" /><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * activeTask.progress) / 100} strokeLinecap="round" className={`transition-all duration-700 ease-out ${activeTask.progress === 100 ? 'text-green-500' : 'text-blue-600'}`} /></svg><span className="absolute text-base md:text-lg font-bold text-slate-700">{activeTask.progress}%</span></div><span className="text-xs text-slate-400 mt-1">Progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded flex items-center justify-center text-xs">{activeTask.subtasks.length}</span>Subtasks</h3>{userRole === 'PIC' && <button onClick={openAddSubtaskModal} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition-colors"><Plus className="w-3 h-3" /> Tambah</button>}</div>
                    <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg self-start md:self-auto"><button onClick={() => setViewMode('list')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-3.5 h-3.5" /> List</button><button onClick={() => setViewMode('gantt')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'gantt' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BarChart2 className="w-3.5 h-3.5" /> Gantt</button></div>
                  </div>
                  {viewMode === 'list' ? (
                    <div className="space-y-3 pb-8">
                      {activeTask.subtasks.length === 0 ? <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400"><p className="text-sm">Belum ada subtask.</p></div> : (
                        [...activeTask.subtasks].sort((a, b) => {
                          const statusOrder = { 'revision': 1, 'waiting_review': 2, 'pending': 3, 'completed': 4 };
                          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                        }).map((subtask) => {
                          const isExpanded = expandedSubtasks[subtask.id];
                          return (
                            <div key={subtask.id} className={`bg-white rounded-xl border transition-all hover:shadow-sm group ${subtask.status === 'completed' ? 'border-green-200 bg-green-50/30' : subtask.status === 'revision' ? 'border-red-200 bg-red-50/30' : subtask.status === 'waiting_review' ? 'border-yellow-200 bg-yellow-50/30' : 'border-slate-200'}`}>
                              {/* Header - Clickable to Expand/Collapse */}
                              <div
                                onClick={() => toggleSubtask(subtask.id)}
                                className="p-4 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {subtask.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {subtask.status === 'waiting_review' && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
                                    {subtask.status === 'revision' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                    {subtask.status === 'pending' && <Circle className="w-5 h-5 text-slate-300" />}
                                  </div>
                                  <h4 className={`font-semibold text-base break-words flex-1 ${subtask.status === 'completed' ? 'text-slate-500' : 'text-slate-800'}`}>
                                    {subtask.title}
                                  </h4>
                                </div>
                                <div className="ml-2 text-slate-400">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                              </div>

                              {/* Body - Collapsible Details */}
                              {isExpanded && (
                                <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-slate-100/50 pt-3 md:pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 w-full min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded">
                                          <UserAvatar name={subtask.assignee} photoURL={userByName.get(subtask.assignee)?.photoURL} className="w-4 h-4" />
                                          <span className="text-xs text-slate-600">{subtask.assignee}</span>
                                        </div>
                                        {subtask.deadline && (
                                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {subtask.deadline}
                                          </span>
                                        )}
                                      </div>

                                        {(subtask.evidence || (subtask.evidenceUrls && subtask.evidenceUrls.length > 0) || (subtask.evidenceLinks && subtask.evidenceLinks.length > 0)) && (
                                          <div className={`mt-3 border rounded-lg p-3 flex gap-3 shadow-sm text-sm ${subtask.status === 'revision' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                            <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${subtask.status === 'revision' ? 'text-red-500' : 'text-slate-500'}`} />
                                            <div className="min-w-0 flex-1">
                                              <p className="font-semibold text-slate-700 mb-1">Bukti / Lampiran:</p>
                                              
                                              {/* Legacy File */}
                                              {subtask.evidence && (!subtask.evidenceUrls || subtask.evidenceUrls.length === 0) && (
                                                <a href={subtask.evidenceUrl || '#'} target={subtask.evidenceUrl ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block mb-1">{subtask.evidence}</a>
                                              )}
                                              
                                              {/* Multiple Files */}
                                              {subtask.evidenceUrls && subtask.evidenceUrls.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                   {subtask.evidenceUrls.map((file, idx) => (
                                                      <span key={idx} className="flex"><a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full">{idx+1}. {file.name}</a></span>
                                                   ))}
                                                </div>
                                              )}

                                              {/* External Links */}
                                              {subtask.evidenceLinks && subtask.evidenceLinks.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                   {subtask.evidenceLinks.map((link, idx) => (
                                                      <span key={idx} className="flex items-start gap-1"><ExternalLink className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" /><a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full">{link}</a></span>
                                                   ))}
                                                </div>
                                              )}
                                            {subtask.comments && subtask.comments.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-2">
                                                {subtask.comments.map((comment, idx) => (
                                                  <div key={idx} className="flex items-start gap-2">
                                                    <UserAvatar name={comment.user} photoURL={userByName.get(comment.user)?.photoURL} className="w-5 h-5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                      <div className="flex justify-between items-baseline">
                                                        <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                                      </div>
                                                      <p className={`text-xs ${comment.type === 'revision' ? 'text-red-600' : 'text-slate-600'}`}>{comment.text}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}


                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto md:min-w-[140px] mt-2 md:mt-0">
                                      {(subtask.status === 'pending' || subtask.status === 'revision') && (userRole === 'Assignee' || userRole === 'PIC') && subtask.assignee === currentUser.name && (
                                        <button onClick={() => openEvidenceModal(activeTask, subtask)} className={`flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-full ${subtask.status === 'revision' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                          <Upload className="w-4 h-4" /> {subtask.status === 'revision' ? 'Perbaiki' : 'Lapor'}
                                        </button>
                                      )}
                                      {subtask.status === 'waiting_review' && userRole === 'PIC' && (
                                        <div className="flex gap-2 w-full">
                                          {activeTask.pic === currentUser.name && (
                                            <button onClick={() => approveSubtask(subtask.id)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm">
                                              <Check className="w-3 h-3" /> OK
                                            </button>
                                          )}
                                          <button onClick={() => openReviseModal(activeTask, subtask)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm">
                                            <AlertCircle className="w-3 h-3" /> Revise
                                          </button>
                                        </div>
                                      )}
                                      {subtask.status === 'waiting_review' && userRole === 'Assignee' && <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200 text-center w-full">Reviewing</div>}
                                      {subtask.status === 'waiting_review' && userRole === 'PIC' && <div className="text-xs text-slate-400 text-center w-full mb-1">Butuh Approval</div>}
                                      {subtask.status === 'revision' && userRole === 'PIC' && <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 text-center w-full">Revisi Assignee</div>}
                                      {subtask.status === 'completed' && <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 text-center w-full">Verified</div>}

                                      {userRole === 'PIC' && activeTask.pic === currentUser.name && (
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full justify-end">
                                          <button onClick={(e) => { e.stopPropagation(); openEditSubtaskModal(subtask); }} className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded">
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); deleteSubtask(subtask.id); }} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 overflow-hidden relative">
                      {ganttData ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setShowGanttFilters((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                Filter
                                {showGanttFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {showGanttFilters && (
                              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {[
                                    { id: '2w', label: '2 Minggu' },
                                    { id: '1m', label: '1 Bulan' },
                                    { id: '3m', label: '3 Bulan' },
                                    { id: 'fit', label: 'Fit' },
                                  ].map((preset) => (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => applyGanttPreset(preset.id)}
                                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${ganttRangePreset === preset.id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                  <select
                                    value={ganttZoomLevel}
                                    onChange={(e) => setGanttZoomLevel(e.target.value)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-300"
                                  >
                                    <option value="day">Hari</option>
                                    <option value="week">Minggu</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const nextStart = ganttZoomLevel === 'week' ? addDays(today, -14) : addDays(today, -7);
                                      const nextEnd = ganttZoomLevel === 'week' ? addDays(today, 35) : addDays(today, 7);
                                      setGanttRangePreset('custom');
                                      setGanttRangeStart(toDateInputValue(nextStart));
                                      setGanttRangeEnd(toDateInputValue(nextEnd));
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                                  >
                                    Today
                                  </button>
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                      checked={ganttShowCompleted}
                                      onChange={(e) => setGanttShowCompleted(e.target.checked)}
                                    />
                                    Show Completed
                                  </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <span>From</span>
                                    <input
                                      type="date"
                                      value={ganttRangeStart}
                                      onChange={(e) => {
                                        setGanttRangePreset('custom');
                                        setGanttRangeStart(e.target.value);
                                      }}
                                      className="bg-transparent text-slate-600 outline-none"
                                    />
                                  </label>
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <span>To</span>
                                    <input
                                      type="date"
                                      value={ganttRangeEnd}
                                      onChange={(e) => {
                                        setGanttRangePreset('custom');
                                        setGanttRangeEnd(e.target.value);
                                      }}
                                      className="bg-transparent text-slate-600 outline-none"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            <span>{ganttData.subtasks.length} subtask terlihat</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'completed').length} completed</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'waiting_review').length} review</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'revision').length} revise</span>
                          </div>

                          <div className="overflow-x-auto relative">
                            <div className="min-w-[920px] relative">
                              <div className="sticky top-0 z-20 bg-white">
                                <div className="flex border-b border-slate-200">
                                  <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    Subtask
                                  </div>
                                  <div className="flex-1">
                                    <div className="grid" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment, index) => {
                                        const monthLabel = segment.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                                        const prevMonthLabel = index > 0 ? ganttData.segments[index - 1].toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : null;
                                        return (
                                          <div key={`month-${segment.toISOString()}`} className={`border-l border-slate-100 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${monthLabel !== prevMonthLabel ? 'bg-slate-50/70' : 'bg-white'}`}>
                                            {monthLabel !== prevMonthLabel ? monthLabel : ''}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="grid border-t border-slate-100" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment) => {
                                        const isWeekend = ganttData.zoomLevel === 'day' && [0, 6].includes(segment.getDay());
                                        return (
                                          <div key={segment.toISOString()} className={`border-l border-slate-100 px-2 py-2 text-center text-[10px] font-medium text-slate-500 ${isWeekend ? 'bg-red-50/40' : 'bg-white'}`}>
                                            {formatTimelineLabel(segment, ganttData.zoomLevel)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                {(ganttData.todayPlacement || ganttData.mainTaskDeadlinePlacement) && (
                                  <div className="pointer-events-none absolute bottom-0 top-0 left-56 right-0 z-10">
                                    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment, index) => (
                                        <div key={`marker-${segment.toISOString()}`} className="relative h-full">
                                          {ganttData.todayPlacement && ganttData.todayPlacement.segmentIndex === index && (
                                            <div
                                              className="absolute bottom-0 top-0 w-0.5 bg-blue-500/90"
                                              style={{ left: `calc(${ganttData.todayPlacement.offsetPercent}% - 1px)` }}
                                            />
                                          )}
                                          {ganttData.mainTaskDeadlinePlacement && ganttData.mainTaskDeadlinePlacement.segmentIndex === index && (
                                            <div
                                              className="absolute bottom-0 top-0 w-0.5 bg-red-500/90"
                                              style={{ left: `calc(${ganttData.mainTaskDeadlinePlacement.offsetPercent}% - 1px)` }}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="divide-y divide-slate-100 border-b border-slate-200">
                                  {ganttData.subtasks.map((sub) => {
                                    const subStartDate = parseDateValue(sub.startDate) || addDays(sub.deadlineDate, -3);
                                    const clampedStartDate = subStartDate < ganttData.start ? ganttData.start : subStartDate;
                                    const clampedEndDate = sub.deadlineDate > ganttData.end ? ganttData.end : sub.deadlineDate;
                                    const startPercent = getTimelinePercent(clampedStartDate, ganttData.start, ganttData.segments, ganttData.zoomLevel, 'start');
                                    const endPercent = getTimelinePercent(clampedEndDate, ganttData.start, ganttData.segments, ganttData.zoomLevel, 'end');
                                    const widthPercent = Math.max(endPercent - startPercent, ganttData.zoomLevel === 'week' ? 7 : 3.2);
                                    let barColor = 'bg-blue-500';
                                    if (sub.status === 'completed') barColor = 'bg-green-500';
                                    if (sub.status === 'revision') barColor = 'bg-red-500';
                                    if (sub.status === 'waiting_review') barColor = 'bg-amber-500';

                                    return (
                                      <div key={sub.id} className="flex min-h-[54px] bg-white transition-colors hover:bg-slate-50/70">
                                        <div className="w-56 flex-shrink-0 border-r border-slate-200 px-4 py-3">
                                          <p
                                            className="truncate text-sm font-medium text-slate-700"
                                            title={sub.title}
                                            onMouseEnter={(event) => handleGanttTooltipMove(event, sub)}
                                            onMouseMove={(event) => handleGanttTooltipMove(event, sub)}
                                            onMouseLeave={() => setGanttTooltip(null)}
                                          >
                                            {sub.title}
                                          </p>
                                        </div>
                                        <div className="relative flex-1">
                                          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                            {ganttData.segments.map((segment) => {
                                              const isWeekend = ganttData.zoomLevel === 'day' && [0, 6].includes(segment.getDay());
                                              return <div key={`grid-${sub.id}-${segment.toISOString()}`} className={`border-l border-slate-100 ${isWeekend ? 'bg-red-50/30' : 'bg-transparent'}`} />;
                                            })}
                                          </div>
                                          <div className="absolute inset-y-0 left-0 right-0">
                                            <button
                                              type="button"
                                              className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-full ${barColor} shadow-sm transition hover:opacity-90`}
                                              style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                              onClick={() => handleOpenUserTaskDetail({ ...sub, parentId: activeTask.id, parentTitle: activeTask.title })}
                                              onMouseEnter={(event) => handleGanttTooltipMove(event, sub)}
                                              onMouseMove={(event) => handleGanttTooltipMove(event, sub)}
                                              onMouseLeave={() => setGanttTooltip(null)}
                                              aria-label={sub.title}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-end gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Completed</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Review</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Revise</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Ready</span>
                                <span className="flex items-center gap-2"><span className="h-4 w-px bg-blue-400" /> Today</span>
                                <span className="flex items-center gap-2"><span className="h-4 w-px bg-red-400" /> Main deadline</span>
                              </div>
                            </div>
                          </div>

                          {ganttTooltip && (
                            <div
                              className="pointer-events-none fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                              style={{
                                left: `${Math.min(ganttTooltip.x, window.innerWidth - 280)}px`,
                                top: `${Math.min(ganttTooltip.y, window.innerHeight - 140)}px`,
                              }}
                            >
                              <p className="text-sm font-semibold text-slate-900">{ganttTooltip.subtask.title}</p>
                              <div className="mt-2 space-y-1.5 text-xs text-slate-500">
                                <p><span className="font-semibold text-slate-700">Assignee:</span> {ganttTooltip.subtask.assignee}</p>
                                <p><span className="font-semibold text-slate-700">Status:</span> {getGanttStatusLabel(ganttTooltip.subtask.status)}</p>
                                <p><span className="font-semibold text-slate-700">Deadline:</span> {formatDateIndo(ganttTooltip.subtask.deadline)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm"><BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" />Tidak ada data deadline untuk ditampilkan di Gantt Chart.</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8"><Briefcase className="w-16 h-16 mb-4 opacity-20" /><p className="text-lg font-medium">Pilih project untuk melihat detail</p></div>
              )}
            </main>
          </>
        )}

        {activePage === 'user-task' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <UserTaskPage
              userTaskSearch={userTaskSearch}
              setUserTaskSearch={setUserTaskSearch}
              filteredUserTasks={filteredUserTasks}
              handleOpenUserTaskDetail={handleOpenUserTaskDetail}
              formatDateIndo={formatDateIndo}
              users={users}
              UserAvatar={UserAvatar}
            />
          </Suspense>
        )}

        {activePage === 'file' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <FilePage fileSearch={fileSearch} setFileSearch={setFileSearch} tasks={tasks} getFileMeta={getFileMeta} />
          </Suspense>
        )}

        {activePage === 'dashboard' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <DashboardPage dashboardStats={dashboardStats} tasks={tasks} DonutChart={DonutChart} UserAvatar={UserAvatar} />
          </Suspense>
        )}

        {activePage === 'manage-user' && userRole === 'PIC' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <ManageUserPage users={users} UserAvatar={UserAvatar} handleOpenUserDetail={handleOpenUserDetail} toggleUserStatus={toggleUserStatus} setShowAddUserModal={setShowAddUserModal} />
          </Suspense>
        )}

        {false && activePage === 'manage-user' && userRole === 'PIC' && (
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><div className="bg-blue-600 p-2 rounded-lg text-white"><Users className="w-6 h-6" /></div>Manage User</h2>
                <button onClick={() => setShowAddUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><UserPlus className="w-4 h-4" /> Add User</button>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <div key={user.id} onClick={() => handleOpenUserDetail(user)} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-4">
                        <UserAvatar name={user.name} size={64} className="w-12 h-12 md:w-14 md:h-14" />
                        <div><h4 className="font-semibold text-slate-800 text-base md:text-lg">{user.name}</h4><div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mt-1"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'PIC' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span><span className="hidden md:inline">• {user.department}</span></div></div>
                      </div>
                      <div className="flex items-center"><button onClick={(e) => toggleUserStatus(e, user.id)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${user.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}><Power className="w-3 h-3" />{user.status}</button></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* KPI MASTER PAGE */}
        {activePage === 'kpi' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <KpiPage KPI_GROUPS={KPI_GROUPS} kpisByGroup={kpisByGroup} expandedKPIGroups={expandedKPIGroups} toggleKPIGroup={toggleKPIGroup} openKPIModal={openKPIModal} handleDeleteKPI={handleDeleteKPI} />
          </Suspense>
        )}

        {false && activePage === 'kpi' && (
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="bg-blue-600 p-2 rounded-lg text-white"><BarChart2 className="w-6 h-6" /></div>
                  Master KPI
                </h2>
                <button onClick={() => openKPIModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Add KPI
                </button>
              </div>

              <div className="space-y-6">
                  {KPI_GROUPS.map(group => {
                  const groupKpis = kpisByGroup.get(group) || [];
                  const isExpanded = expandedKPIGroups ? expandedKPIGroups[group] : true;
                  return (
                    <div key={group} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                      <div
                        className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50"
                        onClick={() => toggleKPIGroup(group)}
                      >
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </span>
                          <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                          {group}
                        </h3>
                        <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{groupKpis.length} Indicators</span>
                      </div>

                      {isExpanded && (
                        <div className="divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                          {groupKpis.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-sm">Belum ada KPI di grup ini.</div>
                          ) : (
                            groupKpis.map(kpi => (
                              <div key={kpi.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <span className="font-medium text-slate-700 text-sm">{kpi.title}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={(e) => { e.stopPropagation(); openKPIModal(kpi); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                                  <button onClick={(e) => { e.stopPropagation(); handleDeleteKPI(kpi.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        )}

        {/* COE PAGE */}
        {activePage === 'coe' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <CoePage
              coeViewMode={coeViewMode}
              setCoeViewMode={setCoeViewMode}
              userRole={userRole}
              openEventModal={openEventModal}
              openInternalEventTaskModal={openInternalEventTaskModal}
              events={events}
              eventsSorted={eventsSorted}
              tasks={tasks}
              formatDateIndo={formatDateIndo}
              UserAvatar={UserAvatar}
              currentCalendarDate={currentCalendarDate}
              monthNames={monthNames}
              handlePrevMonth={handlePrevMonth}
              handleNextMonth={handleNextMonth}
              getFirstDayOfMonth={getFirstDayOfMonth}
              getDaysInMonth={getDaysInMonth}
              calendarEventsByDate={calendarEventsByDate}
              holidaysByDate={holidaysByDate}
              handleOpenEventDetail={handleOpenEventDetail}
              handleDeleteEvent={handleDeleteEvent}
              setSelectedTaskId={setSelectedTaskId}
              navigateTo={navigateTo}
            />
          </Suspense>
        )}

        {false && activePage === 'coe' && (
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="bg-blue-600 p-2 rounded-lg text-white"><CalendarDays className="w-6 h-6" /></div>
                  Calendar of Events
                </h2>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto">
                    <button onClick={() => setCoeViewMode('calendar')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${coeViewMode === 'calendar' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Calendar className="w-4 h-4" /> Calendar</button>
                    <button onClick={() => setCoeViewMode('list')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${coeViewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-4 h-4" /> List</button>
                  </div>
                  <button onClick={() => openEventModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                    <Plus className="w-4 h-4" /> Add Event
                  </button>
                </div>
              </div>

              {coeViewMode === 'list' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(!events || !Array.isArray(events) || events.length === 0) ? (
                    <div className="col-span-1 md:col-span-2 p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">Belum ada event yang dijadwalkan.</div>
                  ) : (
                    eventsSorted.map(ev => (
                      <div key={ev.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-shadow">
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEventModal(ev)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteEvent(ev.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-3 pr-16">{ev.title}</h3>
                        <div className="space-y-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-slate-400" /> <span className="font-semibold">{formatDateIndo(ev.startDate)}</span> {ev.endDate && ev.endDate !== ev.startDate && <span> - {formatDateIndo(ev.endDate)}</span>}</div>
                          <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> <span>{ev.location || "TBD"}</span></div>
                          <div className="flex items-start gap-2 pt-2"><Users className="w-4 h-4 text-slate-400 mt-0.5" />
                            <div className="flex flex-wrap gap-1">
                              {ev.participants && Array.isArray(ev.participants) && ev.participants.length > 0 ? ev.participants.map(p => (
                                <span key={p} className="bg-slate-100 px-2 py-0.5 rounded text-xs border border-slate-200 flex items-center gap-1.5"><UserAvatar name={p} photoURL={userByName.get(p)?.photoURL} className="w-3 h-3" />{p}</span>
                              )) : <span className="text-xs italic text-slate-400">Belum ada peserta</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="bg-white p-4 md:p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-800">{monthNames[currentCalendarDate.getMonth()]} {currentCalendarDate.getFullYear()}</h3>
                    <div className="flex gap-2">
                      <button onClick={handlePrevMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                      <button onClick={handleNextMonth} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center font-bold text-xs text-slate-400 uppercase py-2">{day}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {Array.from({ length: getFirstDayOfMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="h-24 md:h-32 rounded-lg bg-slate-50/50 border border-slate-100/50"></div>
                    ))}
                    {Array.from({ length: getDaysInMonth(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth()) }).map((_, idx) => {
                      const day = idx + 1;
                      const dateString = `${currentCalendarDate.getFullYear()}-${String(currentCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

                      const dayEvents = calendarEventsByDate.get(dateString) || [];

                      const isToday = process.env.NODE_ENV !== 'development' && dateString === new Date().toISOString().split('T')[0]; // Simple check
                      // Actually let's use a real today check
                      const todayDate = new Date();
                      const isReallyToday = day === todayDate.getDate() && currentCalendarDate.getMonth() === todayDate.getMonth() && currentCalendarDate.getFullYear() === todayDate.getFullYear();

                      const holidayInfo = holidaysByDate.get(dateString);

                      return (
                        <div key={day} className={`h-24 md:h-32 rounded-lg border p-1 md:p-2 flex flex-col transition-colors ${isReallyToday ? 'bg-blue-50/30 border-blue-200 ring-1 ring-blue-500' : (holidayInfo ? 'bg-red-50/40 border-red-200' : 'bg-white border-slate-200 hover:bg-slate-50')}`}>
                          <div className="flex flex-col items-center mb-1 w-full relative">
                            <div className={`text-xs font-bold w-6 h-6 flex flex-shrink-0 items-center justify-center rounded-full ${isReallyToday ? 'bg-blue-600 text-white' : (holidayInfo ? 'text-red-500' : 'text-slate-500')}`}>{day}</div>
                            {holidayInfo && <span className="text-[9px] md:text-[10px] text-red-500 font-semibold leading-tight text-center w-full truncate" title={holidayInfo.name}>{holidayInfo.name}</span>}
                          </div>
                          <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {dayEvents.map(ev => (
                              <div key={ev.id} onClick={() => handleOpenEventDetail(ev)} className="bg-blue-100 text-blue-700 text-[10px] md:text-xs px-1.5 py-1 rounded truncate cursor-pointer hover:bg-blue-200 transition-colors font-medium border border-blue-200" title={ev.title}>
                                {ev.title}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </main>
        )}

        {/* TEMPLATE TASK PAGE */}
        {activePage === 'template-task' && (
          <Suspense fallback={<main className="flex-1 overflow-y-auto p-4 md:p-8 text-sm text-slate-400">Memuat halaman...</main>}>
            <TemplateTaskPage taskTemplates={taskTemplates} openTemplateModal={openTemplateModal} handleDeleteTemplate={handleDeleteTemplate} />
          </Suspense>
        )}

        {false && activePage === 'template-task' && (
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="bg-blue-600 p-2 rounded-lg text-white"><Copy className="w-6 h-6" /></div>
                  Template Task
                </h2>
                <button onClick={() => openTemplateModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" /> Add Template
                </button>
              </div>

              {taskTemplates.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                  <Copy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Belum ada template. Klik "Add Template" untuk memulai.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskTemplates.map(template => (
                    <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg"><Copy className="w-5 h-5 text-blue-600" /></div>
                            <h3 className="font-bold text-slate-800 text-base">{template.name}</h3>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openTemplateModal(template)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteTemplate(template.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{template.subtasks.length} Subtask{template.subtasks.length !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="space-y-1.5">
                          {template.subtasks.slice(0, 4).map((sub, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                              <Circle className="w-3 h-3 text-slate-300 flex-shrink-0" />
                              <span className="truncate">{sub.title}</span>
                            </div>
                          ))}
                          {template.subtasks.length > 4 && (
                            <div className="text-xs text-slate-400 pl-5">+{template.subtasks.length - 4} lainnya...</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

      </div>

      {
        showUserTaskDetailModal && selectedSubtask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{selectedSubtask.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <button onClick={() => { setSelectedTaskId(selectedSubtask.parentId); setActivePage('jobtask'); setShowMobileDetail(true); setShowUserTaskDetailModal(false); }} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium"><Briefcase className="w-3 h-3" /> Parent Project: {selectedSubtask.parentTitle}</button>
                  </div>
                </div>
                <button onClick={() => setShowUserTaskDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Deadline</p><p className="text-sm font-medium text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {selectedSubtask.deadline || "-"}</p></div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Status</p><div className="text-sm font-medium">{selectedSubtask.status === 'completed' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Completed</span>}{selectedSubtask.status === 'waiting_review' && <span className="text-yellow-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Waiting Review</span>}{selectedSubtask.status === 'revision' && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Revision Needed</span>}{selectedSubtask.status === 'pending' && <span className="text-slate-600 flex items-center gap-1"><Circle className="w-4 h-4" /> Pending</span>}</div></div>
                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Assignee</p><p className="text-sm font-medium text-slate-800 flex items-center gap-2"><UserAvatar name={selectedSubtask.assignee} photoURL={userByName.get(selectedSubtask.assignee)?.photoURL} className="w-5 h-5" />{selectedSubtask.assignee}</p></div>
                </div>
                {(selectedSubtask.evidence || (selectedSubtask.evidenceUrls && selectedSubtask.evidenceUrls.length > 0) || (selectedSubtask.evidenceLinks && selectedSubtask.evidenceLinks.length > 0)) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Riwayat Bukti & Catatan</h4>
                    <div className={`border rounded-lg p-3 text-sm ${selectedSubtask.status === 'revision' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-start gap-3">
                        <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedSubtask.status === 'revision' ? 'text-red-500' : 'text-slate-500'}`} />
                        <div className="w-full relative pr-2">
                          <p className="font-semibold text-slate-800 mb-2">Bukti Terlampir:</p>
                          
                          {/* Legacy File */}
                          {selectedSubtask.evidence && (!selectedSubtask.evidenceUrls || selectedSubtask.evidenceUrls.length === 0) && (
                            <div className="bg-white border border-slate-200 rounded p-2 mb-2 shadow-sm">
                              <a href={selectedSubtask.evidenceUrl || '#'} target={selectedSubtask.evidenceUrl ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full font-medium" title={selectedSubtask.evidence}>{selectedSubtask.evidence}</a>
                            </div>
                          )}

                          {/* Multiple Files */}
                          {selectedSubtask.evidenceUrls && selectedSubtask.evidenceUrls.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                               {selectedSubtask.evidenceUrls.map((file, idx) => (
                                  <div key={idx} className="bg-white border border-slate-200 rounded p-2 shadow-sm flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full text-sm font-medium" title={file.name}>{file.name}</a>
                                  </div>
                               ))}
                            </div>
                          )}

                          {/* External Links */}
                          {selectedSubtask.evidenceLinks && selectedSubtask.evidenceLinks.length > 0 && (
                            <div className="space-y-1.5 mb-3">
                               {selectedSubtask.evidenceLinks.map((link, idx) => (
                                  <div key={idx} className="bg-blue-50 border border-blue-100 rounded p-2 shadow-sm flex items-center gap-2">
                                     <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                     <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline truncate block w-full text-sm font-medium" title={link}>{link}</a>
                                  </div>
                               ))}
                            </div>
                          )}
                          {selectedSubtask.comments && selectedSubtask.comments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-3">
                              {selectedSubtask.comments.map((comment, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <UserAvatar name={comment.user} photoURL={userByName.get(comment.user)?.photoURL} className="w-6 h-6 flex-shrink-0" />
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex-1 shadow-sm">
                                    <div className="flex justify-between items-baseline mb-1">
                                      <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                      <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                    </div>
                                    <p className={`text-xs ${comment.type === 'revision' ? 'text-red-600' : 'text-slate-600'}`}>{comment.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(userRole === 'Assignee' || userRole === 'PIC') && (selectedSubtask.status === 'pending' || selectedSubtask.status === 'revision') && selectedSubtask.assignee === currentUser.name && (
                  <div className="border-t border-slate-100 pt-5 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-600" /> Upload Pekerjaan & Komentar</h4>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-blue-50 hover:border-blue-400 transition-all group relative">
                        <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { if (e.target.files) handleEvidenceFileSelection(e.target.files); }} />
                        <div className="bg-blue-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5 text-blue-500" /></div>
                        <span className="text-xs font-medium text-slate-600 mb-1">Klik atau Drop file di sini</span>
                        <span className="text-[10px] text-slate-400">Bisa pilih lebih dari 1 file</span>
                      </div>
                      
                      {/* Tampilkan Daftar File Terpilih */}
                      {evidenceFiles.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg space-y-2">
                             <p className="text-xs font-bold text-blue-800">File Terpilih ({evidenceFiles.length}):</p>
                             {evidenceFiles.map((f, i) => (
                                <div key={i} className="flex justify-between items-center text-sm bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                    <span className="text-slate-700 truncate w-3/4" title={f.name}>{f.name}</span>
                                    <button onClick={() => setEvidenceFiles(evidenceFiles.filter((_, idx)=>idx!==i))} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><X className="w-3 h-3" /></button>
                                </div>
                             ))}
                          </div>
                      )}

                      <div><label className="block text-xs font-medium text-slate-700 mb-1">Tautan Bukti (URL)</label>
                           <input type="url" className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" placeholder="https://..." value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
                      </div>
                      
                      <div><label className="block text-xs font-medium text-slate-700 mb-1">Catatan / Komentar (Opsional)</label><textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" rows="3" placeholder="Tuliskan detail pengerjaan..." value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)}></textarea></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
                <button onClick={() => setShowUserTaskDetailModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg hover:bg-white transition-colors">Tutup</button>
                {(userRole === 'Assignee' || userRole === 'PIC') && (selectedSubtask.status === 'pending' || selectedSubtask.status === 'revision') && selectedSubtask.assignee === currentUser.name && <button onClick={submitEvidence} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"><Save className="w-4 h-4" /> Simpan & Kirim</button>}
                {userRole === 'PIC' && selectedSubtask.status === 'waiting_review' && (
                  <>
                    <button onClick={() => { openReviseModal({ id: selectedSubtask.parentId, title: selectedSubtask.parentTitle, pic: selectedSubtask.parentPic }, selectedSubtask); setShowUserTaskDetailModal(false); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"><AlertCircle className="w-4 h-4" /> Revise</button>
                    {selectedSubtask.parentPic === currentUser.name && (
                      <button
                        onClick={async () => {
                          const approved = await approveSubtask(selectedSubtask.id, selectedSubtask.parentId);
                          if (approved) {
                            setShowUserTaskDetailModal(false);
                          }
                        }}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )
      }

      {
        showEvidenceModal && selectedSubtask && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between sticky top-0 z-10"><h3 className="font-bold text-slate-800">{selectedSubtask.status === 'revision' ? 'Perbaiki Laporan' : 'Lapor Pekerjaan Selesai'}</h3><button onClick={() => setShowEvidenceModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">
                
                <label className={`block border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${evidenceFiles.length > 0 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 text-slate-500 hover:bg-blue-50 hover:border-blue-400'}`}>
                  <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files) handleEvidenceFileSelection(e.target.files); }} />
                  {evidenceFiles.length > 0 ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
                      <span className="text-sm font-medium text-emerald-700">{evidenceFiles.length} File Terpilih</span>
                      <span className="text-xs text-slate-400 mt-1">Klik untuk mengganti</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-blue-500 mb-2" />
                      <span className="text-sm">Klik upload dokumen / file</span>
                      <span className="text-xs text-slate-400 mt-1">Bisa pilih multiple file</span>
                    </>
                  )}
                </label>
                
                {evidenceFiles.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                        {evidenceFiles.map((f, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-white px-2 py-1.5 rounded shadow-sm border border-slate-100">
                                <span className="text-slate-700 truncate min-w-0" title={f.name}>{f.name}</span>
                                <button onClick={() => setEvidenceFiles(evidenceFiles.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link URL (Opsional)</label>
                   <input type="url" className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Contoh: https://drive.google.com/..." value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan</label>
                   <textarea className="w-full border p-3 rounded-lg text-sm bg-white" rows="2" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} placeholder="Tulis catatan pendek (opsional)"></textarea>
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0">
                <button onClick={() => { setShowEvidenceModal(false); setEvidenceFiles([]); setEvidenceLink(""); setEvidenceText(""); }} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Batal</button>
                <button onClick={submitEvidence} disabled={evidenceUploading || (evidenceFiles.length === 0 && !evidenceText && !evidenceLink)} className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${evidenceUploading || (evidenceFiles.length === 0 && !evidenceText && !evidenceLink) ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
                  {evidenceUploading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : 'Kirim Laporan'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {
        showReviseModal && subtaskToRevise && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center"><h3 className="font-bold text-red-800 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Revisi Pekerjaan</h3><button onClick={() => setShowReviseModal(false)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Berikan catatan perbaikan untuk subtask: <br /><span className="font-semibold text-slate-800">{subtaskToRevise.title}</span></p>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Komentar Revisi</label><textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" rows="4" placeholder="Contoh: Bukti buram, tolong upload ulang dengan resolusi tinggi..." value={reviseComment} onChange={(e) => setReviseComment(e.target.value)}></textarea></div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-200"><button onClick={() => setShowReviseModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100">Cancel</button><button onClick={handleSendRevision} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm">Send</button></div>
            </div>
          </div>
        )
      }

      {
        showNewTaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-4 border-b flex justify-between sticky top-0 z-10"><h3 className="font-bold">{editingMainTaskId ? 'Edit Project' : 'Buat Project Baru'}</h3><button onClick={() => setShowNewTaskModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nama Project" />
                <textarea className="w-full border p-2 rounded-lg text-sm" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Deskripsi"></textarea>

                {/* Template Subtask Dropdown - only show for new tasks */}
                {!editingMainTaskId && taskTemplates.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Template Subtask (Opsional)</label>
                    <select className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                      <option value="">-- Tanpa Template --</option>
                      {taskTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subtasks.length} subtasks)</option>
                      ))}
                    </select>
                    {selectedTemplateId && (() => {
                      const tpl = taskTemplates.find(t => t.id === Number(selectedTemplateId));
                      if (!tpl) return null;
                      return (
                        <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><Copy className="w-3 h-3" /> Preview Subtask dari Template:</p>
                          <div className="space-y-1">
                            {tpl.subtasks.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-blue-800">
                                <Circle className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                                <span>{s.title}</span>
                                {s.assignee && <span className="text-blue-500">• {s.assignee}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1 w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">PIC</label>
                    <input
                      type="text"
                      className="w-full border p-2 rounded-lg text-sm bg-slate-100 text-slate-600 cursor-not-allowed"
                      value={newTaskPic || (currentUser ? currentUser.name : "")}
                      readOnly
                      title="PIC otomatis terisi sesuai user yang login"
                    />
                  </div>
                  <div className="flex-1 w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Deadline</label>
                    <input type="date" className="w-full border p-2 rounded-lg text-sm" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={newTaskIsEvent} onChange={(e) => setNewTaskIsEvent(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-slate-700">Add to Event</span>
                  </label>

                  {newTaskIsEvent && (
                    <div className="p-3 bg-blue-50/50 rounded-lg mt-2 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-blue-800 mb-1">Event Start Date</label>
                          <input type="date" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventStartDate} onChange={(e) => setNewEventStartDate(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-blue-800 mb-1">Event End Date</label>
                          <input type="date" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventEndDate} onChange={(e) => setNewEventEndDate(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">Event Location</label>
                        <input type="text" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} placeholder="Masukkan lokasi event" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-800 mb-2">PIC Event</label>
                        <div className="bg-white p-3 rounded-lg border border-blue-200 max-h-44 overflow-y-auto space-y-2">
                          {activePicUsers.map((user) => {
                            const isSelected = newEventParticipants.includes(user.name);
                            return (
                              <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-blue-50 border border-transparent hover:border-blue-100 cursor-pointer transition-colors">
                                <input type="checkbox" checked={isSelected} onChange={() => toggleNewTaskEventParticipant(user.name)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                                <UserAvatar name={user.name} photoURL={user.photoURL} className="w-6 h-6" />
                                <span className="text-sm font-medium text-slate-700 flex-1">{user.name}</span>
                                <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">{user.role}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0"><button onClick={() => setShowNewTaskModal(false)} className="px-4 py-2 text-sm text-slate-600">Batal</button><button onClick={addNewTask} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Simpan</button></div>
            </div>
          </div>
        )
      }

      {
        showSubtaskModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between"><h3 className="font-bold">{editingSubtaskId ? 'Edit Subtask' : 'Tambah Subtask'}</h3><button onClick={() => setShowSubtaskModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4">
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormTitle} onChange={(e) => setSubtaskFormTitle(e.target.value)} placeholder="Nama Subtask" />
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Assignee (Member)</label><select className="w-full border p-2 rounded-lg text-sm bg-white" value={subtaskFormAssignee} onChange={(e) => setSubtaskFormAssignee(e.target.value)}><option value="" disabled>-- Pilih Assignee --</option>{activeUsers.map(user => (<option key={user.id} value={user.name}>{user.name} ({user.role})</option>))}</select></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormStartDate} max={activeTask?.deadline || undefined} onChange={(e) => setSubtaskFormStartDate(e.target.value)} />
                  <p className="mt-1 text-[11px] text-slate-400">Kosongkan untuk default H-3 dari deadline subtask. Tidak boleh melewati deadline main task.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deadline</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormDeadline} max={activeTask?.deadline || undefined} onChange={(e) => { setSubtaskFormDeadline(e.target.value); if (!subtaskFormStartDate) { setSubtaskFormStartDate(getDefaultSubtaskStartDate(e.target.value)); } }} />
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowSubtaskModal(false)} className="px-4 py-2 text-sm text-slate-600">Batal</button><button onClick={saveSubtask} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Simpan</button></div>
            </div>
          </div>
        )
      }

      {
        showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">Add New User</h3><button onClick={() => setShowAddUserModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label><input type="email" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Photo Avatar</label>
                  <input type="file" accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'new')} />
                  {newUserAvatarPreview ? (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <img src={newUserAvatarPreview} alt="Preview avatar baru" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{newUserAvatarFile?.name}</p>
                        <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                  )}
                </div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label><div className="relative"><input type={showPassword ? "text" : "password"} className="w-full border border-slate-300 rounded-lg p-2 pr-10 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} placeholder="Set login password" autoComplete="new-password" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><p className="mt-1 text-[11px] text-slate-400">Password hanya dipakai untuk membuat akun Firebase dan tidak disimpan di Firestore.</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Role</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={newUserForm.department} onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowAddUserModal(false)} disabled={isSavingUser} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button><button onClick={handleAddUser} disabled={isSavingUser} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingUser ? 'Creating...' : 'Create User'}</button></div>
            </div>
          </div>
        )
      }

      {
        showEditUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">Edit User</h3><button onClick={() => setShowEditUserModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label><input type="email" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Photo Avatar</label>
                  <input type="file" accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'edit')} />
                  {editUserAvatarPreview ? (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <img src={editUserAvatarPreview} alt="Preview avatar edit user" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-700">{editUserAvatarFile?.name}</p>
                        <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                      </div>
                    </div>
                  ) : editUserForm.photoURL ? (
                    <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <img src={editUserForm.photoURL} alt="Avatar user saat ini" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-700">Avatar saat ini</p>
                        <p className="text-[11px] text-slate-400">Akan tetap dipakai jika tidak memilih file baru.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Role</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.department} onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowEditUserModal(false)} disabled={isSavingUser} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button><button onClick={handleUpdateUser} disabled={isSavingUser} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingUser ? 'Saving...' : 'Save Changes'}</button></div>
            </div>
          </div>
        )
      }

      {
        showUserDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center">
              <div className="bg-blue-600 h-28 w-full relative"><button onClick={() => setShowUserDetailModal(false)} className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button></div>
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-14 mb-4 flex justify-center"><div className="rounded-full p-1.5 bg-white shadow-lg"><UserAvatar name={selectedUser.name} photoURL={selectedUser.photoURL} size={128} className="w-24 h-24" /></div></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedUser.name}</h3><p className="text-slate-500 text-sm">{selectedUser.role} • {selectedUser.department}</p>
                  <div className="mt-6 space-y-3 text-left">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Mail className="w-5 h-5 text-blue-500" /><div className="overflow-hidden"><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="text-sm font-medium text-slate-700 truncate" title={selectedUser.email}>{selectedUser.email}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Building className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Department</p><p className="text-sm font-medium text-slate-700">{selectedUser.department}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><CheckCircle className="w-5 h-5 text-green-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Status</p><p className="text-sm font-medium text-green-700">{selectedUser.status}</p></div></div>
                  </div>
                  <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
                    <button onClick={() => handleOpenEditUser(selectedUser)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"><PenSquare className="w-4 h-4" /> Edit</button>
                    <button onClick={handleDeleteUser} disabled={selectedUser.status === 'Active'} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedUser.status === 'Active' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title={selectedUser.status === 'Active' ? "Hanya user Inactive yang dapat dihapus" : "Hapus User"}><Trash2 className="w-4 h-4" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* KPI MODAL */}
      {
        showKPIModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">{editingKPI ? 'Edit KPI' : 'Add New KPI'}</h3><button onClick={() => setShowKPIModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">KPI Title</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={kpiForm.title} onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })} placeholder="e.g. Revenue Growth" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Group</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={kpiForm.group} onChange={(e) => setKpiForm({ ...kpiForm, group: e.target.value })}>{KPI_GROUPS.map(g => (<option key={g} value={g}>{g}</option>))}</select></div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowKPIModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button><button onClick={handleSaveKPI} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Save</button></div>
            </div>
          </div>
        )
      }

      {/* EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold">{editingEvent ? 'Edit Event' : 'Add External Event'}</h3>
              <button onClick={() => setShowEventModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Judul Event</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Masukkan Judul Event" />
              </div>
              {editingEvent?.eventType === 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Linked Project</label>
                  <div className="w-full border border-slate-200 bg-slate-50 p-2 text-sm rounded-lg text-slate-700 font-medium">
                    {taskById.get(eventForm.linkedTaskId)?.title || eventForm.title}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">End Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lokasi</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Masukkan Lokasi" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">{editingEvent?.eventType === 'internal' ? 'PIC Event' : 'Peserta (User)'}</label>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                  {(editingEvent?.eventType === 'internal' ? activePicUsers : activeUsers).map(user => {
                    const isSelected = eventForm.participants.includes(user.name);
                    return (
                      <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-colors">
                        <input type="checkbox" checked={isSelected} onChange={() => toggleEventParticipant(user.name)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                        <UserAvatar name={user.name} photoURL={user.photoURL} className="w-6 h-6" />
                        <span className="text-sm font-medium text-slate-700 flex-1">{user.name}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">{user.role}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t sticky bottom-0 flex justify-end gap-2">
              <button onClick={() => setShowEventModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSaveEvent} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Simpan Event</button>
            </div>
          </div>
        </div>
      )}

      {/* EVENT DETAIL MODAL (Pop-up Card) */}
      {
        showEventDetailModal && selectedEventDetail && (
          (() => {
            const eventTypeMeta = getEventTypeMeta(selectedEventDetail.eventType);
            const linkedTask = tasks.find((task) => {
              if (selectedEventDetail.linkedTaskId && String(task.id) === String(selectedEventDetail.linkedTaskId)) {
                return true;
              }
              return selectedEventDetail.eventType === 'internal' && task.title === selectedEventDetail.title;
            }) || null;
            return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative">
              <div className={`${eventTypeMeta.accentClass} p-5 text-white flex justify-between items-start`}>
                <div>
                  <div className="mb-2">
                    <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {eventTypeMeta.label} Event
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight mb-1">{selectedEventDetail.title}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-sm opacity-90">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateIndo(selectedEventDetail.startDate)} {selectedEventDetail.endDate && selectedEventDetail.endDate !== selectedEventDetail.startDate ? ` - ${formatDateIndo(selectedEventDetail.endDate)}` : ''}</span>
                  </div>
                </div>
                <button onClick={() => setShowEventDetailModal(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Location</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEventDetail.location || "TBD"}</p>
                    </div>
                  </div>

                  {selectedEventDetail.eventType === 'internal' && linkedTask && (
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Briefcase className="w-5 h-5" /></div>
                      <div className="w-full">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Main Task</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEventDetailModal(false);
                            setSelectedTaskId(linkedTask.id);
                            navigateTo('jobtask');
                          }}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {linkedTask.title}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Users className="w-5 h-5" /></div>
                    <div className="w-full">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">{selectedEventDetail.eventType === 'internal' ? 'PIC Event' : 'Participants'}</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEventDetail.participants && Array.isArray(selectedEventDetail.participants) && selectedEventDetail.participants.length > 0 ? (
                          selectedEventDetail.participants.map(p => (
                            <div key={p} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-xs font-medium text-slate-700 flex items-center gap-1.5">
                              <UserAvatar name={p} photoURL={userByName.get(p)?.photoURL} className="w-4 h-4" />{p}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-400">Belum ada peserta</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowEventDetailModal(false);
                    handleDeleteEvent(selectedEventDetail.id);
                  }}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => {
                    setShowEventDetailModal(false);
                    openEventModal(selectedEventDetail);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Event
                </button>
              </div>
            </div>
          </div>
            );
          })()
        )
      }

      {confirmationDialog.open && (
        <div className="fixed inset-0 bg-slate-900/50 z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className={`flex items-start gap-3 border-b px-5 py-4 ${
              confirmationDialog.tone === 'red'
                ? 'border-red-100 bg-red-50'
                : confirmationDialog.tone === 'emerald'
                  ? 'border-emerald-100 bg-emerald-50'
                  : 'border-blue-100 bg-blue-50'
            }`}>
              <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                confirmationDialog.tone === 'red'
                  ? 'bg-red-100 text-red-600'
                  : confirmationDialog.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmationDialog.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{confirmationDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => closeConfirmationDialog(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {confirmationDialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirmationDialog(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  confirmationDialog.tone === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmationDialog.tone === 'emerald'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmationDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATE TASK MODAL */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">{editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}</h3>
              <button onClick={() => setShowTemplateModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Template</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. IT Project Template" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Subtask Items</label>
                  <button onClick={addTemplateSubtaskRow} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors">
                    <Plus className="w-3 h-3" /> Tambah Row
                  </button>
                </div>
                <div className="space-y-3">
                  {templateForm.subtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-shrink-0 mt-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-200 w-5 h-5 flex items-center justify-center rounded">{idx + 1}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={sub.title} onChange={(e) => updateTemplateSubtaskRow(idx, 'title', e.target.value)} placeholder="Nama Subtask" />
                        <div className="flex gap-2">
                          <select className="flex-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={sub.assignee} onChange={(e) => updateTemplateSubtaskRow(idx, 'assignee', e.target.value)}>
                            <option value="">-- Assignee (Opsional) --</option>
                            {activeUsers.map(user => (<option key={user.id} value={user.name}>{user.name}</option>))}
                          </select>
                          <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-sm text-slate-500 font-semibold whitespace-nowrap">H -</span>
                            <input type="number" min="0" className="w-16 flex-1 text-sm outline-none bg-transparent" placeholder="Hari" value={sub.deadline} onChange={(e) => updateTemplateSubtaskRow(idx, 'deadline', e.target.value)} title="Masukkan angka (H minus hari dari deadline project)" />
                          </div>
                        </div>
                      </div>
                      {templateForm.subtasks.length > 1 && (
                        <button onClick={() => removeTemplateSubtaskRow(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t sticky bottom-0 flex justify-end gap-2">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSaveTemplate} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Simpan Template</button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
