import { NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';


export async function POST(request){
    const {table, data} = await request.json();
    console.log("table", table, "data", data);
    const supabase = await createClient();
    const { data: updatedData, error: updateError } = await supabase.from(table).update(data).eq('id', data.id);
    if(updateError){
        console.error("Failed to update data", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
    return NextResponse.json({ message: "Data updated successfully", data: updatedData }, { status: 200 });
}