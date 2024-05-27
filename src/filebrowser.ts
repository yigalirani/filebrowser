
import { promises as fs } from 'fs';
import express,{Request, Response } from 'express';
import {formatBytes,timeSince} from './utils'
import session from 'express-session';
import {encode} from 'html-entities'

// @ts-ignore
import varlog from 'varlog';

const app = express();
const port = 80
const host =process.env.HOST||'0.0.0.0'

app.use(express.static('static'))
app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
async function mystats(dir:string,filepath:string){
  try{
    const fullpath=(dir+'/'+filepath).replace('//','/')
    console.log(fullpath)
    const stats = await fs.stat(fullpath);
    const is_dir=stats.isDirectory()
    return {filepath,...stats,is_dir}
  }catch(error){
    return {filepath,error:error+''}
  } 
}
export type MyStats = Awaited<ReturnType<typeof mystats>>
async function get_files(dir:string){
  const files=await fs.readdir(dir)
  return await Promise.all(files.map(file=>mystats(dir,file))) //thank you https://stackoverflow.com/a/40140562/39939
}
function format_row(stats:MyStats){
  const {filepath,error}=stats
  const encoded_filepath=encode(filepath)
  const encoded_error=encode(error)
  if (error!=undefined){
    return `<tr><td>${encoded_filepath}</td><td td colspan=2>${encoded_error}</td></tr>`
  }
  const {size,mtimeMs,is_dir}=stats
  if (is_dir){ 
    return `<tr><td colspan=3><a href='/${encoded_filepath}'>${encoded_filepath}</a></td><td></tr>`
  }
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
async  function get(req:Request, res:Response){
  const {url}=req
  /*res.end(
    varlog.css+
    '<h1>get</h1>'+
    varlog.dum1p('req',req,4)//2 refers to depth, default is 3
    //varlog.dump('res',res)
  )  
  return(*/
  const filepath = url//req.params['path']||'.' as  string
  console.log('get',filepath)
try{
    const stats=await get_files(filepath)
    console.log(typeof stats)
    const content=format_table(stats)
    res.send(content)
  }catch(ex){
    res.end(ex+''+filepath)
    //res.send()
  }
}
app.get('/login',function get(req:Request, res:Response){
  res.end(
    '<h1>login</h1>'+
    varlog.css+
    varlog.dump('req',req,4)+//2 refers to depth, default is 3
    varlog.dump('res',res)
  )  
})
app.get('*',get) 
//app.get('/',get) 
///app.get('/',get)
async function run_app() {
  await app.listen(port,host)
  console.log(`started server at port=${port},host=${host}`)
}

run_app()
