import path from 'node:path'
import {RenderData,LegType} from './types'

const {posix}=path

export function timeSince(ms:number) {
  var seconds = Math.floor(ms / 1000);
  var interval = seconds / 31536000;
  function render_ago(unit:string){
    const floored_interval=Math.floor(interval)
    if (floored_interval==0)
      return floored_interval+' '+unit
    return floored_interval+' '+unit+'s'
  }
  if (interval >= 2)
    return render_ago('year');
  interval = seconds / 2592000;
  if (interval >= 2) 
    return render_ago('month');
  interval = seconds / 86400;
  if (interval >= 1) 
    return render_ago('day');
  interval = seconds / 3600;
  if (interval > 1) 
    return render_ago('hour')
  interval = seconds / 60;
  if (interval > 1) 
    return render_ago('minute')
  interval = seconds
  return render_ago('second')
}
export function date_to_timesince(dateString: string) {
  // Parse the date string to a Date object
  const ago_time = new Date(dateString).getTime();
  const cur_time = new Date().getTime()
  const diff=cur_time-ago_time
  // Get the Unix timestamp in milliseconds and convert it to seconds

  return timeSince(diff);
}
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];
  const formattedBytes = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${formattedBytes} ${size}`;
} 
export function encode_path(absolute:string){
  //console.log({absolute})
  const legs=posix.normalize(absolute).split('/').filter(Boolean)
  const ans= '/'+legs.map(encodeURI).join('/') //coulnt find any node api that does this
  return ans
}
export function to_posix(url:string){
  const ans1=url.split(path.sep)
  const ans2=ans1.join(posix.sep);
  return ans2
}

export function get_error(ex:any):string{
  return ex.toString().split(/:|,/)[2] 
}
function get_legs(path:string){
  return ['',...path.split('/').filter(Boolean)]
}

/*interface PathLeg{
  leg:string
  leg_type:LegType
}*/



//const langs=hljs.listLanguages()
//console.log('langs',JSON.stringify(langs,null,2))


export function parse_path_root(render_data:RenderData){
  const {parent_absolute,root_dir}=render_data
  const ans=[]
  const parent_absolute_legs=get_legs(parent_absolute)
  const root_dir_legs=get_legs(root_dir)
  for (let i=0;i<parent_absolute_legs.length;i++){
    const leg=parent_absolute_legs[i]!
    if (parent_absolute_legs[i]!=root_dir_legs[i]&&root_dir_legs[i]!=undefined){
      console.warn('path dot not extend root')
      return
    }
    const leg_type=function(){
      if (i+1==root_dir_legs.length)
        return LegType.Home
      if (i+1>root_dir_legs.length)
        return LegType.Regular
      return LegType.Gray
    }()
    ans.push({leg,leg_type})
  }
  return ans
}

type RenderFunc=(a:any)=>string
type ColDef=RenderFunc|{
  f:RenderFunc,
  title:string
}

function call_def(coldef: ColDef, a: any) {
  if (typeof coldef === 'function'){
    return coldef(a)
  }
  return coldef.f(a)
}
function get_title(name:string,coldef: ColDef){
  if (typeof coldef === 'function'){
    return name
  }  
  return coldef.title
}
type s2any=Record<string,any>
type COLS=Record<string,ColDef>
export function render_table2<T extends s2any>(data:readonly T[],col_defs:COLS){
  function render_row(row:T){
    const cols=Object.entries(col_defs).map(([name,col_def])=>`<td>${call_def(col_def,row[name])}</td>`)
    const ans=`<tr>${cols.join('\n')}</tr>`
    return ans
  }
  const body=data.map(render_row).join('\n')
  const head=Object.entries(col_defs).map(([name,col_def])=>`<th>${get_title(name,col_def)}</th>`).join('\n')
  const ans=`<table>
  <tr>${head}</tr>
  ${body}
  </table>`
  
  return ans
}
