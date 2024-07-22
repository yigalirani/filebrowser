import { Request} from 'express';
export interface Filter{
  match    : (s:string)=>boolean
  mark     : (s:string)=>string
  get_html : ()=>string
}
function concat(words:string[]){
  function f(x:string,i:number){
      if (i%2==0)
          return x
      return `<b>${x}</b>`
  }
  return words.map(f)
}
function split(re:RegExp,value:string){
  if (!re)
      return [value]
  return (value+'').split(re)
}  
export function make_filter(req:Request):Filter{
  const filter=function(){
    const ans=req.query.filter
    if (typeof ans==='string'){
      return ans
    }
    return undefined
  }()
  const filter_reg_ex=function(){
    if (!filter)
      return null // Matches everything
    return RegExp(filter)///elaborate
  }()
  const match=function(base:string){
    if (filter_reg_ex==null)
      return true
    return filter_reg_ex.test(base)
  }
  function mark(text:string){
    if (filter_reg_ex==null||text==null)
      return text
    var words=split(filter_reg_ex,text)
    return concat(words).join('')
  }
  function get_html(){
    return `<form class=control method="get">
    <input id=filterInput type="text" name="filter" placeholder="filter" value="${filter||''}"/>
    <button type="submit">apply</button>
  </form>
      <script>
        (function() {
          const input = document.getElementById('filterInput');
          const originalValue = '${filter}';
          
          input.addEventListener('input', function() {
            this.classList.toggle('changed', this.value !== originalValue);
          });
        })();
      </script>
  `
  }
  return {match,mark,get_html}
}
