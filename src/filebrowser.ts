
import express, { Request, Response} from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import {get_error,parse_path_root} from './utils';
import {RenderData,MyStats} from './types'
import {guessFileFormat} from './fileformat'
import {password_protect} from './pass'
import hljs from 'highlight.js'
import {read_config} from './config'
import http from 'http'
import https from 'https'
import {simpleGit} from 'simple-git';


import {
  render_error_page, 
  render_image, 
  render_page, 
  render_table,
} from './view';

import { marked } from 'marked'

import path from 'node:path';
const {posix}=path


async function mystats({parent_absolute,base,root_dir}:{ //absolute_path is a directory
  parent_absolute:string,
  base:string,
  root_dir:string
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
async function get_files({parent_absolute,root_dir}:{
  parent_absolute:string,
  root_dir:string
}){
  const files=await fs.readdir(parent_absolute)
  return await Promise.all(files.map(base=>mystats({parent_absolute,base,root_dir}))) //thank you https://stackoverflow.com/a/40140562/39939
}
async function isGitRepo(directoryPath:string) {
  const git = simpleGit(directoryPath);
  try {
      // Check if the directory is a Git repository by running 'git status'
      await git.status();
      return true;
  } catch (error) {
      // If an error occurs, it's likely not a Git repository
      return false;
  }
}

async function get_git_info(parent_absolute:string){
  try{
    const git = simpleGit(parent_absolute);
    const log = await git.log();
    const commits = log.all; 
    const rows=commits.map(function(commit){
      const {hash,date,message}=commit
      return `<tr><td>${date}</td><td>${hash}</td><td>${message}</td></tr>`
    }).join('\n')
    return `<table>
    <tr>
      <th>date</th>
      <th>hash</th>
      <th>message</th>
    <tr>
      ${rows}
    </table>`
  }catch(ex){
    return ex+''
  }
}

async function render_data_redirect_if_needed(req:Request, res:Response){
  const url=req.params[0]||'/'
  const root_dir=req.app.locals.root_dir;
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
  const stats=await mystats({parent_absolute,base:'',root_dir})
  const ans:RenderData={
    parent_relative,
    parent_absolute,
    root_dir,
    fields,
    is_dark:true,
    cur_handler:'files',
    ...stats
  }
  ans.legs=parse_path_root(ans) //calculated here because on this file (the 'controler') is alowed to redirect
  if (ans.legs==undefined){
    res.redirect('/')
  }

  if (stats.is_dir)
    ans.is_git=await isGitRepo(parent_absolute)
  return ans
}

async  function handler_get_files(req:Request, res:Response){
  const render_data=await render_data_redirect_if_needed(req,res)
  const {parent_absolute,root_dir,is_dir,error,format}=render_data
  try{
    if (error){
      res.end(render_error_page(error,render_data))
    }
    if (is_dir){
 
      const stats=await get_files({parent_absolute,root_dir})
      const content=render_table(stats)

      res.end(render_page(content,render_data))
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

async function run_app() {
  try{
    const config=await read_config('./filebrowser.json')
    const {port,protocol,cert_content:cert,key_content:key}=config
    const host='0.0.0.0' //should read this from config file
    const app = express();
    app.locals.root_dir=config.root_dir
 
    app.use(express.static('static'))
    app.use(session({ secret: 'grant' })) //, cookie: { maxAge: 60000 }}))
    app.use(express.urlencoded({ extended: false }));
    //app.use(password_protect(config.password))    
    app.use('/static',express.static('/'))
    app.get('/files*',handler_get_files)
    app.get('/*',handler_get_files)
    const server= await async function(){
      if (protocol=='https')
        return await https.createServer({cert,key}, app)
      return await http.createServer(app);
    }()
    await server.listen(port,host)      
    console.log(`started server at port=${port},host=${host}`)
  }catch(ex){
    console.warn('error string server',ex)
  }
}

run_app()
