"use client";

import { useEffect, useState } from "react";
import { 
  ChevronLeft, 
  Plus,
  Loader2,
  FolderOpen,
  Calendar,
  Layers,
  Trash2,
  ArrowRight,
  Brain,
  Play,
  Edit2
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";

interface Classroom {
  id: string;
  name: string;
  subject: string;
}

interface Subclassroom {
  id: string;
  name: string;
  description: string;
  materialCount: number;
  createdAt: string;
}

export default function ClassroomPage() {
  const params = useParams();
  const classroomId = params.id as string;
  
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [subclassrooms, setSubclassrooms] = useState<Subclassroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Subclassroom State
  const [newSubclassroom, setNewSubclassroom] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  
  // Edit Subclassroom State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [subclassroomToEdit, setSubclassroomToEdit] = useState<Subclassroom | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  const handleUpdateSubclassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subclassroomToEdit) return;
    setUpdating(true);

    try {
      const res = await fetch(`/api/subclassrooms/${subclassroomToEdit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: subclassroomToEdit.name, description: subclassroomToEdit.description }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update module");
      }

      setEditModalOpen(false);
      setSubclassroomToEdit(null);
      fetchClassroomData();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdating(false);
    }
  };

  const fetchClassroomData = async () => {
    try {
      setLoading(true);
      // Fetch classroom details
      const classroomRes = await fetch(`/api/classrooms/${classroomId}`);
      const classroomData = await classroomRes.json();
      setClassroom(classroomData.classroom);

      // Fetch subclassrooms
      const subclassroomsRes = await fetch(`/api/classrooms/${classroomId}/subclassrooms`);
      const subclassroomsData = await subclassroomsRes.json();
      setSubclassrooms(subclassroomsData);
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubclassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch(`/api/classrooms/${classroomId}/subclassrooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubclassroom),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create subclassroom");
      }

      // Reset and refresh
      setNewSubclassroom({ name: "", description: "" });
      setIsModalOpen(false);
      fetchClassroomData();
    } catch (error: any) {
      console.error("Create failed", error);
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSubclassroom = async (subclassroomId: string) => {
    if (!confirm("Are you sure? This will delete all materials, notes, and MCQs in this module.")) return;
    
    try {
      const res = await fetch(`/api/subclassrooms/${subclassroomId}`, {
        method: "DELETE",
      });
      
      if (res.ok) {
        fetchClassroomData();
      } else {
        const error = await res.json();
        alert(`Failed to delete: ${error.error}`);
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete module.");
    }
  };

  if (loading) {
     return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        </div>
     );
  }

  if (!classroom) return <div className="min-h-screen bg-[#050505] flex items-center justify-center">Classroom not found</div>;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Navigation */}
      <nav className="container mx-auto flex h-20 items-center justify-between px-6">
        <Link 
          href="/dashboard" 
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Sessions
        </Link>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2 whitespace-nowrap overflow-hidden text-ellipsis max-w-[600px]">{classroom.name}</h1>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 uppercase tracking-widest">
                    {classroom.subject}
                  </span>
                  <p className="text-white/40 text-sm">{subclassrooms.length} Modules</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 font-bold hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
              >
                <Plus className="h-5 w-5" />
                CREATE MODULE
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {subclassrooms.length === 0 ? (
                <div className="col-span-full p-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
                  <FolderOpen className="h-12 w-12 text-white/10 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white/40 mb-2">No Modules Created</h3>
                  <p className="text-white/20 mb-6">Create modules like "Algebra", "Ancient History", or "Unit 1" to organize your notes.</p>
                  <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 transition-all"
                  >
                    Create Your First Module
                  </button>
                </div>
              ) : (
                subclassrooms.map((sub, idx) => (
                  <SubclassroomCard 
                    key={sub.id} 
                    sub={sub} 
                    index={idx} 
                    onEdit={() => {
                      setSubclassroomToEdit(sub);
                      setEditModalOpen(true);
                    }}
                    onDelete={() => handleDeleteSubclassroom(sub.id)}
                  />
                ))
              )}
            </div>
          </div>

          <aside className="w-full lg:w-96 space-y-6">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 shadow-2xl shadow-indigo-500/20">
              <div className="flex items-center justify-between mb-6">
                <Brain className="h-12 w-12 text-white/80" />
                <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full">ALL MODULES</span>
              </div>
              <h2 className="text-2xl font-bold mb-2 uppercase tracking-tighter">Classroom Quiz</h2>
              <p className="text-white/70 text-sm mb-6">Test your knowledge across all modules in this session.</p>
              <Link href={`/quiz/${classroomId}`}>
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-white py-4 font-bold text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <Play className="h-5 w-5 fill-indigo-600" />
                  START FULL QUIZ
                </button>
              </Link>
            </div>

            {/* AI Insights Card */}
            <div className="rounded-3xl border border-white/5 bg-white/5 p-8 backdrop-blur-sm">
              <h3 className="text-sm font-bold text-white/50 uppercase tracking-widest mb-6">Mastery Level</h3>
              <div className="space-y-4">
                <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full w-[45%] bg-indigo-500" />
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-indigo-400">45% Complete</span>
                  <span className="text-white/20">Target: 100%</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Module"
        className="max-w-md"
      >
        <form onSubmit={handleCreateSubclassroom} className="space-y-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase">Module Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Fundamental Rights, Modern Algebra..."
                  value={newSubclassroom.name}
                  onChange={(e) => setNewSubclassroom({...newSubclassroom, name: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white focus:border-indigo-500 focus:outline-none transition-all"
                />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-white/60 uppercase">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what this module covers..."
                  value={newSubclassroom.description}
                  onChange={(e) => setNewSubclassroom({...newSubclassroom, description: e.target.value})}
                  className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white focus:border-indigo-500 focus:outline-none transition-all resize-none"
                />
            </div>

            <button
                disabled={creating}
                className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
            >
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : "CREATE MODULE"}
            </button>
        </form>
      </Modal>

      <Modal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Module"
        className="max-w-md"
      >
        {subclassroomToEdit && (
          <form onSubmit={handleUpdateSubclassroom} className="space-y-6">
              <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase">Module Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. Fundamental Rights, Modern Algebra..."
                    value={subclassroomToEdit.name}
                    onChange={(e) => setSubclassroomToEdit({...subclassroomToEdit, name: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white focus:border-indigo-500 focus:outline-none transition-all"
                  />
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold text-white/60 uppercase">Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what this module covers..."
                    value={subclassroomToEdit.description}
                    onChange={(e) => setSubclassroomToEdit({...subclassroomToEdit, description: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white focus:border-indigo-500 focus:outline-none transition-all resize-none"
                  />
              </div>

              <button
                  disabled={updating}
                  className="w-full rounded-xl bg-indigo-600 py-4 font-bold text-white hover:bg-indigo-500 disabled:opacity-50 flex justify-center items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                  {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : "SAVE CHANGES"}
              </button>
          </form>
        )}
      </Modal>
    </div>
  );
}

function SubclassroomCard({ sub, index, onEdit, onDelete }: { sub: Subclassroom, index: number, onEdit: () => void, onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative"
    >
      <Link href={`/subclassroom/${sub.id}`}>
        <div className="h-full rounded-3xl border border-white/5 bg-white/[0.03] p-6 transition-all hover:bg-white/[0.06] hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 active:scale-[0.98]">
          <div className="flex items-start justify-between mb-6">
            <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
              <FolderOpen className="h-7 w-7" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 rounded-lg text-white/10 hover:text-indigo-400 hover:bg-indigo-400/10 transition-all opacity-0 group-hover:opacity-100"
                title="Edit Module"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 rounded-lg text-white/10 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                title="Delete Module"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors uppercase tracking-tight line-clamp-2 min-h-[3.5rem]">{sub.name}</h3>
          <p className="text-white/40 text-sm line-clamp-2 mb-6 min-h-[2.5rem]">{sub.description || "No description provided"}</p>

          <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
            <div className="flex items-center gap-3 text-xs font-bold text-white/40">
              <span className="flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {sub.materialCount} ITEMS</span>
              <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {new Date(sub.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 group-hover:bg-indigo-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
