import {Express,RequestHandler} from 'express';
interface Route{
  path:string
  gen:(a:Record<string,string>)=>string
  handler:RequestHandler
}
export type Routes=Record<string,Route>
export function add_routes(a:Routes,app:Express){
  for (const {path,handler} of Object.values(a)){
    app.get(path,handler)
  }
  console.log(a)
}
