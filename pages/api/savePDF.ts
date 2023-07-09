// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from "formidable"
import fs from "fs"
type Data = {
  status: string
}

export const config = {
    api: {
        bodyParser: false,
        sizeLimit: "20mb"
        
    }
}

const saveFile = async (file: any) => {
    const data =  fs.readFileSync(file.filepath);
    try {   
     fs.writeFileSync('./public/file.pdf', data);
    } catch(err) {
        console.log(err)
    }
    fs.unlinkSync(file.filepath);
    return;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
    const form = formidable({});
    form.parse(req, function(err, fields, files) {
        saveFile(files.file);
        res.status(200).json({status: "success"})
    });
}
