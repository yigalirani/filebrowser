import { exec,spawn  } from 'node:child_process';
import { promisify } from 'util';
import { parse } from "csv-parse/sync";
import path from 'node:path';
const {posix}=path
//import { s2s } from './utils';

const execAsync = promisify(exec);

interface _BranchDiff {
    forkCommit: string;
    forkTime: number;
    branch: string;
    files: string[];
    numFiles: number;
    ref: string;
    refTime: number;
}
export interface LsTree {
  mode:string
  is_dir:boolean
  hash:string
  size:number|undefined
  filename:string
}
interface CommitDiff extends Record<string,number|string>{
  filename:string,
  deletions:number,
  additions:number
}

interface CommitInfo {
  commit: string;
  mergeparent?:string,
  branch:string,
  author: string;
  date: string;
  message: string;
  parent: string;
  current:string
}
function normalize_path(str: string): string {
  if (str==null||str==='')
    return ''

    // Remove leading slash, if present
    let formatted = str.startsWith('/') ? str.slice(1) : str;

    // Add trailing slash, if not present
    if (!formatted.endsWith('/')) {
        formatted += '/';
    }

    return formatted;
}
function normalize_path2(str: string): string {
  if (str==null||str==='')
    return ''

    // Remove leading slash, if present
  const ans = str.startsWith('/') ? str.slice(1) : str;
  if (ans.endsWith('/'))
    return ans.slice(0,-1)
  return ans
}

function parse_int(x:string|undefined){
  const ans=parseInt(x+'')
  if (isNaN(ans))
    return 0
  return ans
}
function str(x:string|undefined){
  if (x==null)
    return ''
  return x  
}
function row_split(row:string,field_sep:RegExp|undefined):string[]{
  if (field_sep==null)
    return parse(row)[0]
  return row.split(field_sep)
}
export class SimplerGit {
    private parent_absolute: string;
    public last_command='';
    constructor({parent_absolute}:{parent_absolute:string}) {

        this.parent_absolute = parent_absolute;
    }

    private async run(command: string): Promise<string> {
      const {parent_absolute}=this
      console.log({command,parent_absolute})
        process.chdir(this.parent_absolute);
        const { stdout } = await execAsync(command,{maxBuffer:1000000000});
        return stdout.trim();
    }
    private run_spawn(command: string) {
      const {parent_absolute}=this
      const subcommands=command.split(' ').filter(Boolean)
      if (subcommands.length==0)
        throw new Error('empty command')
      const ans=spawn(subcommands[0]!,subcommands.slice(1),{cwd:parent_absolute})
      return ans
    }    
    async is_git(){
      try{
        await this.run('git status')
        return true
      }catch(ex){
        return false
      }
    }


    async show(commitRef: string, fileName: string): Promise<string> {
        return await this.run(`git show ${commitRef}:${normalize_path2(fileName)}`);
    }
    show_stream(commitRef: string, fileName: string){
      return this.run_spawn(`git show ${commitRef}:${normalize_path2(fileName)}`);
    }



