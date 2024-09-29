import path from 'node:path'
import {RenderData,LegType} from './types'
const {posix}=path
export function timeSince(ago_time:number) {
  const cur_time = new Date().getTime()
  const ms=cur_time-ago_time  
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
  // Get the Unix timestamp in milliseconds and convert it to seconds
  return timeSince(ago_time);
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
export type s2any=Record<string,any>
type RowRenderFunc=(row:s2any,name:string)=>string
type ColDef=RenderFunc|{
  f?:RenderFunc,
  row_f?:RowRenderFunc,
  title?:string
}
function call_def(coldef: ColDef, row:s2any,name:string) {
  if (typeof coldef === 'function'){
    const a=row[name]
    return coldef(a)
  }
  const {f,row_f}=coldef
  if (row_f!=null)
    return row_f(row,name)
  const a=row[name]
  if (f!=null){
    return f(a)
  }
  return a
}
function get_title(name:string,coldef: ColDef){
  if (typeof coldef === 'function'){
    return name
  }  
  return coldef.title||name
}
export function id(a:any){
  if (a==null)
    return ''
  return a+''
}
export function bool(a:boolean){
  if (a==true)
    return '<div class=true>true</div>'
  return 'false'
}
export function mark({re,text}:{
  re:RegExp|null
  text:string
}){
  function concat(words:string[]){
    function f(x:string,i:number){
        if (i%2==0)
            return x
        return `<b>${x}</b>`
    }
    return words.map(f)
  }
  function split(re:RegExp,value:string){
    if (!re)
        return [value]
    return (value+'').split(re)
  }  
  if (re==null||text==null)
    return text
  var words=split(re,text)
  return concat(words)
}
type COLS=Record<string,ColDef>
export function render_table2<T extends s2any>(data:readonly T[],col_defs:COLS){
  function render_row(row:T){
    const cols=Object.entries(col_defs).map(([name,col_def])=>`<td>${call_def(col_def,row,name)}</td>`)
    const ans=`<tr>${cols.join('\n')}</tr>`
    return ans
  }
  if (data.length==0)
    return '<div class=info>(empty )</div>'
  const body=data.map(render_row).join('\n')
  const head=Object.entries(col_defs).map(([name,col_def])=>`<th>${get_title(name,col_def)}</th>`).join('\n')
  const ans=`<table>
  <tr>${head}</tr>
  ${body}
  </table>`
  return ans
}
