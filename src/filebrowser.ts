
import express, { Request, Response} from 'express';
import session from 'express-session';
import { promises as fs } from 'fs';
import {get_error,parse_path_root,date_to_timesince,formatBytes,timeSince,render_table2,encode_path,DataTable,render_table3} from './utils';
import {RenderData,MyStats} from './types'
import {guessFileFormat,guessMimeType} from './fileformat'
import {password_protect} from './pass'
import hljs from 'highlight.js'
import {read_config} from './config'
import http from 'http'
import https from 'https'
//import {simpleGit} from 'simple-git';
import {SimplerGit} from './simpler_git';


//import {encode} from 'html-entities'
import {
   render_image, 
  render_page, 
  //render_table,
  render_download,
  FILE_ICON,
  add_routes
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
    return {filename:base,relative,error:get_error(ex as Error),is_dir:false}
  } 
}
const hex = '([0-9a-fA-F]{5,40})';


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
  const git=new SimplerGit({parent_absolute})
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
function linked_hash2({parent_relative,commit}:{
  parent_relative:string
  commit:string
}){
    const trimmed=commit.slice(0,9)
    const href=routes2.ls.gen({syspath:parent_relative,commit,gitpath:''})
    return `<a class=linkedhash href=${href}/>${trimmed}</a>`
    //return `<a class=linkedhash href=/commitdiff/${trimmed}/${parent_relative}>${trimmed}</a>`
}
function nowrap(a:string|undefined){
  if (a==null)
    return undefined
  return `<div class=nowrap>${a}</div>`
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
function redirect_to_files(req:Request, res:Response){
  const url=req.params[0]||'/'
  res.redirect(`/files${url}`)

}
const text_decoder = new TextDecoder('utf-8', { fatal: true });
async function readfile(fileName: string) {
    const buf = await fs.readFile(fileName);
    try {
      const txt=text_decoder.decode(buf); // Will throw if invalid UTF-8
      return {txt,binary:false,buf}
  } catch (e) {
      return {txt:'binary file',binary:true,buf}
  }
}
function bufferToHex(buffer: Buffer): string {
  const bytesPerLine = 16;
  let hexString = '';

  for (let i = 0; i < buffer.length; i += bytesPerLine) {
      // Add offset
      const offset = i.toString(16).padStart(8, '0');

      // Extract the current line of bytes
      const lineBytes = buffer.slice(i, i + bytesPerLine);

      // Convert bytes to hex
      const hexBytes = Array.from(lineBytes)
          .map(byte => byte.toString(16).padStart(2, '0'))
          .join(' ');

      // Convert bytes to ASCII, replacing non-printable characters with "."
      const asciiRepresentation = Array.from(lineBytes)
          .map(byte => (byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.'))
          .join('');

      // Format the line
      hexString += `${offset}  ${hexBytes.padEnd(bytesPerLine * 3 - 1)}  |${asciiRepresentation}|\n`;
  }

  return hexString;
}
const routes2={
  commits:{
    path:'/commits:syspath(*)',
    gen({syspath}:{syspath:string}){
      return `/commits:${syspath}`
    },
    async handler(req:Request, res:Response){
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'commits'})  
      const {parent_relative,git}=render_data 
      function hash_link(x:string|undefined){
        if (x==null)
          return undefined  
        return {
          href:`/ls/${parent_relative}/${x}/`,
          x:x.slice(0,9)
        }
      }
      const commits=await git.log()//,re,'hash','message')
      const body=commits.map(({branch,author,date,commit,mergeparent,message,parent})=>(
        {
          commit:hash_link(commit),
          merge:hash_link(mergeparent),
          //parent,
          author,
          message,
          branch,
          'time ago':nowrap(date_to_timesince(date))
        }
      ))
      const content=render_table3({req,body})
      res.end(render_page(content,render_data))
    }
  },
  branches:{
    path:'/branches:syspath(*)',
    gen({syspath}:{syspath:string}){
      return `/branches:${syspath}`
    },    
    async handler (req:Request, res:Response){
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'branches'})  
      const {parent_relative,git}=render_data
      const branches = (await git.branch())
      const body=branches.map(({branch,parent,commit,current,message,date})=>({
          current,
          branch,
          hash:linked_hash2({parent_relative,commit}),
          parent:linked_hash2({parent_relative,commit:parent}),

          message,
          'time ago':nowrap(date_to_timesince(date))
      }))
      const content=render_table3({body,req})
      res.end(render_page(content,render_data))
    }
  },
  commitdiff:{
    path: `/commitdiff:syspath(*)/:commit1${hex}/:commit2${hex}/`,
    gen({syspath,commit1,commit2}:{syspath:string,commit1:string,commit2:string}){
      return `/commitdiff:${syspath}/${commit1}/${commit2}/`
    },  
    async handler(req:Request, res:Response){
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'commitdiff'})
      const {parent_absolute}=render_data
      const git = new SimplerGit({parent_absolute});
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
  },
  ls:{
    path:`/ls:syspath(*)/:commit${hex}/:gitpath(*)`,
    gen({ syspath, commit, gitpath }: { syspath: string; commit: string; gitpath: string }) {
      return `/ls/${syspath}/${commit}${gitpath}`;
    },
    async handler(req:Request, res:Response){
      const {gitpath,commit,syspath}=req.params
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'ls',need_git:true})
      const {git,parent_relative}=render_data
      const ret=await git.ls(commit!,gitpath!)
      const body=ret.map(({size,is_dir,filename})=>({
        filename:{
          x:filename,
          icon:icon(is_dir),
          href:`/${is_dir?'ls':'show'}/${parent_relative}/${commit}/${gitpath}/${filename}`,
        },
        size    : size&&{x:size,content:formatBytes(size)}
      }))
      const content=render_table3({body,req})
      res.end(render_page(content,render_data))
    }
  },
  show:{
    path:`/show:syspath(*)/:commit${hex}/:gitpath(*)`,
    gen({ syspath, commit, gitpath }: { syspath: string; commit: string; gitpath: string }) {
      return `/ls:${syspath}/${commit}/${gitpath}`;
    },
    async handler(req:Request, res:Response){
      const {gitpath,commit}=req.params
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'ls',need_git:true})
      const {git,parent_relative}=render_data
      const format=guessFileFormat(gitpath!)
      if (format==='image'){
        res.end(render_page(`<br><img src='/rawshow/${parent_relative}/${commit}/${gitpath}'>`,render_data))
        return
      }
      const content=await git.show(commit!, gitpath!)
      res.end(render_page(`<pre>${content}</pre>`,render_data))
    }
  },
  rawshow:{
    path:`/rawshow:syspath(*)/:commit${hex}/:gitpath(*)`,
    gen({ syspath, commit, gitpath }: { syspath: string; commit: string; gitpath: string }) {
      return `/ls:${syspath}/${commit}/${gitpath}`;
    },    
    async handler(req:Request, res:Response){
      const {gitpath,commit}=req.params
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'ls',need_git:true})
      const {git}=render_data
      const ans=git.show_stream(commit!, gitpath!)
      const mimetype=guessMimeType(gitpath!)
      res.setHeader('Content-Type',mimetype );
      ans.stdout.pipe(res)
    }
  },
  files:{
    path: '/files:syspath(*)',
    gen({syspath}:{syspath:string}){
      return `/files:${syspath}`
    },
    async handler(req:Request, res:Response){
      const render_data=await render_data_redirect_if_needed({req,res,cur_handler:'files'})
      const {parent_absolute,stats:{is_dir,filename}}=render_data
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
      const {txt,buf,binary}=await readfile(parent_absolute)
      if (binary){
        const hex=bufferToHex(buf);
        res.end(render_page(`<div class=info>file is binary</div><pre>${hex}</pre>`,render_data))    
        return
      }
      //const txt=buf.toString('utf8')

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
    }
  }
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
    //app.get(routes.ls,catcher(handler_ls))

    //app.get(routes.commits,catcher(handler_commits))
    //app.get(routes.branches,catcher(handler_branches))
    //app.get(routes.commitDiff,catcher(handler_commitdiff))
    add_routes(routes2,app)
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