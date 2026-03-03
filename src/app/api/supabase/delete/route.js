import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

// request body: { table: string, where: { [column: string]: value } }
// 例: { table: "Performer", where: { project_id: "...", name: "出演者名" } }
export async function POST(request) {
    const { table, where } = await request.json();
    if (!table || !where || typeof where !== 'object') {
        return NextResponse.json(
            { error: 'table and where (object) are required' },
            { status: 400 }
        );
    }
    const supabase = await createClient();
    let query = supabase.from(table).delete();
    for (const [column, value] of Object.entries(where)) {
        query = query.eq(column, value);
    }
    const { error: deleteError } = await query;
    if (deleteError) {
        console.error('Failed to delete data', deleteError);
        return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Data deleted successfully' }, { status: 200 });
}
