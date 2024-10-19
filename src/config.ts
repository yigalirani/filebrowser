import { promises as fs } from 'fs';
interface Config {
  port          : number; // default is 80
  protocol      : 'https' | 'http'; // optional, default is http
  key?          : string; // location of http private key, optional
  cert?         : string; // location of http certificate key, optional
  password      : string;
  root_dir      : string;
  key_content?  : string; //wo be filled by app startup
  cert_content? : string;
  secret        : string
}
async function readFileIfExists  (field:string,filename:unknown){
  try{
    if (typeof filename!=='string')
      throw `missing filename for ${field}`
    const content = await fs.readFile(filename, 'utf-8');
    if (!content) {
      console.warn(`File is empty or unreadable: ${filename}`);
      return undefined
    }
    return content;
  }catch(ex){
    console.warn(`cant read ${field}: ${ex.message}`)
    return undefined
  }
}
export async function read_config(filePath: string) {
  // Read and parse the JSON configuration file
  const fileContent = await fs.readFile(filePath, 'utf-8');
  const config:Record<string,unknown> = JSON.parse(fileContent);
  const ans:Config = {
    secret:'',
    port: 80,
    protocol: 'https',
    root_dir: '/',
    password: '',
    ...config,
    key_content:await readFileIfExists('key',config.key),
    cert_content:await readFileIfExists('cert',config.cert),
  };
  if (ans.protocol==='https' &&( ans.key_content===undefined|| ans.cert_content===undefined)){
    console.warn('protocol is https, but at least of of the certificate files are not found reverting to http')
    ans.protocol='http'
    if (!ans.secret||!ans.password){
      console.warn('secret and password are mandatory,existing')
      process.exit(1)
    }
  }
  const print_ans={
    ...ans,
    key_content:ans.key_content?.slice(0,50),
    cert_content:ans.cert_content?.slice(0,50),
  }
  console.log('config',JSON.stringify(print_ans,null,2))
  return ans
}
// Example usage
/*
try {
  const config = read_config('./fileformat.json');
  console.log(config);
} catch (error) {
  console.error('Error reading config:', error.message);
}
*/