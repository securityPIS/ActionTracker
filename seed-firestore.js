// Firestore Seeder Script
// Run this ONCE to populate your Firebase project with initial data.
// Usage (PowerShell):
//   $env:SEED_USER_PASSWORD="replace-with-a-strong-temp-password"
//   node seed-firestore.js

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc } from "firebase/firestore";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCgnPJ3xZ4RhuEv0mMuyhANnUdb3f3rNEs",
  authDomain: "actiontracker-91ea5.firebaseapp.com",
  projectId: "actiontracker-91ea5",
  storageBucket: "actiontracker-91ea5.firebasestorage.app",
  messagingSenderId: "136493828217",
  appId: "1:136493828217:web:f56d743328391bffa2aca8",
  measurementId: "G-J8ZWREQBFJ",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const seedUserPassword = process.env.SEED_USER_PASSWORD;

const DEFAULT_USERS = [
  { name: "Budi Santoso", email: "budi.s@pertamina.com", role: "PIC", department: "Strategic Planning", status: "Active" },
  { name: "Siti Aminah", email: "siti.a@pertamina.com", role: "Assignee", department: "Finance", status: "Active" },
  { name: "Rudi Hartono", email: "rudi.h@pertamina.com", role: "Assignee", department: "IT Infrastructure", status: "Active" },
  { name: "Andi Wijaya", email: "andi.w@pertamina.com", role: "PIC", department: "IT Support", status: "Active" },
  { name: "Sarah Larasati", email: "sarah.l@pertamina.com", role: "PIC", department: "Digital Product", status: "Active" },
  { name: "Dimas Anggara", email: "dimas.a@pertamina.com", role: "Assignee", department: "Software Engineering", status: "Active" },
];

const DEFAULT_TASKS = [
  {
    title: "Penyusunan Laporan Tahunan 2024",
    description: "Mengumpulkan data dari semua departemen dan menyusun layout buku tahunan.",
    pic: "Budi Santoso",
    deadline: "2024-03-30",
    progress: 33,
    isEvent: false,
    subtasks: [
      { id: 101, title: "Kompilasi Data Keuangan", assignee: "Siti Aminah", deadline: "2024-03-20", status: "completed", evidence: "Laporan_Keuangan_Final.pdf", comments: [{ text: "Sudah divalidasi finance.", user: "Siti Aminah", type: "evidence", timestamp: "26/01/2024 10:00" }], lastUpdated: "26/01/2024 10:00" },
      { id: 102, title: "Drafting Narasi CEO", assignee: "Rudi Hartono", deadline: "2024-03-25", status: "waiting_review", evidence: "Draft_Narasi_v1.docx", comments: [{ text: "Mohon direview pak.", user: "Rudi Hartono", type: "evidence", timestamp: "26/01/2024 14:30" }], lastUpdated: "26/01/2024 14:30" },
      { id: 103, title: "Desain Cover & Layout", assignee: "Siti Aminah", deadline: "2024-03-28", status: "pending", evidence: null, comments: [], lastUpdated: "20/01/2024 09:00" },
    ],
  },
  {
    title: "Maintenance Server & Keamanan",
    description: "Update patch keamanan rutin dan backup database Q1.",
    pic: "Andi Wijaya",
    deadline: "2024-02-15",
    progress: 0,
    isEvent: false,
    subtasks: [
      { id: 201, title: "Backup Database Utama", assignee: "Rudi Hartono", deadline: "2024-02-10", status: "revision", evidence: "Backup_Log.txt", comments: [{ text: "File corrupt, tolong ulang backup manual.", user: "Andi Wijaya", type: "revision", timestamp: "25/01/2024 16:45" }], lastUpdated: "25/01/2024 16:45" },
      { id: 202, title: "Update Firewall Rules", assignee: "Rudi Hartono", deadline: "2024-02-12", status: "pending", evidence: null, comments: [], lastUpdated: "20/01/2024 08:00" },
    ],
  },
];

const DEFAULT_KPIS = [
  { title: "Revenue Growth Rate", group: "FINANCE" },
  { title: "Operating Cost Reduction", group: "FINANCE" },
  { title: "Customer Satisfaction Index", group: "CUSTOMER FOCUS" },
  { title: "Net Promoter Score (NPS)", group: "CUSTOMER FOCUS" },
  { title: "Process Automation Rate", group: "INTERNAL PROCESS" },
  { title: "System Uptime Percentage", group: "INTERNAL PROCESS" },
  { title: "Employee Training Hours", group: "LEARNING & GROWTH" },
  { title: "Innovation Projects Delivered", group: "LEARNING & GROWTH" },
];

const DEFAULT_EVENTS = [
  { title: "Town Hall Meeting Q1", startDate: "2024-02-15", endDate: "2024-02-15", location: "Auditorium Lantai 5", participants: ["Budi Santoso", "Siti Aminah", "Rudi Hartono"] },
  { title: "Workshop Digital Transformation", startDate: "2024-03-10", endDate: "2024-03-11", location: "Ruang Meeting DigitalHub", participants: ["Andi Wijaya", "Sarah Larasati"] },
];

const DEFAULT_TEMPLATES = [
  {
    name: "IT Project Template",
    subtasks: [
      { title: "Requirement Analysis", assignee: "", deadline: "" },
      { title: "Design & Planning", assignee: "", deadline: "" },
      { title: "Development", assignee: "", deadline: "" },
      { title: "Testing & QA", assignee: "", deadline: "" },
      { title: "Deployment", assignee: "", deadline: "" },
    ],
  },
  {
    name: "Report Submission Template",
    subtasks: [
      { title: "Pengumpulan Data", assignee: "", deadline: "" },
      { title: "Penyusunan Draft", assignee: "", deadline: "" },
      { title: "Review & Revisi", assignee: "", deadline: "" },
      { title: "Finalisasi Dokumen", assignee: "", deadline: "" },
    ],
  },
];

async function seedUsers() {
  if (!seedUserPassword || seedUserPassword.length < 12) {
    throw new Error("Set SEED_USER_PASSWORD with at least 12 characters before running the seeder.");
  }

  console.log("Creating Firebase Auth users and Firestore profiles...");

  for (const user of DEFAULT_USERS) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, seedUserPassword);
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        status: user.status,
      });
      console.log(`  Created: ${user.name} (${user.email}) -> UID: ${userCredential.user.uid}`);
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        console.log(`  Already exists: ${user.email}`);
      } else {
        console.error(`  Error creating ${user.email}:`, error.message);
      }
    }
  }
}

async function seedCollection(collectionName, data) {
  console.log(`Seeding ${collectionName}...`);
  for (let i = 0; i < data.length; i += 1) {
    const docRef = doc(collection(db, collectionName));
    await setDoc(docRef, data[i]);
    console.log(`  Added: ${data[i].title || data[i].name || `Item ${i + 1}`}`);
  }
}

async function main() {
  console.log("Starting Firestore seed...\n");

  await seedUsers();
  console.log("");
  await seedCollection("tasks", DEFAULT_TASKS);
  console.log("");
  await seedCollection("kpis", DEFAULT_KPIS);
  console.log("");
  await seedCollection("events", DEFAULT_EVENTS);
  console.log("");
  await seedCollection("templates", DEFAULT_TEMPLATES);

  console.log("\nSeeding complete.");
  console.log("Users were created with the temporary password from SEED_USER_PASSWORD. Rotate that password before production use.");
  process.exit(0);
}

main().catch(console.error);
