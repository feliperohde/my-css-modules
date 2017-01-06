export default function Throttle(callback, limit) {
  var wait = false;
  return function () {
    if (!wait) {
        callback.call();
        wait = true;
        setTimeout(function () {
            wait = false;
        }, limit);
    }
  }
}