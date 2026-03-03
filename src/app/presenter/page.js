import Layout from './components/layout';
import fs from 'fs';
import path from 'path';

export default function Presenter({ project_id, performers_list }) {

    return (
        <div>
            <Layout project_id={project_id} performers_list={performers_list} />
        </div>
    )
}