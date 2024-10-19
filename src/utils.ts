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

export function mark({re,text}:{
  re:RegExp|null
  text:string
}){
  function concat(words:string[]){
    function f(x:string,i:number){
        if (i%2===0)
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
  const words=split(re,text)
  return concat(words)
}
type Atom=string|boolean|number|undefined
export type s2s=Record<string,Atom>
function render_td(a:Atom){
  if (a==null)
    return "<td class='undef'> </td>"
  if (a===true)
    return '<td class=true>true</td>'
  return `<td>${a}</td>`
}
export function render_table2(
  data:readonly s2s[],
){
  function render_row(row:s2s){
    const tds=Object.values(row).map(render_td).join('')
    return `<tr>${tds}</tr>`
  }
  if (data.length===0)
    return '<div class=info>(empty )</div>'
  const first=data[0]!
  const body=data.map(render_row).join('\n')
  const head=Object.keys(first).map(v=>`<th>${v}</th>`).join('')
  const ans=`<table>
  <tr>${head}</tr>
  ${body}
  </table>`
  return ans
}
