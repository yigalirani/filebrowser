const specialFiles:Record<string,string> = {
  '.bashrc': 'bash',
  '.bash_profile': 'bash',
  '.bash_logout': 'bash',
  '.zshrc': 'shell',
  '.zshenv': 'shell',
  '.zprofile': 'shell',
  '.babelrc': 'json',
  '.eslintrc': 'json',
  '.gitignore': 'plaintext',
  '.gitattributes': 'plaintext',
  '.gitconfig': 'ini',
  '.npmrc': 'ini',
  '.dockerignore': 'plaintext',
  '.editorconfig': 'ini',
  'Makefile': 'makefile',
  'Dockerfile': 'dockerfile',
  'CMakeLists.txt': 'cmake'
};

const extensionToFormat:Record<string,string> = {
  '1c': '1c',
  'abnf': 'abnf',
  'log': 'accesslog',
  'as': 'actionscript',
  'ada': 'ada',
  'angelscript': 'angelscript',
  'apache': 'apache',
  'applescript': 'applescript',
  'arcade': 'arcade',
  'ino': 'arduino',
  'arm': 'armasm',
  'xml': 'xml',
  'adoc': 'asciidoc',
  'aj': 'aspectj',
  'ahk': 'autohotkey',
  'au3': 'autoit',
  //'asm': 'avrasm',
  'awk': 'awk',
  'dax': 'axapta',
  'sh': 'bash',
  'bas': 'basic',
  'bnf': 'bnf',
  'b': 'brainfuck',
  'c': 'c',
  'cal': 'cal',
  'capnp': 'capnproto',
  'ceylon': 'ceylon',
  'icl': 'clean',
  'clj': 'clojure',
  'cljrepl': 'clojure-repl',
  'cmake': 'cmake',
  'coffee': 'coffeescript',
  'coq': 'coq',
  'cos': 'cos',
  'cpp': 'cpp',
  'h':'c',
  'hpp':'cpp',
  'crmsh': 'crmsh',
  'cr': 'crystal',
  'cs': 'csharp',
  'csp': 'csp',
  'css': 'css',
  'd': 'd',
  'md': 'markdown',
  'dart': 'dart',
  'pas': 'delphi',
  'diff': 'diff',
  'django': 'django',
  'zone': 'dns',
  'dockerfile': 'dockerfile',
  'bat': 'dos',
  'dsconfig': 'dsconfig',
  'dts': 'dts',
  'dust': 'dust',
  'ebnf': 'ebnf',
  'ex': 'elixir',
  'elm': 'elm',
  'rb': 'ruby',
  'erb': 'erb',
  'erl': 'erlang',
  'xrl': 'erlang-repl',
  'xls': 'excel',
  'fix': 'fix',
  'flix': 'flix',
  'f': 'fortran',
  'fs': 'fsharp',
  'gms': 'gams',
  'gss': 'gauss',
  'gcode': 'gcode',
  'feature': 'gherkin',
  'glsl': 'glsl',
  'gml': 'gml',
  'go': 'go',
  'golo': 'golo',
  'gradle': 'gradle',
  'graphql': 'graphql',
  'groovy': 'groovy',
  'haml': 'haml',
  'hbs': 'handlebars',
  'hs': 'haskell',
  'hx': 'haxe',
  'hsp': 'hsp',
  'http': 'http',
  'hy': 'hy',
  'ni': 'inform7',
  'ini': 'ini',
  'irpf90': 'irpf90',
  'isbl': 'isbl',
  'java': 'java',
  'js': 'javascript',
  'jboss-cli': 'jboss-cli',
  'json': 'json',
  'jl': 'julia',
  'juliatpl': 'julia-repl',
  'kt': 'kotlin',
  'lasso': 'lasso',
  'tex': 'latex',
  'ldif': 'ldif',
  'leaf': 'leaf',
  'less': 'less',
  'lisp': 'lisp',
  'livecodeserver': 'livecodeserver',
  'ls': 'livescript',
  'll': 'llvm',
  'lsl': 'lsl',
  'lua': 'lua',
  'mak': 'makefile',
  'm': 'mathematica',
  'mat': 'matlab',
  'max': 'maxima',
  'mel': 'mel',
  //'m': 'mercury',
  'mips': 'mipsasm',
  'miz': 'mizar',
  'pl': 'perl',
  'ep': 'mojolicious',
  'monkey': 'monkey',
  'moon': 'moonscript',
  'n1ql': 'n1ql',
  'nt': 'nestedtext',
  'nginx': 'nginx',
  'nim': 'nim',
  'nix': 'nix',
  'node': 'node-repl',
  'nsi': 'nsis',
  //'m': 'objectivec',
  'ml': 'ocaml',
  'scad': 'openscad',
  'oxygene': 'oxygene',
  'parser3': 'parser3',
  'pf': 'pf',
  'pgsql': 'pgsql',
  'php': 'php',
  'phtml': 'php-template',
  'txt': 'plaintext',
  'pony': 'pony',
  'ps1': 'powershell',
  'pde': 'processing',
  'profile': 'profile',
  //'pl': 'prolog',
  'properties': 'properties',
  'proto': 'protobuf',
  'pp': 'puppet',
  'pb': 'purebasic',
  'py': 'python',
  'pycon': 'python-repl',
  'q': 'q',
  'qml': 'qml',
  'r': 'r',
  're': 'reasonml',
  'rib': 'rib',
  'graph': 'roboconf',
  'routeros': 'routeros',
  'rsl': 'rsl',
  'rules': 'ruleslanguage',
  'rs': 'rust',
  'sas': 'sas',
  'scala': 'scala',
  'scm': 'scheme',
  'sce': 'scilab',
  'scss': 'scss',
  //'sh': 'shell',
  'smali': 'smali',
  'st': 'smalltalk',
  'sml': 'sml',
  'sqf': 'sqf',
  'sql': 'sql',
  'stan': 'stan',
  'do': 'stata',
  'stp': 'step21',
  'styl': 'stylus',
  'subunit': 'subunit',
  'swift': 'swift',
  'taggerscript': 'taggerscript',
  'yaml': 'yaml',
  'tap': 'tap',
  'tcl': 'tcl',
  'thrift': 'thrift',
  'tp': 'tp',
  'twig': 'twig',
  'ts': 'typescript',
  'vala': 'vala',
  'vb': 'vbnet',
  'vbs': 'vbscript',
  'html': 'html',
  'v': 'verilog',
  'vhdl': 'vhdl',
  'vim': 'vim',
  'wat': 'wasm',
  'wren': 'wren',
  'asm': 'x86asm',
  'xl': 'xl',
  'xq': 'xquery',
  'zep': 'zephir',
};
const image_ext=['jpg','gif','svg','png','ico']
export function guessFileFormat(fileName:string) {
  const lowerFileName = fileName.toLowerCase();
  const exists=specialFiles[lowerFileName]
  if (exists)
    return exists
  const extension = lowerFileName.split('.').slice(-1)[0]
  if (extension==null)
    return
  if (image_ext.includes(extension))
    return 'image'  
  return extensionToFormat[extension]
}
