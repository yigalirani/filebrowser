import {Stats} from 'fs'
import {Request} from 'express';
import {Filter} from './filter'
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
  Regular=1,
  Home=2,
  Gray=3,
}
export interface RenderData{
  req             : Request,
  fields          : unknown,
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
  filter          : Filter,
}