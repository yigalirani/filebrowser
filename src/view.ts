import {LegType,formatBytes,timeSince,encode_path,RenderData} from './utils'
import {encode} from 'html-entities'

import style from './style.css'
import style_dark from './style_dark.css'
import styleh from 'highlight.js/styles/github.css';
import styleh_dark from 'highlight.js/styles/gradient-dark.css';


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

const HOME_ICON=` <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 1L1 7H3V15H6V10H10V15H13V7H15L8 1Z"  stroke-width="1" fill="none"/>
</svg> `
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
    <td><a href="/static/${encode_path(relative)}" download>download</a></td>
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
/*function render_leg(absolute:string,base:string,extra_icon=''){
  return `<a href=${encode_path(absolute)}>${extra_icon}${encode(base)}</a> / `
}*/

function render_breadcrumbs(render_data:RenderData){
  const {legs}=render_data
  const ans=[]
  let href='/'
  for (const {leg,leg_type} of legs!){ //is there a better way than using that asterics to assert non-null?
    if (leg_type==LegType.Regular)
      href+=leg+'/'    
    const render_leg=function(){
      switch(leg_type){
        case LegType.Gray:return `<div class=inactive_leg>${leg} / </div>`
        case LegType.Home:return `<a href='${href}'>${HOME_ICON} ${leg} </a> /`
        case LegType.Regular:return `<a href='${href}'> ${leg} </a> /`
      }
    }()

    ans.push(render_leg)
  }
  return ans.join('')
}
export function render_page(center:string,render_data:RenderData){
  const {fields,is_dark}=render_data
  const effective_style=is_dark?style_dark+styleh_dark:style+styleh

  const content=`
<html>
  <style>${effective_style}</style>
  ${render_breadcrumbs(render_data)} 
  ${logit({fields})}
  ${center}
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