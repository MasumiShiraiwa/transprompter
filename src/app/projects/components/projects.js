'use client';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Projects({ projects }) {
    const router = useRouter();
    const [selectedProject, setSelectedProject] = useState(null);

    const handleCreateNew = async () => {
        // TODO: 新規作成機能を実装
        console.log('新規プロジェクト作成');
        let today = new Date();
        const new_project_name = '新規プロジェクト' + today.getFullYear() + "/" +('00' +  today.getMonth()).slice(-2) + "/" +('00' +  today.getDate()).slice(-2);
        try{
            const data = await fetch('/api/supabase/insert', {
                method: 'POST',
                body: JSON.stringify({ table: 'Project', data: [{ name: new_project_name }] }),
            })
            const data_json = await data.json();
            if(data_json.error){
                console.error("Failed to create new project", data_json.error);
                return;
            }
            const project_id = data_json.data[0].id;
            router.push(`/projects/${project_id}/editor`);

        } catch (error) {
            console.error("Failed to create new project", error);
        }

    };

    if (!projects || projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <p className="text-gray-500 mb-6">プロジェクトがありません。</p>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span className="font-medium">新規プロジェクトを作成</span>
                </button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project, index) => (
                <Link
                    key={project.id ?? index}
                    href={`/projects/${project.id}/editor`}
                    className="group relative block p-6 bg-white border-2 border-slate-200 rounded-lg hover:border-slate-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                    <div className="flex items-center justify-center h-full min-h-[120px]">
                        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-slate-900 transition-colors">
                            {project.name}
                        </h3>
                    </div>
                </Link>
            ))}
            
            {/* 新規作成用のプラスボタンカード */}
            <button
                onClick={handleCreateNew}
                className="group relative block p-6 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 hover:bg-slate-100 transition-all duration-200 cursor-pointer min-h-[120px] flex items-center justify-center"
            >
                <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                        className="w-12 h-12 text-slate-400 group-hover:text-slate-600 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                        新規作成
                    </span>
                </div>
            </button>
        </div>
    );
}
