import { Request} from 'express';
export interface Filter{
  match    : (s:string)=>boolean
  mark     : (s:string)=>string
  get_html : ()=>string
}
export function make_filter(req:Request):Filter{
  const filter=function(){
    const ans=req.query.filter
    if (typeof ans==='string'){ 
      return ans
    }
    return undefined
  }()  
  const re=function(){
    if (!filter)
      return null // Matches everything
    return new RegExp(`(${filter})`, 'i');
  }()
  const match=function(base:string){
    if (re==null)
      return true
    return re.test(base)
  }
  function mark(text:string){
    if (!re) return text; 
    return text.replace(re, '<b>$1</b>');
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
