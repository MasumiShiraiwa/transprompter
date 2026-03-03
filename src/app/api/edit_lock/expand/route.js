// Upstash Redisを使用して、編集権限リストを取得するAPI

import { NextResponse } from 'next/server';
import { expandLock } from '@/app/utils/upstash/client';

export async function POST(req) {
    const { userId } = await req.json();
    if(userId === null){
        return NextResponse.json({ message: "Expand lock failed", error: 'userId is required' }, { status: 400 });
    }
    try{
        const result = await expandLock(userId);
        return NextResponse.json({ message: "Expand lock completed successfully", result: result }, { status: 200 });
    }catch(error){
        console.error('Expand lock error:', error);
        return NextResponse.json({ message: "Expand lock failed", error: error.message }, { status: 500 });
    }
}