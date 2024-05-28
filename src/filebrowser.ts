
import { promises as fs } from 'fs';
import express,{Request, Response } from 'express';
import {formatBytes,timeSince} from './utils'
import session from 'express-session';
import {encode} from 'html-entities'
// @ts-ignore //is there a better way to import untyped?
import style from './style.css'
// @ts-ignore
import varlog from 'varlog';
import path from 'node:path'
const {posix}=path
const the_dir_name='/'//__dirname
function to_posix(url:string){
  const ans1=url.split(path.sep)
  const ans2=ans1.join(posix.sep);
  return ans2
}
const HOME_ICON=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="2" width="12" height="8" rx="1" ry="1" fill="#87CEEB" stroke="#4682B4" stroke-width="1"/>
<rect x="5" y="11" width="6" height="1" fill="#4682B4"/>
<rect x="4" y="12" width="8" height="2" rx="1" ry="1" fill="#4682B4"/>
<circle cx="8" cy="13" r="0.5" fill="#FFFFFF"/>
<text x="8" y="7" font-family="Arial" font-size="5" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">/</text>
</svg>`
const posix_dir_name=to_posix(the_dir_name)
const root_dir=posix_dir_name
console.log({root_dir,the_dir_name,__dirname,posix_dir_name})

const app = express();
const port = 80
const host =process.env.HOST||'0.0.0.0'

app.use(express.static('static'))
app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
app.use(express.static('media')) 
function render_error(ex:any):string{
  return ex.toString().split(/:|,/)[2] 
}

async function mystats({parent_absolute,base}:{ //absolute_path is a directory
  parent_absolute:string,
  base:string
}){
  const absolute=posix.join(parent_absolute,base)
  const relative=posix.relative(root_dir,absolute) //is this needed?
  try{
    const stats = await fs.stat(absolute);
    const is_dir=stats.isDirectory()
    return {base,absolute,relative,...stats,is_dir,error:null}
  }catch(ex){
    return {base,absolute,relative,error:render_error(ex),is_dir:undefined}
  } 
}
export type MyStats = Awaited<ReturnType<typeof mystats>>
async function get_files({parent_absolute}:{parent_absolute:string}){
  const files=await fs.readdir(parent_absolute)
  return await Promise.all(files.map(base=>mystats({parent_absolute,base}))) //thank you https://stackoverflow.com/a/40140562/39939
}
function encode_path(absolute:string){
  console.log({absolute})
  const legs=posix.normalize(absolute).split('/').filter(Boolean)
  const ans= '/'+legs.map(encodeURI).join('/') //coulnt find any node api that does this
  return ans
}
function render_row(stats:MyStats,cur_time:number){
  const {base,error,relative,is_dir}=stats
  const icon=function(){
    if (error!=null)
      return '&#x274C;'
    return is_dir?'&#128193;':'&#128462;'
  }()  
  const file_name=function (){
    return `<td>
      <div class=filename>
        <div class=icon>${icon}</div>
        <a href=${encode_path(relative)}> ${encode(base)}
      </div>
    </td>`
  }()
  if (error!=null){
    return `<tr> ${file_name}
      <td>${encode(error)}</td>
      <td></td>
      <td></td>
    </tr>`
  }
  const {size,mtimeMs}=stats
  const the_time_since=timeSince(cur_time-mtimeMs)
  if (is_dir){
    return `<tr>
      ${file_name}
      <td></td>
      <td></td>
      <td>${the_time_since}<td>
    </tr>`
  }

  return `<tr>
    ${file_name}
    <td></td>
    <td>${formatBytes(size)}</td>
    <td>${the_time_since}</td>
  </tr>`
} 
function  render_table(stats:MyStats[]){
  const cur_time=Date.now()
  const rows=stats.map(stats=>render_row(stats,cur_time)).join('\n')
  return `<table>
  <tr>
    <th>filename</th>
    <th></th>
    <th>size</th>
    <th>changed</th>
  <tr>
    ${rows}
  </table>`
}
function logit(x:any){
  return ''//varlog.css+varlog.dump('logit',x,4)
}
function render_leg(absolute:string,base:string,extra_icon=''){
  return `<a href=${encode_path(absolute)}>${encode(base)+extra_icon}</a>`
}
function render_breadcrumbs(absolute_path:string){
  const ans:string[]=[]
  var acum=''
  for (const leg of absolute_path.split('/')){
    acum+=leg+'/'
    const render=function(){
      const the_acum=acum
      const the_leg=leg
      if (acum==the_dir_name)
        return render_leg(acum,leg,HOME_ICON)
      if (acum.startsWith(root_dir))
        return render_leg(acum,leg)
      return `<div class=inactive>leg</div>`
    }()
    ans.push(render)
  }
  return ans.join(' / ')
}
async  function get(req:Request, res:Response){
  const {url}=req
  const parent_absolute=posix.join(root_dir,url)
  const parent_relative=posix.relative(root_dir,parent_absolute)
  var fields={
      parent_absolute,
      root:root_dir,
      parent_relative,
      url
    }
try{
    const stats=await get_files({parent_absolute})
    const table=render_table(stats)
    const content=`
  <html>
    <style>${style}</style>
    ${render_breadcrumbs(parent_absolute)} 
    ${logit({fields,stats})}
    ${table},
  </html>`
    res.send(content)
  }catch(ex){
    //looks unstable
    const content=`<html> 
    <style>${style}</style>
    ${logit(fields)},
    <div class=error>${render_error(ex)}</div>
  </html>`    
    res.end(content)
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
async function run_app() {
  await app.listen(port,host)
  console.log(`started server at port=${port},host=${host}`)
}

run_app()
