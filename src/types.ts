export type MyStats={
  is_dir: boolean;
  error: null;
  dev: number;
  ino: number;
  mode: number;
  nlink: number;
  uid: number;
  gid: number;
  rdev: number;
  size: number;
  blksize: number;
  blocks: number;
  atimeMs: number;
  mtimeMs: number;
  ctimeMs: number;
  birthtimeMs: number;
  atime: Date;
  mtime: Date;
  ctime: Date;
  birthtime: Date;
  base: string;
  absolute: string;
  relative: string;
  format?:string;
} | {
  base: string;
  absolute: string;
  relative: string;
  error: string;
  is_dir: undefined;
  format?:string;
}
export enum LegType {
  Regular,
  Home,
  Gray,
}
export interface RenderData{
  fields          : any
  parent_absolute : string
  parent_relative : string,
  root_dir        : string
  is_dark         : boolean
  legs?           : {leg:string,leg_type:LegType}[]
  language?       : string
  is_git?         : boolean
  cur_handler     : string
  is_dir?         : boolean,
  error           : string|null
  format?         : string
}