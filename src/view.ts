import {formatBytes,timeSince,encode_path,id,render_table2,s2any} from './utils'
import {LegType,MyStats,RenderData} from './types'
import {Stats} from 'fs'
import {encode} from 'html-entities'
import style from './style.css'
import style_dark from './style_dark.css'
import styleh from 'highlight.js/styles/github.css';
//import styleh_dark from 'highlight.js/styles/github-dark.css';
const HOME_ICON=` <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 1L1 7H3V15H6V10H10V15H13V7H15L8 1Z"  stroke-width="1" fill="none"/>
</svg> `
const DOWNLOAD_ICON=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M8 1V11"  stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5 8L8 11L11 8"  stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
<rect x="3" y="13" width="10" height="0.5" />
</svg>`
const FILE_ICON=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 2H10L13 5V14H3V2Z" ></path>
<path d="M10 2V5H13"  ></path>
<line x1="4" y1="6" x2="10" y2="6"  stroke-width="0.5"/>
<line x1="4" y1="8" x2="10" y2="8"  stroke-width="0.5"/>
<line x1="4" y1="10" x2="10" y2="10"  stroke-width="0.5"/>
<line x1="4" y1="12" x2="10" y2="12"  stroke-width="0.5"/>
</svg>
`
const filename=function(render_data:RenderData){
  const {filter}=render_data
  return{
  row_f(stats:s2any){
    const {base,error,relative,is_dir}=stats as MyStats
    const icon=function(){
      if (error!=null)
        return '&#x274C;'
    return is_dir?'&#128193;': FILE_ICON
    }()  
    return`<div class=filename>
          <div class=icon>${icon}</div>
          <a href=/files${encode_path(relative)}> ${filter.mark(encode(base))}
        </div>`
  }
}
}
const download={
  title:' ',
  row_f(stats:s2any){
    const {is_dir,relative,error}=stats as MyStats
    if (error!=undefined)
      return `<div class=error_txt>${encode(error)}</div>`
    if (is_dir)
      return ''
    return `<a href="/static/${encode_path(relative)}" download>${DOWNLOAD_ICON}</a>`
  }
}
function make_row_f(field:keyof Stats,f:(a:any)=>string){
  return {
    row_f(a:s2any){
      const {is_dir,error,stats}=a as MyStats
      if (error||is_dir||stats==null)
        return ''
      return f(stats[field])
    }
  }
}  
export function  render_table(render_data:RenderData,stats:MyStats[]){
  return render_table2(stats,{
    filename:filename(render_data),
    download,
    format  : id,
    size    : make_row_f('size',formatBytes),
    changed : make_row_f('mtimeMs',timeSince)
  })
}
export function logit(_x:any){
  return ''//varlog.css+varlog.dump('logit',x,4)
}
function render_breadcrumbs(render_data:RenderData){
  const {legs,language}=render_data
  const ans=[]
  let href='/files/'
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
  if (language)
    ans.push(`<div class=comment>(${language})</div>`)
  return ans.join('')
}
function render_git_swithcer(render_data:RenderData){
  const{is_git,parent_relative,cur_handler}=render_data
  if (!is_git)
    return ''
  function make_link(handler:string){
    const class_decor=(cur_handler==handler)?'class=highlited':''
    return `<a ${class_decor} href='/${handler}/${parent_relative}'>${handler}</a>`
  }
  const links=['files','branches','commits','commitdiff'].map(make_link).join('\n')
  return `<div class='info'>
  ${links}
  </div>`
}
function render_control(render_data:RenderData){
  const {filter}=render_data
  return filter.get_html()
}
export function render_page(center:string,render_data:RenderData){
  const {fields,is_dark}=render_data
  const effective_style=is_dark?style_dark:style+styleh
  const content=`
<html>
<link rel="icon" type="image/png" sizes="16x16" href="data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEU0OkArMjhobHEoPUPFEBIu
O0L+AAC2FBZ2JyuNICOfGx7xAwTjCAlCNTvVDA1aLzQ3COjMAAAAVUlEQVQI12NgwAaCDSA0888G
CItjn0szWGBJTVoGSCjWs8TleQCQYV95evdxkFT8Kpe0PLDi5WfKd4LUsN5zS1sKFolt8bwAZrCa
GqNYJAgFDEpQAAAzmxafI4vZWwAAAABJRU5ErkJggg==" />
  <style>${effective_style}</style>
  ${render_breadcrumbs(render_data)} 
  ${render_git_swithcer(render_data)}
  ${render_control(render_data)}
  ${logit({fields})}
  ${center}
</html>`
  return content
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
export function render_simple_error_page(message:string,error:Error){
  const is_dark=true //todo: use the value in the config
  const effective_style=is_dark?style_dark:style+styleh  
  const stack=error.stack?.split('\n').map(x=>'<li>'+x).join('\n')||''
  return `<html>
    <style>${effective_style}</style>
   <h1>${message}</h1>
    <h3>${error.message}</h3>
    <ul>${stack}</ul>
  </html>`  
  return 
}