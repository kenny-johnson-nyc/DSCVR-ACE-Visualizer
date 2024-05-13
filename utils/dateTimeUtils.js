export function toRadians(angle) {
    return angle * (Math.PI / 180);
  }
  
  export function zeroPad(num) {
    return (num >= 0 && num < 10) ? '0' + num : num;
  }
  
  export function convertTime(time) {
    let d = '' + time.getUTCFullYear() + zeroPad(time.getUTCMonth() + 1) + zeroPad(time.getUTCDate());
    let t = 'T' + zeroPad(time.getUTCHours()) + zeroPad(time.getUTCMinutes()) + zeroPad(time.getUTCSeconds()) + 'Z';
    return '' + d + t;
  }