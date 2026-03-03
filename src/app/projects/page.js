import { createClient } from '@/app/utils/supabase/server';
import Projects from './components/projects';
import CreateProjectButton from './components/create_project_button';

export default async function ProjectsPage() {
    const supabase = await createClient();
    const { data: projects, error } = await supabase.from('Project').select('id, name');

    if (error) {
        return (
            <div className="p-6">
                <p className="text-red-600">読み込みエラー: {error.message}</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-slate-900">プロジェクト一覧</h1>
                <CreateProjectButton />
            </div>
            <Projects projects={projects ?? []} />
        </div>
    );
}
