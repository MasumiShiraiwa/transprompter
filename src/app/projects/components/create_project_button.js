'use client';

import { useRouter } from 'next/navigation';

export default function CreateProjectButton() {
    const router = useRouter();
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

    return (
        <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
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
            <span className="font-medium">新規作成</span>
        </button>
    );
}
