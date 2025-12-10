import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Send, FolderOpen, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  updated_at: string | null;
  photo_url?: string | null;
}

interface DashboardProps {
  onSelectProject?: (project: Project) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectProject }) => {
  const { user, canEdit } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'my-projects'>('recent');
  const [projects, setProjects] = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    fetchProjects();
    fetchRecentlyViewed();
  }, [user]);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, description, created_at, updated_at, photo_url')
      .order('updated_at', { ascending: false })
      .limit(6);

    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const fetchRecentlyViewed = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('project_views')
      .select('project_id, viewed_at, projects(id, name, description, photo_url, updated_at)')
      .eq('user_id', user.id)
      .order('viewed_at', { ascending: false })
      .limit(6);

    if (!error && data) {
      const recent = data
        .filter(v => v.projects)
        .map(v => ({ ...v.projects, viewed_at: v.viewed_at })) as any[];
      setRecentProjects(recent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !canEdit()) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: prompt.slice(0, 50),
        description: prompt,
        owner_id: user?.id
      })
      .select()
      .single();

    if (!error && data && onSelectProject) {
      toast.success('Project created!');
      onSelectProject(data);
    }
    setPrompt('');
    fetchProjects();
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const displayProjects = activeTab === 'recent' ? recentProjects : projects;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <div className="flex-1 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse 80% 80% at 50% 50%, hsl(240 70% 40% / 0.6) 0%, hsl(280 80% 40% / 0.5) 25%, hsl(320 85% 45% / 0.4) 50%, transparent 100%)`
        }} />

        <div className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4">
          <h1 className="text-4xl md:text-5xl font-semibold text-foreground mb-8 text-center">
            Let's create, <span className="italic">{userName}</span>
          </h1>

          <form onSubmit={handleSubmit} className="w-full max-w-2xl">
            <div className="relative bg-[hsl(var(--workspace-panel))] rounded-2xl border border-[hsl(var(--workspace-border))] overflow-hidden">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Create a new project..."
                className="w-full px-6 py-4 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none text-base"
                disabled={!canEdit()}
              />
              <div className="flex items-center gap-2 px-4 pb-4">
                <button type="button" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
                <div className="flex-1" />
                <button
                  type="submit"
                  disabled={!prompt.trim() || !canEdit()}
                  className="p-2 rounded-full bg-primary text-primary-foreground hover:brightness-110 transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
            {!canEdit() && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                You need developer or admin access to create projects
              </p>
            )}
          </form>
        </div>
      </div>

      <div className="bg-[hsl(var(--workspace-bg))] border-t border-[hsl(var(--workspace-border))]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'recent' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Recently viewed
            </button>
            <button
              onClick={() => setActiveTab('my-projects')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'my-projects' ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              My projects
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />
              ))
            ) : displayProjects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No projects yet</p>
              </div>
            ) : (
              displayProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject?.(project)}
                  className="group h-40 rounded-xl bg-[hsl(var(--workspace-panel))] border border-[hsl(var(--workspace-border))] p-4 text-left hover:border-primary/50 transition-colors overflow-hidden"
                >
                  <div className="flex gap-3 h-full">
                    {project.photo_url && (
                      <img src={project.photo_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex flex-col flex-1 min-w-0">
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-auto">
                        {project.updated_at ? getTimeAgo(project.updated_at) : 'Recently'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
