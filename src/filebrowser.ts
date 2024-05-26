
import { promises as fs } from 'fs';
import express,{Request, Response } from 'express';
import {formatBytes,timeSince} from './utils'
import session from 'express-session';
//import varlog from 'varlog';

const app = express();
const port = 80
const host =process.env.HOST||'0.0.0.0'

app.use(express.static('static'))
app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
async function mystats(filepath:string){
  const stats = await fs.stat(filepath);
  return {...stats,filepath}
}
type MyStats = Awaited<ReturnType<typeof mystats>>
async function get_files(dir:string){
  const files=await fs.readdir(dir)
  return await Promise.all(files.map(mystats)) //thank you https://stackoverflow.com/a/40140562/39939
}
function format_row(stats:MyStats){
  const {filepath,size,mtimeMs}=stats
  const sizef=formatBytes(size)
  const mtimeMsf=timeSince(mtimeMs)
  return `<tr><td>${filepath}</td><td>${sizef}</td><td>${mtimeMsf}</td></tr>`
}
function  format_table(stats:MyStats[]){
  const rows=stats.map(format_row).join('\n')
  return `<table><tr>
    <th>filename</th>
    <th>size</th>
    <th>last changed</th>
    <tr>
    ${rows}
    </table>`
}

app.get('/get/:path',async  function get(req:Request, res:Response){
  var filepath='initd'
  try{
    filepath = req.params['path'] as  string
    const stats=await get_files(filepath)
    console.log(typeof stats)
    const content=format_table(stats)
    res.send(content)
  }catch(ex){
    res.send(filepath)
    res.send(ex+'')
  }
})
async function run_app() {
  await app.listen(port,host)
  console.log(`started server at port=${port},host=${host}`)
}

run_app()
