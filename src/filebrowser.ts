
import express, { Request, Response,NextFunction} from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import {get_error,parse_path_root,date_to_timesince,formatBytes,timeSince,render_table2,encode_path,DataTable,render_table3} from './utils';
import {RenderData,MyStats} from './types'
import {guessFileFormat} from './fileformat'
import {password_protect} from './pass'
import hljs from 'highlight.js'
import {read_config} from './config'
import http from 'http'
import https from 'https'
//import {simpleGit} from 'simple-git';
import {SimplerGit} from './simpler_git';


//import {encode} from 'html-entities'
import {
  render_error_page, 
  render_image, 
  render_page, 
  //render_table,
  render_simple_error_page,
  render_download,
  FILE_ICON
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
  const filename=posix.basename(absolute)
  //const format= guessFileFormat(filename)
  try{
    const stats = await fs.stat(absolute);
    const is_dir=stats.isDirectory()
    const {size,mtimeMs:changed }=stats
    return {filename,relative,is_dir,size,changed}
  }catch(ex){
    return {filename:base,relative,error:get_error(ex),is_dir:false}
  } 
}
const hex = '([0-9a-fA-F]{5,40})';
const routes = {
  ls: `/ls:syspath(*)/:commit${hex}/:gitpath(*)`,
  files: '/files:syspath(*)',
  commits: '/commits:syspath(*)',
  branches: '/branches:syspath(*)',
  commitDiff: `/commitdiff:syspath(*)/:commit1${hex}/:commit2${hex}/`,
};


//export type MyStats = Awaited<ReturnType<typeof mystats>>
async function get_files(render_data:RenderData){
  const {parent_absolute,root_dir}=render_data
  //const files=filter(render_data,[...await fs.readdir(parent_absolute)])
  const files=await fs.readdir(parent_absolute)
  return await Promise.all(files.map(base=>mystats({parent_absolute,base,root_dir}))) //thank you https://stackoverflow.com/a/40140562/39939
}

async function render_data_redirect_if_needed({req,res,cur_handler,need_git=false}:{
  req:Request 
  res:Response
  cur_handler:string
  need_git?:boolean}
){ 
  const url=req.params.syspath||'/'
  const commit=req.params.commit
  const commit2=req.params.commit2
  const root_dir=req.app.locals.root_dir;
  const decoded_url=decodeURI(url)
  const parent_absolute=posix.join(root_dir,decoded_url)
  const parent_relative=posix.relative(root_dir,parent_absolute)
  const fields={
      parent_absolute,
      root:root_dir,
      parent_relative,
      url,
      decoded_url
    }
  const stats=await mystats({parent_absolute,base:'',root_dir})
  const {filter}=req.query
  const re=filter&&new RegExp(`(${filter})`, 'i')||null
  const git=new SimplerGit(parent_absolute)
  const is_git=await git.is_git()
  const ans:RenderData={
    parent_relative,
    parent_absolute,
    root_dir,
    fields,
    is_dark:true,
    cur_handler,
    stats,
    req,
    re,
    git,
    is_git,
    commit,
    commit2
  }
  ans.legs=parse_path_root(ans) //calculated here because on this file (the 'controler') is alowed to redirect
  if (ans.legs==null){
    res.redirect('/')
  }

  if (!is_git && need_git){
    res.redirect(`/files/${parent_relative}`)
  }
  return ans
}
function linked_hash2({parent_relative,hash}:{
  parent_relative:string
  hash:string
}){
    const trimmed=hash.slice(0,8)
    return `<a class=linkedhash href=/ls/${parent_relative}/${hash}/>${trimmed}</a>`
    //return `<a class=linkedhash href=/commitdiff/${trimmed}/${parent_relative}>${trimmed}</a>`
}
function nowrap(a:string|undefined){
  if (a==null)
    return undefined
  return `<div class=nowrap>${a}</div>`
}


async  function handler_commits(req:Request, res:Response){
  const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'commits'})  
  const {parent_relative,git}=render_data 

  const commits=await git.log()//,re,'hash','message')
  const body=commits.map(({branch,date,hash,message})=>(
    {
      hash:{
        href:`/ls/${parent_relative}/${hash}/>`,
        x:hash.slice(0,8)
      },
      message,
      branch,
      'time ago':nowrap(date_to_timesince(date))
    }
  ))
  const content=render_table3({req,body})
  res.end(render_page(content,render_data))
}
async  function handler_branches(req:Request, res:Response){
  const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'branches'})  
  const {parent_relative,git}=render_data
  const branches = (await git.branch())
  const table_data=branches.map(({branch,hash,current,message,date})=>({
      branch,
      hash:linked_hash2({parent_relative,hash:hash}),
      message,
      current,
      'time ago':nowrap(date_to_timesince(date))
  }))
  const content=render_table2(render_data.req,table_data)
  res.end(render_page(content,render_data))
}