    /*async showWithError(commitRef: string, fileName: string): Promise<[string | null, string | null]> {
        try {
            const result = await this.run(`git show ${commitRef}:${fileName}`);
            return [result, null];
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [null, error.message];
            } else if (error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER') {
                return [null, error.stderr];
            }
            return [null, error.message];
        }
    }

    async ls(commitRef: string): Promise<string[]> {
        const result = await this.run(`git ls-tree -r --name-only ${commitRef}`);
        return result.split('\n');
    }*/
/*
    async lsSize(commitRef: string): Promise<[string, string][]> {
        const result = await this.run(`git ls-tree -r -l ${commitRef}`);
        return result.split('\n').map(x => {
            const parts = x.trim().split(/\s+/);
            return [parts[3], parts[4]];
        });
    }

    async lsHash(commitRef: string): Promise<[string, string][]> {
        const result = await this.run(``git ls-tree` -r ${commitRef}`);
        return result.split('\n').map(x => {
            const [hash, path] = x.split(' ')[2].split('\t');
            return [hash, path];
        });
    }

    async lsFeatureBranches(): Promise<string[]> {
        const result = await this.run('git branch -r --list origin/feature*');
        return result.split('\n').map(x => x.trim());
    }

    async diffBranch(branch: string): Promise<string[]> {
        const result = await this.run(`git diff --name-only master ${branch}`);
        return result.split('\n');
    }

    async isAncestor(ancestor: string, descendant: string): Promise<boolean> {
        const result = await this.run2(
            `git merge-base --is-ancestor ${ancestor} ${descendant}`
        );
        return result === 0;
    }

    async getBranchDiff(branch: string): Promise<BranchDiff> {
        const forkCommit = await this.getForkCommit(branch);
        const files = await this.diffBranch(branch);
        const ref = await this.getBranchCommit(branch);

        return {
            forkCommit,
            forkTime: await this.getCommitTime(forkCommit),
            branch,
            files,
            numFiles: files.length,
            ref,
            refTime: await this.getCommitTime(ref)
        };zzz
    }
*/  async map_run<T>({command,record_sep,field_sep}:{
      command:string,
      record_sep:RegExp,
      field_sep?:RegExp
    },f:(a:string[])=>T){
      const ans:T[]=[]
      //try{
        this.last_command=command
        const ret=await this.run(command)
        const rows=ret.split(record_sep).filter(Boolean)
        for (const row of rows){
          const row_splitted = row_split(row,field_sep);
          ans.push(f(row_splitted))
        }
        return ans
      //}
      //catch(_ex){
      //return ans
      //}
    }
    async ls(commit:string,path:string): Promise<LsTree[]>{
      return this.map_run({
        command:`git ls-tree -l ${commit} ${normalize_path(path)}`,
        record_sep:/\n/,
        field_sep:/\s+/},
      row=>({
        mode:str(row[0]),
        is_dir:row[1]=='tree',
        hash:str(row[2]),
        size:parse_int(row[3]),
        filename:posix.basename(row[4]||'')
      }))
    }
    async log(branch=''): Promise<CommitInfo[]> {
      return this.map_run({
        command:`git log  ${branch} --pretty=format:"%H %P%n%an%n%ad%n%s%n%D%n`,
        record_sep:/\n\n+/,
        field_sep:/\n/},
        row =>{
        //todo: switch from %s to %B to get all the message
          const hashes=str(row[0]).split(' ')
          const parent=hashes.slice(1).join(',')
          return{
            commit:str(hashes[0]),
            mergeparent:hashes[2],
            author:str(row[1]),
            date:str(row[2]),
            parent,
            message:str(row[3]),
            branch:str(row[4]),
            current:''
        }})//must cast because ts complain that undefined
    }
    async branch(): Promise<CommitInfo[]>{
      return await this.map_run({
        command:`git for-each-ref --format=%(HEAD),%(refname:short),%(objectname),%(authorname),%(authordate),%(subject:sanitize),%(parent) refs/heads/`,
        record_sep:/\n/,
        },
        row=>{
         return {
          commit:row[2]!,
            author:row[3]!,
            date:row[4]!,
            parent:row[6]!,
            message:row[5]!,
            branch:row[1]!,
            current:row[0]!
        }})
    }
    async diffSummary(a:string,b:string):Promise<CommitDiff[]>{
      return await this.map_run({
        command:`git diff --numstat ${a} ${b}`,
        record_sep:/\n/,
        field_sep:
        /\s+/},
        row=>{
        return {
          filename:row[2]!,
          deletions:parseInt(row[0]!),
          additions:parseInt(row[1]!)
        }
      })
    }
/*
    private async getForkCommit(branch: string): Promise<string> {
        return this.run(`git merge-base --octopus origin/master ${branch}`);
    }

    private async getBranchCommit(branch: string): Promise<string> {
        return this.run(`git rev-parse ${branch}`);
    }

    private async getCommitTime(commit: string): Promise<number> {
        const result = await this.run(`git show -s --format=%ct ${commit}`);
        return parseInt(result, 10);
    }*/
}
async function _testit(){
  const git=new SimplerGit({parent_absolute:'/yigal/million_try3'})
  console.log(await git.log())
}
//testit()