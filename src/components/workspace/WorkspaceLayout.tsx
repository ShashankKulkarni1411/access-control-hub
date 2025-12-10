import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Dashboard } from './Dashboard';
import { ProjectsPanel } from './ProjectsPanel';
import { CodeEditor } from './CodeEditor';
import { AdminPanel } from './AdminPanel';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Settings, Search, Star, Users, Compass, LayoutTemplate, BookOpen } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  description: string | null;
  code?: string;
  photo_url?: string | null;
}

export const WorkspaceLayout: React.FC = () => {
  const { canEdit, isAdmin, user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectCode, setProjectCode] = useState('');

  const handleSelectProject = async (project: Project) => {
    // Fetch full project with code
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', project.id)
      .single();

    if (error) {
      toast.error('Failed to load project');
      return;
    }

    // Track project view
    if (user) {
      await supabase
        .from('project_views')
        .upsert({
          user_id: user.id,
          project_id: project.id,
          viewed_at: new Date().toISOString()
        }, { onConflict: 'user_id,project_id' });
    }

    setSelectedProject(data);
    setProjectCode(data.code || '');
    setActiveSection('editor');
  };

  const handleSaveCode = async () => {
    if (!selectedProject || !canEdit()) return;

    const { error } = await supabase
      .from('projects')
      .update({ code: projectCode })
      .eq('id', selectedProject.id);

    if (error) {
      toast.error('Failed to save code');
    } else {
      toast.success('Code saved successfully');
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setActiveSection('dashboard');
  };

  const renderPlaceholder = (title: string, icon: React.ReactNode, description: string) => (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[hsl(var(--workspace-panel))] border border-[hsl(var(--workspace-border))] flex items-center justify-center text-[hsl(var(--workspace-text-muted))]">
          {icon}
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
        <p className="text-[hsl(var(--workspace-text-muted))] max-w-md">{description}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onSelectProject={handleSelectProject} />;

      case 'projects':
        return <ProjectsPanel onSelectProject={handleSelectProject} />;

      case 'search':
        return renderPlaceholder('Search', <Search className="w-8 h-8" />, 'Search across all your projects and resources');

      case 'starred':
        return renderPlaceholder('Starred', <Star className="w-8 h-8" />, 'Your starred projects will appear here');

      case 'shared':
        return renderPlaceholder('Shared with me', <Users className="w-8 h-8" />, 'Projects shared with you will appear here');

      case 'discover':
        return renderPlaceholder('Discover', <Compass className="w-8 h-8" />, 'Explore popular projects and templates from the community');

      case 'templates':
        return renderPlaceholder('Templates', <LayoutTemplate className="w-8 h-8" />, 'Start from pre-built templates to speed up your development');

      case 'learn':
        return renderPlaceholder('Learn', <BookOpen className="w-8 h-8" />, 'Tutorials and guides to help you build better');

      case 'editor':
        if (selectedProject) {
          return (
            <div className="h-full flex flex-col">
              {/* Editor Header */}
              <div className="flex items-center gap-4 p-4 border-b border-[hsl(var(--workspace-border))] bg-[hsl(var(--workspace-sidebar))]">
                <button
                  onClick={handleBackToProjects}
                  className="p-2 rounded-lg text-[hsl(var(--workspace-text-muted))] hover:text-foreground hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  {selectedProject.photo_url && (
                    <img 
                      src={selectedProject.photo_url} 
                      alt={selectedProject.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <h2 className="font-semibold text-foreground">{selectedProject.name}</h2>
                    <p className="text-xs text-[hsl(var(--workspace-text-muted))]">
                      {selectedProject.description || 'No description'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 p-4">
                <CodeEditor
                  code={projectCode}
                  onChange={setProjectCode}
                  onSave={handleSaveCode}
                  fileName={`${selectedProject.name.toLowerCase().replace(/\s+/g, '-')}.tsx`}
                />
              </div>
            </div>
          );
        }
        return (
          <div className="p-6 flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-[hsl(var(--workspace-text-muted))] mb-4">Select a project to edit</p>
              <button
                onClick={() => setActiveSection('projects')}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:brightness-110 transition-all"
              >
                Browse Projects
              </button>
            </div>
          </div>
        );

      case 'settings':
        if (!canEdit()) {
          return (
            <div className="p-6 flex-1 flex items-center justify-center">
              <div className="text-center">
                <Settings className="w-12 h-12 text-[hsl(var(--workspace-text-muted))] mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
                <p className="text-[hsl(var(--workspace-text-muted))]">
                  Developer or admin access required.
                </p>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6 animate-fade-in">
            <h1 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Settings className="w-6 h-6 text-primary" />
              Settings
            </h1>
            <div className="card-workspace max-w-2xl">
              <h3 className="font-semibold text-foreground mb-4">Workspace Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Workspace Name
                  </label>
                  <input type="text" defaultValue="My Workspace" className="input-workspace" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Default Branch
                  </label>
                  <input type="text" defaultValue="main" className="input-workspace" />
                </div>
                <button className="btn-workspace">Save Changes</button>
              </div>
            </div>
          </div>
        );

      case 'users':
        return <AdminPanel />;

      default:
        return <Dashboard onSelectProject={handleSelectProject} />;
    }
  };

  return (
    <div className="workspace-layout flex w-full">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <main className="flex-1 flex flex-col overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
};