async  function handler_commitdiff (req:Request, res:Response){
  const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'commitdiff'})
  const {parent_absolute}=render_data
  const git = new SimplerGit(parent_absolute);
  const commit=req.params.commit
  if (commit==null){
    res.redirect('/')
    return
  }
  const files = await git.diffSummary(`${commit}~1`, commit)
  /*
  const files_data=files.map((x)=>{
    const {filename,binary}=x
    const ans={
      file,
      binary,
      changes:0,
      insertions:0,
      deletions:0
    }
    if ('changes' in x){
      return {...ans,...pk(x,'changes','insertions','deletions')}
    }
    return ans

  })*/
  const content=render_table2(render_data.req,files)
//  const content=JSON.stringify(diffSummary,null,2)
  res.end(render_page(`<pre>${content}</pre>`,render_data))
}

function icon(is_dir:boolean){
  return is_dir?'&#128193;': FILE_ICON
}
async function render_dir(render_data:RenderData,res:Response){
  const stats=await get_files(render_data)
  const {req}=render_data 
  const body:DataTable=stats.map(stats=>{
    const {filename,error,is_dir,size,changed,relative}=stats//Property size does not exist on type 
    return {
      filename:{
        x:filename,
        icon:icon(is_dir),
        href:`/files${encode_path(relative)}`
      },
      '':{
        content:render_download(stats),
      },
      type:is_dir?'Folder':guessFileFormat(filename),
      size    : size&&{x:size,content:formatBytes(size)},
      changed : changed&&{x:changed,content:timeSince(changed)},
      err:error&&{ 
        icon:'&#x274C',
        x:error
      }
    }
  })
  const content=render_table3({req,body,filterable:['filename']})
  res.end(render_page(content,render_data))
  return
}
async function handler_ls(req:Request, res:Response){
  const {gitpath,commit}=req.params
  const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'handler_ls',need_git:true})
  const {git}=render_data
  const ret=await git.ls(commit!,gitpath!)
  const body=ret.map(x=>({
    filename:x.filename
    
  }))
  const content=render_table2(render_data.req,body)
  res.end(render_page(content,render_data))
 }

  //res.end(`<pre>${JSON.stringify(req,null,2)}</pre>`)
  /*return
  res.end(`<ol>
    <li> ${req.params.gitpath}
    <li>${req.params.commit}
    <li>${req.params[0]}
    <li>${req.params[1]}
    <li>${req.params[2]}
  </ol>`)*/

function redirect_to_files(req:Request, res:Response){
  const url=req.params[0]||'/'
  res.redirect(`/files${url}`)

}

async  function handler_files(req:Request, res:Response){
  const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'files'})
  const {parent_absolute,stats:{is_dir,error,filename}}=render_data
  try{
    if (error){
      res.end(render_error_page(error,render_data))
    }
    if (is_dir){
      return render_dir(render_data,res)
    }
    const format=guessFileFormat(filename)
    if (format==='image'){
      res.end(render_image(render_data))
      return
    }
    if (format==='video'){
      const content=`<br><video controls>
      <source src="/static/${parent_absolute}" type="video/mp4">
      Your browser does not support the video tag.
    </video>`
      res.end(render_page(content,render_data))
      return
    }
    //const format= guessFileFormat(base)
    const txt=await fs.readFile(parent_absolute, 'utf8') 
    if (format==null){
      res.end(render_page(`<div class=info>unrecogrnized format: rendering as text</div><pre>${txt}</pre>`,render_data))
      return
    }
    if (format==='markdown'){
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
type ExpressHandler=(req: Request, res: Response, next?: NextFunction)=>Promise<void> 
export function catcher(fn:ExpressHandler){
  const ans:ExpressHandler= async function (req, res, next) {
    try {
      await fn(req, res, next)
    } catch (error) {
        res.end(render_simple_error_page('ouch, an internal rerror',error))
        //res.status(500).send(); // Handle error in case next is not provided
    }
  };
  return ans
}
async function run_app() {
  try{
    const config=await read_config('./filebrowser.json')
    const {port,protocol,cert_content:cert,key_content:key,secret}=config
    const host='0.0.0.0' //should read this from config file
    const app = express();
    app.locals.root_dir=config.root_dir
    app.use((_req, res, next) => {
      res.charset = 'utf-8';
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      next();
    });
    app.use(express.static('static'))
    app.use(session({secret,cookie: { maxAge: 6000000 },resave:true,saveUninitialized:true}))
    app.use(express.urlencoded({ extended: false }));
    app.use(password_protect(config.password))
    app.use('/static',express.static('/'))
    app.get(routes.ls,catcher(handler_ls))
    app.get(routes.files,catcher(handler_files))
    app.get(routes.commits,catcher(handler_commits))
    app.get(routes.branches,catcher(handler_branches))
    app.get(routes.commitDiff,catcher(handler_commitdiff))
    app.get('/*',redirect_to_files)
    const server= await async function(){
      if (protocol==='https')
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