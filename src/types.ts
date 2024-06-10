import {Stats} from 'fs'
export type MyStats={
  is_dir?  : boolean;
  error?   : string;
  base     : string;
  absolute : string;
  relative : string;
  format?  : string;
  stats?   : Stats
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
  //is_dir          : boolean,
  //error?          : string
  //format?         : string
  stats           : MyStats
}