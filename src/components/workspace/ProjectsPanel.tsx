import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Folder, Trash2, Eye, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  photo_url?: string | null;
}

interface ProjectsPanelProps {
  onSelectProject?: (project: Project) => void;
}

export const ProjectsPanel: React.FC<ProjectsPanelProps> = ({ onSelectProject }) => {
  const { canEdit, canDelete, user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  const fetchProjects = async () => {
    const { data, error } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreateProject = async () => {
    if (!canEdit() || !newProjectName.trim()) return;
    const { error } = await supabase.from('projects').insert({
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || null,
      owner_id: user?.id,
      code: `// Welcome to ${newProjectName}\n\nconst App = () => {\n  return <div><h1>Hello!</h1></div>;\n};\n\nexport default App;`,
    });
    if (error) toast.error('Failed to create project');
    else { toast.success('Project created!'); setShowCreateModal(false); setNewProjectName(''); setNewProjectDesc(''); fetchProjects(); }
  };

  const handleDeleteProject = async (id: string) => {
    if (!canDelete()) return;
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Deleted'); fetchProjects(); }
  };

  if (loading) return <div className="p-6"><div className="h-8 w-32 bg-secondary rounded mb-4 animate-pulse" /></div>;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">{projects.length} projects</p>
        </div>
        {canEdit() && <button onClick={() => setShowCreateModal(true)} className="btn-workspace"><Plus className="w-4 h-4" />New Project</button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="card-workspace group hover:border-primary/50 transition-all cursor-pointer" onClick={() => onSelectProject?.(project)}>
            <div className="flex items-start justify-between mb-3">
              {project.photo_url ? <img src={project.photo_url} alt="" className="w-12 h-12 rounded-lg object-cover" /> : <div className="p-2 rounded-lg bg-primary/10"><Folder className="w-5 h-5 text-primary" /></div>}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); onSelectProject?.(project); }} className="p-1.5 rounded hover:bg-secondary"><Eye className="w-4 h-4 text-muted-foreground" /></button>
                {canDelete() && <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }} className="p-1.5 rounded hover:bg-destructive/20"><Trash2 className="w-4 h-4 text-destructive" /></button>}
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{project.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{project.description || 'No description'}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" />{new Date(project.updated_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
          <div className="card-workspace w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-foreground mb-4">Create New Project</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-foreground mb-2">Name</label><input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="input-workspace" placeholder="My Project" /></div>
              <div><label className="block text-sm font-medium text-foreground mb-2">Description</label><textarea value={newProjectDesc} onChange={(e) => setNewProjectDesc(e.target.value)} className="input-workspace resize-none h-24" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-workspace-secondary">Cancel</button>
              <button onClick={handleCreateProject} className="btn-workspace">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
