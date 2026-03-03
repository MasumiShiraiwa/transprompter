import Layout from './components/layout';
import fs from 'fs';
import path from 'path';
import { createClient } from '@/app/utils/supabase/server';

export default async function Controller({project_id, project_name, performers_list}) {

    return (
        <div>
            <Layout project_id={project_id} performers_list={performers_list} />
        </div>
    )
}