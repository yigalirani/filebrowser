import { Request} from 'express';
import {encode_path,render_fields} from './utils'
import {LegType,MyStats,RenderData} from './types'
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
export const FILE_ICON=`<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M3 2H10L13 5V14H3V2Z" ></path>
<path d="M10 2V5H13"  ></path>
<line x1="4" y1="6" x2="10" y2="6"  stroke-width="0.5"/>
<line x1="4" y1="8" x2="10" y2="8"  stroke-width="0.5"/>
<line x1="4" y1="10" x2="10" y2="10"  stroke-width="0.5"/>
<line x1="4" y1="12" x2="10" y2="12"  stroke-width="0.5"/>
</svg>
`
export function mark(re:RegExp|null,text:string){
  if (re==null) return text; 
  return text.replace(re, '<b>$1</b>');
}
/*export function render_filename(render_data:RenderData,stats:MyStats){
  const {re}=render_data
  const {filename,error,relative,is_dir}=stats
  const icon=function(){
    if (error!=null)
      return '&#x274C;'
      return is_dir?'&#128193;': FILE_ICON
  }()  
  return`<div class=filename>
        <div class=icon>${icon}</div>
        <a href=/files${encode_path(relative)}>${encode(filename)}
      </div>`
}*/
/*export function render_filename_git(render_data:RenderData,stats:LsTree){
  const {re,parent_relative}=render_data
  const {filename,is_dir}=stats
  const icon=function(){
    return is_dir?'&#128193;': FILE_ICON
  }()  
  return`<div class=filename>
        <div class=icon>${icon}</div>
        <a href=/files${encode_path(parent_relative)}> ${encode(filename)}
      </div>`
}*/
export function render_download(stats:MyStats){
  const {is_dir,relative}=stats
  //if (error!=null)
  //  return `<div class=error_txt>${encode(error)}</div>`
  if (is_dir)
    return ''
  return `<a href="/static/${encode_path(relative)}" download>${DOWNLOAD_ICON}</a>`
}

export function logit(_x:unknown){
  return ''//varlog.css+varlog.dump('logit',x,4)
}
function render_breadcrumbs(render_data:RenderData){
  const {legs,language}=render_data
  const ans:string[]=[]
  let href='/files/'
  for (const {leg,leg_type} of legs!){ //is there a better way than using that asterics to assert non-null?
    if (leg_type===LegType.Regular)
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
  const{is_git,parent_relative,cur_handler,git}=render_data
  if (!is_git)
    return ''
  function make_link(handler:string){
    const class_decor=(cur_handler===handler)?'class=highlited':''
    return `<a ${class_decor} href='/${handler}/${parent_relative}'>${handler}</a>`
  }
  const links=['files','branches','commits','commitdiff','ls'].map(make_link).join('\n')
  return `<div class='info'>
  ${links}
  <div class=gitcommand> ${git.last_command}</div>
  </div>`
}
function get_query_form(req:Request){
  const {filter=''}=req.query
  return `<form class=control method="get">
  <input id=filterInput type="text" name="filter" placeholder="filter" value="${filter}"/>
  <button type="submit">apply</button>
</form>
    <script>
      (function() {
        const input = document.getElementById('filterInput');
        const originalValue = '${filter}';
        input.addEventListener('input', function() {
          this.classList.toggle('changed', this.value !== originalValue);
        });
      })();
    </script>
`
}
const HOME_ICONE=`<link rel="icon" type="image/png" sizes="16x16" href="data:image/png;base64,
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEU0OkArMjhobHEoPUPFEBIu
O0L+AAC2FBZ2JyuNICOfGx7xAwTjCAlCNTvVDA1aLzQ3COjMAAAAVUlEQVQI12NgwAaCDSA0888G
CItjn0szWGBJTVoGSCjWs8TleQCQYV95evdxkFT8Kpe0PLDi5WfKd4LUsN5zS1sKFolt8bwAZrCa
GqNYJAgFDEpQAAAzmxafI4vZWwAAAABJRU5ErkJggg==" />`

export function render_page(center:string,render_data:RenderData){
  const {fields,is_dark,req}=render_data
  const effective_style=is_dark?style_dark:style+styleh
  const content=`
<html>
  <style>${effective_style}</style>
  ${HOME_ICONE}
  ${render_breadcrumbs(render_data)} 
  ${render_fields(render_data,'commit','commit2')} 
  ${render_git_swithcer(render_data)}
  ${get_query_form(req)}
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

}
