import path from 'node:path'
import { Request} from 'express';
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
  return message.split(',')[0]!.trim();
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
type Atom=string|boolean|number|string[]


export function nl<T>(value: T | null | undefined): T {
  //todo:check only active on debug mode
  //return value
  if (value === null || value === undefined) {
    throw new Error('Value cannot be null or undefined')
  }
  return value
}
export type s2s=Record<string,Atom>
export type s2any=Record<string,unknown>
export function pk<T,K extends keyof T>(obj:T,...keys:K[]):Pick<T,K> {
  //taken from https://stackoverflow.com/a/47232883/39939
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const ret:any={};
  keys.forEach(key=> {
    ret[key]=obj[key];
  }) 
  return ret;
}
export function render_fields<T,K extends keyof T>  (obj:T,...fields:K[]){
  const ans:string[]=[]
  for (const field of fields){
    const value=obj[field]  
    if ( value!= null) {
      ans.push(`<tr><td>${String(field)}</td><td>${value}</td></tr>`) ;
    }
  }
  if (ans.length==0)
    return ''
  return `<table class=fieldstable>${ans.join('\n')}</table>`
}
export function isAtom(x: unknown): x is Atom {
  if (x == null) return false
  return ['number', 'string', 'boolean'].includes(typeof x)
}
type DataCell={
  x?       : Atom, //for filtering amd sorting
  content? : string,
  href?    : string,
  icon?    : string
}|Atom


function calc_content(a:DataCell){
  if (a==null)
    return undefined
  if (isAtom(a))
    return a
  const {x,content,href,icon}=a
  if (content!=null)
    return content
  let ans=''
  if (href!=null){
    ans=`<a href='${href}'>${x}</a>` 
  }else
    ans=x+''
  return icon?`<div class=icon>${icon}</div>${ans}`:ans
}
function calc_x(a:DataCell){
  if (isAtom(a))
    return a
  return a.x
}

function render_td(a:DataCell|undefined){
  const content=calc_content(a)   
  if (content==null)
    return "<td class='undef'> </td>"

  return `<td>${content}</td>`
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
  req:Request,
  data:readonly s2s[],
  sortable=true
){
  const {asc:old_asc,sort:old_sort,filter}=req.query
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
  const head=Object.keys(first).map(render_title).join('')
    
  function render_row(row:s2s,i:number){
    const tds=Object.values(row).map(render_td).join('')
    return `<tr><td>${i+1}</td>${tds}</tr>`
  }
  if (data.length===0)
    return '<div class=info>(empty )</div>'

  const body=data.map(render_row).join('\n')

  const ans=`<table>
  <tr><th></th>${head}</tr>
  ${body}
  </table>`
  return ans
}
type DataRow=Record<string,DataCell>
export type DataTable=DataRow[]

export function sortArrayByField<T>(array:  DataTable, req:Request) {
  // If fieldName is null, return the array without sorting
  const {sort,asc}=req.query
  if (sort == null) {
      return array;
  }
  const sort_fiels=sort+''as keyof T
  const mult=asc === 'false' ? -1 : 1;
  return array.sort((a, b) => {
      const fieldA = calc_x(a[sort_fiels]);
      const fieldB = calc_x(b[sort_fiels]);
      if (fieldA == fieldB)
        return 0
      if (fieldA==null) 
        return mult
      if (fieldB==null) 
        return mult*-1     
      if (fieldA > fieldB) 
        return mult
      return mult*-1
  });
}


export function filter_it(ar:DataTable,re:RegExp|null,...fields:string[]){
  if (re==null||ar.length===0)
    return ar
  const ans:DataTable=[]
  for (const row of ar)
    for (const field of fields){
      const cell=row[field]
      const x=calc_x(cell)
      if (x==null || re.test(x+''))
        ans.push(row)
    }
  return ans
}
type FlexBool=boolean|string[]
function flex_bool(value: FlexBool, col: string){
  if (typeof value==='boolean')
    return value
  return value.includes(col)
  
}
export function render_table3({
  req,
  body,
  sortable=true,
  filterable=true,
}:{
  req:Request,
  body:DataTable,
  sortable?:FlexBool,
  filterable?:FlexBool,

}){
  const {asc:old_asc,sort:old_sort,filter}=req.query
  const first=body[0]!
  function render_title(col:string){
    if (!flex_bool(sortable,col)){
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
  const re=filter&&new RegExp(`(${filter})`, 'i')||null  

  sortArrayByField(body,req)
  const filtered_fields=function(){
    if (filterable===true)
      return Object.keys(first)
    if (filterable===false)
      return []
    return filterable
  }()
  const filtered=filter_it(body,re,...filtered_fields)
  if (filtered.length===0)
    return '<div class=info>(empty )</div>'
  const head=Object.keys(first).map(render_title).join('')  
  function render_row(row:DataRow,i:number){
    const tds=Object.values(row).map(render_td).join('')
    return `<tr><td>${i+1}</td>${tds}</tr>`
  }
  const rendered=filtered.map(render_row).join('\n')

  const ans=`<table>
  <tr><th></th>${head}</tr>
  ${rendered}
  </table>`
  return ans

}