import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
// import { formidable } from 'formidable';

const convretTableToArray = (table) => {
  if(typeof table !== 'string') {return null;}

  const lines = table.split("</tr>");

}

export async function POST(request) {
    const formData = await request.formData();
    const file = formData.get('file');
    // console.log("file: ", file);
    // console.log("file: ", typeof file);
    // console.log("file: ", file.arrayBuffer());
    const data = await file.arrayBuffer();
    const buffer = Buffer.from(data);
    // console.log("buffer: ", buffer);
    // console.log("buffer: ", typeof buffer);
    
    // const result = await mammoth.extractRawText({ buffer });
    // console.log(result);
    // console.log(result.value, result.value.length, result.value[1], typeof result.value[1]);
    // console.log(result.messages)

    console.log("HTML converting")
    const html = await mammoth.convertToHtml({ buffer });
    console.log(html, typeof html.value);

    return NextResponse.json({ message: "File uploaded successfully", data: {html: html.value} }, { status: 200 });
}