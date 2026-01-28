// 定型カンペリストを取得するAPI
import fs from 'fs';
import path from 'path';

export async function GET() {
    try{
        const filePath = path.join(process.cwd(), 'src', 'scripts', 'template_list.json');
        const data = fs.readFileSync(filePath, 'utf8');
        const data_list = JSON.parse(data);
        let template_list = [];
        for(let item of data_list){
            template_list.push({id: item.id, name: item.name, content: item.content.replace(/ /g, '_')});
        }
        return Response.json({ template_list: template_list }, { status: 200 });
    }catch(error){
        console.error(error);
        return Response.json({ message: "Failed to get template list", error: String(error) }, { status: 500 });
    }
}