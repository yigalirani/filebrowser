

/*const routes2={
  commits:{
    path:'/commits:syspath(*)',
    gen({syspath}:{syspath:string}){
      return `/commits:${syspath}`
    },
    handler:async (req:Request, res:Response)=>{
      console.log(req,res)
    }
  }
}
function add_it(app:Express){
    add_routes(routes2,app)//Property 'syspath' is missing in type 'Record<string, string>' but required in type '{ syspath: string; }'.ts(2345)
}*/