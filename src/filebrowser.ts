
import express, { Request, Response } from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import {get_error,parse_path_root,RenderData} from './utils';
import {guessFileFormat} from './fileformat'
import hljs from 'highlight.js'


import {
  MyStats, 
  logit, 
  render_error_page, 
  render_image, 
  render_page, 
  render_table_page,
} from './view';
import { marked } from 'marked'

import path from 'node:path';
const {posix}=path
const root_dir='/'

const app = express();
const port = 80
const host =process.env.HOST||'0.0.0.0'
app.use(express.static('static'))
app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
app.use(express.static('media')) 

async function mystats({parent_absolute,base}:{ //absolute_path is a directory
  parent_absolute:string,
  base:string
}):Promise<MyStats>{
  const absolute=posix.join(parent_absolute,base)
  const relative=posix.relative(root_dir,absolute) //is this needed?
  const base2=posix.basename(absolute)
  const format= guessFileFormat(base2)
  try{
   
    const stats = await fs.stat(absolute);
    const is_dir=stats.isDirectory()
    
    return {base:base2,format,absolute,relative,...stats,is_dir,error:null}
  }catch(ex){
    return {base,format,absolute,relative,error:get_error(ex),is_dir:undefined}
  } 
}
//export type MyStats = Awaited<ReturnType<typeof mystats>>
async function get_files({parent_absolute}:{parent_absolute:string}){
  const files=await fs.readdir(parent_absolute)
  return await Promise.all(files.map(base=>mystats({parent_absolute,base}))) //thank you https://stackoverflow.com/a/40140562/39939
}

async  function get(req:Request, res:Response){
  const {url}=req
  const decoded_url=decodeURI(url)
  const parent_absolute=posix.join(root_dir,decoded_url)
  const parent_relative=posix.relative(root_dir,parent_absolute)
  var fields={
      parent_absolute,
      root:root_dir,
      parent_relative,
      url,
      decoded_url
    }
  const render_data:RenderData={
    parent_absolute,
    root_dir,
    fields,
    is_dark:true
  }
  render_data.legs=parse_path_root(render_data) //calculated here because on this file (the 'controler') is alowed to redirect
  if (render_data.legs==undefined){
    res.redirect("/")
    return
  }

try{
    const {is_dir,error,base,format}=await mystats({parent_absolute,base:''})
    if (error){
      res.end(render_error_page(error,render_data))
    }
    if (is_dir){
      const stats=await get_files({parent_absolute})
      const content=render_table_page(stats,render_data)
      res.end(content)
      return
    }

    if (format=='image'){
      res.end(render_image(render_data))
      return
    }
    if (format=='video'){
      const content=`<br><video controls>
      <source src="/static/${parent_absolute}" type="video/mp4">
      Your browser does not support the video tag.
    </video>`
      res.end(render_page(content,render_data))
      return
    }

     

    //const format= guessFileFormat(base)
    if (format==null){
      res.end(render_page('<div class=info>unrecogrnized format,todo: render anyway</div>',render_data))
      return
    }
    const txt=await fs.readFile(parent_absolute, 'utf8') 
    if (format=='markdown'){
      res.end(render_page(await marked.parse(txt),render_data))
      return
    }    
    const {value,language}=await hljs.highlight(format,txt)
    render_data.language=language
    res.end(render_page(`<pre>${value}</pre>`,render_data))

  }catch(ex){
    const error=get_error(ex)
    res.end(render_error_page(error,render_data))
  }
}
app.use('/static',express.static('/'))
app.get('/login',function get(req:Request, res:Response){
  res.end(
    '<h1>login</h1>'+logit({req,res})
  )  
})
app.get('*',get) 
async function run_app() {
  await app.listen(port,host)
  console.log(`started server at port=${port},host=${host}`)
}

run_app()
