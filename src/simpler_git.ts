import { exec } from 'child_process';
import { promisify } from 'util';
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
interface LsTree extends Record<string,number|string|undefined>{
  mode:string
  type:string
  hash:string
  size:number|undefined
  path:string
}
interface CommitDiff extends Record<string,number|string>{
  filename:string,
  deletions:number,
  additions:number
}

interface CommitInfo {
  hash: string;
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
  return str.endsWith('/') ? str : `${str}/`;
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

export class SimplerGit {
    private gitDir: string;

    constructor(gitDir: string) {
        this.gitDir = gitDir;
    }

    private async run(command: string): Promise<string> {
        process.chdir(this.gitDir);
        const { stdout } = await execAsync(command,{maxBuffer:100000000});
        return stdout.trim();
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
        return await this.run(`git show ${commitRef}:${fileName}`);
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
      field_sep:RegExp
    },f:(a:string[])=>T){
      const ans:T[]=[]
      //try{
        const ret=await this.run(command)
        const rows=ret.split(record_sep).filter(Boolean)
        for (const row of rows){
          const row_splitted = row.split(field_sep);
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
        type:str(row[1]),
        hash:str(row[2]),
        size:parse_int(row[3]),
        path:str(row[4])
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
            hash:str(hashes[0]),
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
        command:'git for-each-ref refs/heads/ --format="%(objectname),%(authorname),%(authordate:iso),%(parent),%(subject),%(refname:short),%(if)%(HEAD)=*%(then)true%(else)false%(end)"',
        record_sep:/\n/,
        field_sep:/,/},
        row=>{
         return {
            hash:row[0]!,
            author:row[1]!,
            date:row[2]!,
            parent:row[3]!,
            message:row[4]!,
            branch:row[5]!,
            current:row[6]!
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
  const git=new SimplerGit('/yigal/million_try3')
  console.log(await git.log())
}
//testit()