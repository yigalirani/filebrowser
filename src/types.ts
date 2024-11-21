import {Stats} from 'fs'
import {Request} from 'express';
import {SimplerGit} from './simpler_git'
export type MyStats={
  is_dir  : boolean;
  error?   : string;
  filename : string;
  //absolute : string;
  relative : string; //path of the file relative to project root 
  format?  : string;
  size?:number;
  changed?:number;
  //stats?   : Stats
}
export enum LegType {
  Regular=1,
  Home=2,
  Gray=3,
}
export interface RenderData {
  req             : Request,
  fields          : unknown,
  parent_absolute : string,
  parent_relative : string,
  root_dir        : string,
  is_dark         : boolean,
  legs?           : {leg: string, leg_type: LegType}[],
  language?       : string,
  is_git          : boolean,
  cur_handler     : string,
  stats           : MyStats,
  re              : RegExp | null,
  git             : SimplerGit,
  commit          : string | undefined,
  commit2         : string | undefined,
  //[key: string]   : any
}
