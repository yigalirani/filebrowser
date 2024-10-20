import path from 'node:path'
import {RenderData,LegType} from './types'
const {posix}=path
export function timeSince(ago_time:number|undefined) {
  if (ago_time==null)
    return undefined
  const cur_time = Date.now()
  const ms=cur_time-ago_time  
  const seconds = Math.floor(ms / 1000);
  let interval = seconds / 31536000;
  function render_ago(unit:string){
    const floored_interval=Math.floor(interval)
    if (floored_interval===0)
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
  /*if (!isString(dateString))
    return
  */
  const ago_time = new Date(dateString).getTime();
  // Get the Unix timestamp in milliseconds and convert it to seconds
  return timeSince(ago_time);
}
export function formatBytes(bytes: number|undefined): string|undefined {
  if (bytes==null)
    return undefined
  const decimals = 2
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
export function get_error(ex: Error): string {
  //if (!ex) return 'Unknown error';
  const message = ex.message || ex.toString();
  return message.trim();
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
interface Leg{
  leg:string
  leg_type:LegType
}
export function parse_path_root(render_data:RenderData){
  const {parent_absolute,root_dir}=render_data
  const ans:Leg[]=[]
  const parent_absolute_legs=get_legs(parent_absolute)
  const root_dir_legs=get_legs(root_dir)
  for (let i=0;i<parent_absolute_legs.length;i++){
    const leg=parent_absolute_legs[i]!
    if (parent_absolute_legs[i]!==root_dir_legs[i]&&root_dir_legs[i]!=null){
      console.warn('path dot not extend root')
      return
    }
    const leg_type=function(){
      if (i+1===root_dir_legs.length)
        return LegType.Home
      if (i+1>root_dir_legs.length)
        return LegType.Regular
      return LegType.Gray
    }()
    ans.push({leg,leg_type})
  }
  return ans
}
type Atom=string|boolean|number|undefined|string[]

export type s2s=Record<string,Atom>
export type s2any=Record<string,unknown>
function render_td(a:Atom){
  if (a==null)
    return "<td class='undef'> </td>"
  if (a===true)
    return '<td class=true>true</td>'
  return `<td>${a}</td>`
}
function render_href(options:s2any){
  const ans:string[]=[]
  for (const[k,v] of Object.entries(options))
    if (v!=null && v!=='')
      ans.push(`${k}=${v}`)
  if (ans.length===0)
    return ''
  return '?'+ans.join('&')
}
export function render_table2(
  render_data:RenderData,
  data:readonly s2s[],
  sortable=true
){
  const {asc:old_asc,sort:old_sort,filter}=render_data.req.query
  const first=data[0]!
  function render_title(col:string){
    if (!sortable){
      return `<th>${col}</th>`
    }
    const asc=( old_sort===col)&&!JSON.parse(old_asc+'')
    const href=render_href({asc,sort:col,filter})
    const icon=function(){
      if (col!==old_sort)
        return ''
      return asc?'▲':'▼'
    }()
    return `<th>${icon}<a href='${href}'>${col}</th>`
  }  
  function render_row(row:s2s){
    const tds=Object.values(row).map(render_td).join('')
    return `<tr>${tds}</tr>`
  }
  if (data.length===0)
    return '<div class=info>(empty )</div>'
  const body=data.map(render_row).join('\n')
  const head=Object.keys(first).map(render_title).join('')
  const ans=`<table>
  <tr>${head}</tr>
  ${body}
  </table>`
  return ans
}
