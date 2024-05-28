
import { promises as fs } from 'fs';
import express,{Request, Response } from 'express';
import {formatBytes,timeSince} from './utils'
import session from 'express-session';
import {encode} from 'html-entities'
// @ts-ignore //is there a better way to import untyped 
import style from './style.css'
// @ts-ignore
import varlog from 'varlog';
import path from 'node:path'
/*
teminology 
* __dirname The directory name of the current module. 
* base      last leg of a path
* relative  full path relative to the _dir_name
* absolute full path relative to to / can be either path or file
* absolute_path 
* absolute_file
*/
const app = express();
const port = 80
const host =process.env.HOST||'0.0.0.0'

app.use(express.static('static'))
app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
app.use(express.static('media')) 
async function mystats({parent_absolute,base}:{ //absolute_path is a directory
  parent_absolute:string,
  base:string
}){
  const absolute=path.join(parent_absolute,base)
  const relative=path.relative(__dirname,absolute) // will this throw?
  try{
    
    //console.log(fullpath)
    const stats = await fs.stat(absolute);
    const is_dir=stats.isDirectory()
    return {base,absolute,relative,...stats,is_dir}
  }catch(error){
    return {base,absolute,relative,error:error+''}
  } 
}
export type MyStats = Awaited<ReturnType<typeof mystats>>
async function get_files({parent_absolute}:{parent_absolute:string}){
  const files=await fs.readdir(parent_absolute)
  return await Promise.all(files.map(base=>mystats({parent_absolute,base}))) //thank you https://stackoverflow.com/a/40140562/39939
}
function format_row(stats:MyStats){
  const {relative,base,error}=stats
  if (error!=undefined){
    return `<tr>
      <td class=filename>
        <div class=icon>&#128462;</div>
        ${encode(base)}
      </td>
      <td colspan=2>${encode(error)}</td>
    </tr>`
  }
  const {size,mtimeMs,is_dir}=stats
  if (is_dir){
    return `<tr>
      <td class=filename>
        <div class=icon>&#128193;</div>
        <a href='/${encode(relative)}'>${encode(base)}</a>
      </td>
      <td></td>
      <td>${timeSince(mtimeMs)}<td>
    </tr>`
  }

  return `<tr>
    <td class=filename>
      <div class=icon>&#128462;</div>
      ${encode(base)}
    </td>
    <td>${formatBytes(size)}</td>
    <td>${timeSince(mtimeMs)}</td>
  </tr>`
} 
function  format_table(stats:MyStats[]){
  const rows=stats.map(stats=>format_row(stats)).join('\n')
  return `<table>
  <tr>
    <th>filename</th>
    <th>size</th>
    <th>last changed</th>
  <tr>
    ${rows}
  </table>`
}
function logit(x:any){
  return ''//varlog.css+varlog.dump('logit',x)
}
async  function get(req:Request, res:Response){
  const {url}=req
  const parent_absolute=path.join(__dirname,url)
  const parent_relative=path.relative(__dirname,parent_absolute)
  var fields={
      parent_absolute,
      __dirname,
      parent_relative,
      url
    }
  

try{
    const stats=await get_files({parent_absolute})
    const table=format_table(stats)
    const content=`
  <html>
    <style>${style}</style>
    <h1>${parent_relative}</h1>  
    ${logit({fields,stats})},
    ${table},
  </html>`
    res.send(content)
  }catch(ex){
    const content=`<html>
    <style>${style}</style>
    ${logit(fields)},
    <div class=error>${ex+''}</div>
  </html>`    
    res.end(content)
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
