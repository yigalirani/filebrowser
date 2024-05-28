import {formatBytes,timeSince,encode_path} from './utils'
import {encode} from 'html-entities'
// @ts-ignore //is there a better way to import untyped?
import style from './style.css'
export interface RenderData{
  fields:any
  parent_absolute:string
  root_dir:string
}
export type MyStats={
  is_dir: boolean;
  error: null;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
  base: string;
  absolute: string;
  relative: string;
} | {
  base: string;
  absolute: string;
  relative: string;
  error: string;
  is_dir: undefined;
}

const HOME_ICON=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect x="2" y="2" width="12" height="8" rx="1" ry="1" fill="#87CEEB" stroke="#4682B4" stroke-width="1"/>
<rect x="5" y="11" width="6" height="1" fill="#4682B4"/>
<rect x="4" y="12" width="8" height="2" rx="1" ry="1" fill="#4682B4"/>
<circle cx="8" cy="13" r="0.5" fill="#FFFFFF"/>
<text x="8" y="7" font-family="Arial" font-size="5" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">/</text>
</svg>`

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
  if (rows.length==0)
    return '<div class=info>(empty directory)</div>'
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
export function logit(_x:any){
  return ''//varlog.css+varlog.dump('logit',x,4)
}
function render_leg(absolute:string,base:string,extra_icon=''){
  return `<a href=${encode_path(absolute)}>${encode(base)+extra_icon}</a>`
}
function render_breadcrumbs(render_data:RenderData){
  const {parent_absolute,root_dir}=render_data
  const ans:string[]=[]
  var acum=''
  for (const leg of parent_absolute.split('/')){
    acum+=leg+'/'
    const render=function(){
      if (acum==root_dir)
        return render_leg(acum,leg,HOME_ICON)
      if (acum.startsWith(root_dir))
        return render_leg(acum,leg)
      return `<div class=inactive>leg</div>`
    }()
    ans.push(render)
  }
  return ans.join(' / ')
}
export function render_page(center:string,render_data:RenderData){
  const {fields}=render_data
  const content=`
<html>
  <style>${style}</style>
  ${render_breadcrumbs(render_data)} 
  ${logit({fields})}
  ${center},
</html>`
  return content
}
export function render_table_page(stats:MyStats[],render_data:RenderData){
  const center=render_table(stats)
  return render_page(center,render_data)
}

export function render_error_page(error:string,render_data:RenderData){
  const center=`<div class=error>${error}</div>`
  return render_page(center,render_data)
}
export function render_image(render_data:RenderData){
  const {parent_absolute}=render_data
  return render_page(`<br><img src='/static${parent_absolute}'>`,render_data)
}
export function render_txt(txt:string,render_data:RenderData){
  const encoded_txt=encode(txt)
  return render_page(`<pre>${encoded_txt}</pre>`,render_data)
}