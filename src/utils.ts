export function timeSince(ms:number) {
  var seconds = Math.floor(ms / 1000);
  var interval = seconds / 31536000;
  function render_ago(unit:string){
    const floored_interval=Math.floor(interval)
    if (floored_interval==0)
      return floored_interval+' '+unit
    return floored_interval+' '+unit+'s'
  }
  if (interval >= 2)
    return render_ago("year");
  interval = seconds / 2592000;
  if (interval >= 2) 
    return render_ago("month");
  interval = seconds / 86400;
  if (interval >= 1) 
    return render_ago("day");
  interval = seconds / 3600;
  if (interval > 1) 
    return render_ago('hour')
  interval = seconds / 60;
  if (interval > 1) 
    return render_ago('minute')
  interval = seconds
  return render_ago('second')
}
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];
  const formattedBytes = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${formattedBytes} ${size}`;
} 
