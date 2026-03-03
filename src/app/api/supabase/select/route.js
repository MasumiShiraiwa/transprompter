import { createClient } from '@/app/utils/supabase/server';
import { NextResponse } from 'next/server';

// request
// {
//     "table": "",
//     "columns": ["column_name1", "column_name2"],
//     "where": {
//         "column_name": "value"
//     }
// }


export async function POST(request) {
    const { table, columns, where } = await request.json();
    console.log("table", table, "column", columns, "where", where);
    const supabase = await createClient();
    const { data, error } = await supabase.from(table).select("text, group").eq("tab_id", where.tab_id);
    if (error) {
        console.error("Failed to select data", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Select completed successfully", data: data }, { status: 200 });


}