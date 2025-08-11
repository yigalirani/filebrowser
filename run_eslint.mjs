const { exec } = await import('node:child_process');
//const timing='set TIMING=1&'
const timing=''
const cmd=timing+'npx --prefix ./tools/eslint  eslint . --config ./tools/eslint/eslint.config.mjs --color'
exec(cmd,(error, stdout, stderr) => {
  console.log(`stdout: ${stdout}`);
  if (stderr)
    console.error(`stderr: ${stderr}`);
});