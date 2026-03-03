// Upstash Redisを使用して、編集権限リストを取得するAPI

import { NextResponse } from 'next/server';
import { getPermissionList } from '@/app/utils/upstash/client';

export async function GET() {
    try{
        const permission_list = await getPermissionList();
        return NextResponse.json({ message: "Get permission list completed successfully", permission_list: permission_list }, { status: 200 });
    }catch(error){
        console.error('Get permission list error:', error);
        return NextResponse.json({ message: "Get permission list failed", error: error.message }, { status: 500 });
    }
}