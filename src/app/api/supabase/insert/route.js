import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

export async function POST(request) {
    const { table, data } = await request.json();
    const supabase = await createClient();
    const { data: insertedData, error: insertError } = await supabase.from(table).insert(data).select();
    if (insertError) {
        console.error("Failed to insert data", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Data inserted successfully", data: insertedData }, { status: 200 });
}