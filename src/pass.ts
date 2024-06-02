import { Request, Response, NextFunction } from 'express';

declare module 'express-session' {
  interface SessionData {
    authenticated: boolean
  }
}

export function password_protect(app_password:string|undefined){
  if (!app_password){
    console.warn('running filebrowser without a password')
    return function(req:Request, res:Response, next:NextFunction) {
      next()
    }
  }
  return  function (req:Request, res:Response, next:NextFunction) {
    if (req.url=='/logout'){
      req.session.authenticated = false;
      res.redirect('/');
      return      
    }
    if (req.session.authenticated)
      return next();
    if (req.url=='/login'){
      const { password } = req.body;
      if (password==app_password){
        req.session.authenticated=true
        res.redirect('/');
        return
      }
    }
    res.send(`
    <form method="post" action="/login">
      <input type="password" name="password" placeholder="Enter password" required />
      <button type="submit">Login</button>
    </form>
  `);    
  }
}
