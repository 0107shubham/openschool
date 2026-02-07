"use client";

import { useEffect, useState } from "react";
import { ClassroomCard } from "@/components/dashboard/ClassroomCard";
import { Modal } from "@/components/ui/Modal";
import { Plus, LayoutDashboard, Settings, History, HelpCircle, Search, Bell, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Classroom {
  id: string;
  name: string;
  subject: string;
  materialCount: number;
  strength: number; 
}

export default function DashboardPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: "", subject: "" });
  const [creating, setCreating] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [classroomToDelete, setClassroomToDelete] = useState<{id: string, name: string} | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const res = await fetch("/api/classrooms");
      const data = await res.json();
      // Add random strength for demo purposes if not in DB yet
      const processed = Array.isArray(data) ? data.map((c: any) => ({
        ...c,
        strength: Math.floor(Math.random() * 100) 
      })) : [];
      setClassrooms(processed);
    } catch (error) {
      console.error("Failed to fetch classrooms", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newClassroom),
      });
      if (res.ok) {
        await fetchClassrooms();
        setIsModalOpen(false);
        setNewClassroom({ name: "", subject: "" });
      }
    } catch (error) {
      console.error("Failed to create", error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete) return;
    setDeleting(true);
    
    try {
      const res = await fetch(`/api/classrooms/${classroomToDelete.id}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        await fetchClassrooms();
        setDeleteModalOpen(false);
        setClassroomToDelete(null);
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete classroom due to a network error.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505]">
      {/* Sidebar - Pro Layout */}
      <aside className="fixed left-0 top-0 hidden h-full w-64 border-r border-white/5 bg-black/20 backdrop-blur-xl lg:block">
        <div className="flex h-20 items-center border-b border-white/5 px-8">
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-2xl font-black text-transparent">
            OPENSCHOOL
          </span>
        </div>
        <nav className="mt-8 space-y-2 px-4">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" active />
          <SidebarLink icon={History} label="Quiz History" />
          <SidebarLink icon={Settings} label="Settings" />
          <SidebarLink icon={HelpCircle} label="Help & Support" />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/5 bg-black/40 px-8 backdrop-blur-md">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
              <input 
                type="text" 
                placeholder="Search Subjects or Topics..." 
                className="h-10 w-full rounded-full border border-white/10 bg-white/5 pl-10 pr-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-white/50 hover:text-white">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-indigo-500" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[1px]">
              <div className="h-full w-full rounded-full bg-black flex items-center justify-center font-bold text-xs">JD</div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Your Training Grounds</h1>
              <p className="text-white/40 mt-1">Pick a classroom to start your active recall session.</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500 transition-all"
            >
              <Plus className="h-5 w-5" />
              CREATE CLASSROOM
            </motion.button>
          </div>

          {/* Classroom Grid */}
          {loading ? (
             <div className="flex justify-center p-20">
               <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
             </div>
          ) : classrooms.length === 0 ? (
             <div className="text-center p-20 border border-dashed border-white/10 rounded-3xl">
               <h3 className="text-xl font-bold text-white/60">No Classrooms Yet</h3>
               <p className="text-white/30 mt-2">Create your first subject to get started.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {classrooms.map((classroom) => (
                <div 
                  key={classroom.id} 
                  onClick={() => router.push(`/classroom/${classroom.id}`)}
                  className="cursor-pointer"
                >
                   <ClassroomCard 
                     {...classroom} 
                     onDelete={(e) => {
                       e.stopPropagation();
                       setClassroomToDelete({ id: classroom.id, name: classroom.name });
                       setDeleteModalOpen(true);
                     }}
                   />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Create New Classroom"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase">Classroom Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. Indian Polity"
              value={newClassroom.name}
              onChange={(e) => setNewClassroom({...newClassroom, name: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/60 uppercase">Subject / Category</label>
            <input 
              type="text" 
              required
              placeholder="e.g. General Studies"
              value={newClassroom.subject}
              onChange={(e) => setNewClassroom({...newClassroom, subject: e.target.value})}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <button 
            disabled={creating}
            className="w-full mt-4 rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Classroom"}
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !deleting && setDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mb-2">
              <Trash2 className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-white">Delete "{classroomToDelete?.name}"?</h3>
            <p className="text-white/40 text-sm">
              This action cannot be undone. All materials, notes, and MCQs in this classroom will be permanently deleted.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-bold text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteClassroom}
              disabled={deleting}
              className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-500 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <a
      href="#"
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        active 
          ? "bg-indigo-500/10 text-indigo-400" 
          : "text-white/50 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon className="h-5 w-5" />
      {label}
    </a>
  );
}
