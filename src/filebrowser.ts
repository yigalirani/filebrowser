
import { promises as fs } from 'fs';
import express,{Request, Response } from 'express';
import {render_page,MyStats,logit,render_error_page,render_table_page} from './view'
import {get_error} from './utils'
import session from 'express-session';
// @ts-ignore
import path from 'node:path'
const {posix}=path
const root_dir='/'

const app = express();
const port = 80
const host =process.env.HOST||'0.0.0.0'

app.use(express.static('static'))
app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
app.use(express.static('media')) 
const image_ext=['jpg','gif','svg','png']
function is_plain(parent_absolute:string){
  const ext=path.extname(parent_absolute).toLowerCase().replace('.','')
  return image_ext.includes(ext)
}
async function mystats({parent_absolute,base}:{ //absolute_path is a directory
  parent_absolute:string,
  base:string
}):Promise<MyStats>{
  const absolute=posix.join(parent_absolute,base)
  const relative=posix.relative(root_dir,absolute) //is this needed?
  try{
    const stats = await fs.stat(absolute);
    const is_dir=stats.isDirectory()
    return {base,absolute,relative,...stats,is_dir,error:null}
  }catch(ex){
    return {base,absolute,relative,error:get_error(ex),is_dir:undefined}
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
  const render_data={
    parent_absolute,
    root_dir,
    fields
  }
try{
    const {is_dir,error}=await mystats({parent_absolute,base:''})
    if (error){
      res.end(render_error_page(error,render_data))
    }
    if (is_dir){
      const stats=await get_files({parent_absolute})
      const content=render_table_page(stats,render_data)
      res.end(content)
      return
    }
    if (is_plain(parent_absolute)){
      res.end(render_page(`<br><img src='/static${parent_absolute}'>`,render_data))
      return
    }
    res.end(render_page('<div class=info>todo render content of file</div>',render_data))
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
