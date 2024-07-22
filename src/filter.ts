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
  function concat(words:string[]){
    function f(x:string,i:number){
      console.log({x,i})
        if (i%2){
          console.log('return x')
            return x
        }
        console.log('return filter')

        return `<b>${filter}</b>`
    }
    return words.map(f)
  }
  function escapeRegExp(x:string) {
    return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  function split(re:RegExp,value:string){
    if (!re)
        return [value]
    return (value+'').split(re)
  }    

  const filter_reg_ex=function(){
    if (!filter)
      return null // Matches everything
    return RegExp(escapeRegExp(filter),'ig')
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
    const words2=concat(words)
    console.log({words2})
    return words2.join('')
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
