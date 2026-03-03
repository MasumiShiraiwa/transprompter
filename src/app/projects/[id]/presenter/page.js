import { createClient } from '@/app/utils/supabase/server';
import Presenter from '@/app/presenter/page';

export default async function ProjectDetailPage({ params }) {
    const { id: project_id } = await params;
    const supabase = await createClient();
    const { data: project, error: project_error } = await supabase.from('Project').select('id, name').eq('id', project_id);
    let {data: performers_list, error: performers_error} = await supabase.from('Performer').select('id, name').eq('project_id', project_id);
    
    console.log("project", project, "performers_list", performers_list);
    if(!project){
        return (
            <div>
                <p className="text-red-600">プロジェクトが見つかりません</p>
            </div>
        );
    }
    if (project_error || performers_error) {
        return (
            <div>
                <p className="text-red-600">読み込みエラー: {project_error.message || performers_error.message}</p>
            </div>
        );
    }
    performers_list = performers_list.map(item => item.name);
    console.log("performers_list", performers_list, typeof performers_list);

    return (
        <div>
            <Presenter project_id={project_id} performers_list={performers_list} />
        </div>
    );
}
