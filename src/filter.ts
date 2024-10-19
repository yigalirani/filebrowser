import { Request} from 'express';

export class Filter{
  re?:RegExp
  filter?:string
  constructor(req:Request){
    const ans=req.query.filter
    if (typeof ans==='string'){ 
      this.filter=ans
      this.re=new RegExp(`(${ans})`, 'i')
    } 
  }
  match(base:string){
    if (this.re==null)
      return true
    return this.re.test(base)
  }
  mark(text:string){
    if (!this.re) return text; 
    return text.replace(this.re, '<b>$1</b>');
  }
  get_html(){
    return `<form class=control method="get">
    <input id=filterInput type="text" name="filter" placeholder="filter" value="${this.filter||''}"/>
    <button type="submit">apply</button>
  </form>
      <script>
        (function() {
          const input = document.getElementById('filterInput');
          const originalValue = '${this.filter}';
          input.addEventListener('input', function() {
            this.classList.toggle('changed', this.value !== originalValue);
          });
        })();
      </script>
  `
  }

}
