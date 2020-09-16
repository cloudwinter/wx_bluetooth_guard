const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}

/**
 * 判断对象是否是数组
 */
function isArray(o) {
  return Object.prototype.toString.call(o) == '[object Array]';
}

function showToast(msg) {
  wx.showToast({
    title: msg,
    icon: 'none',
    duration: 3000
  })
}

/**
 *
 * json转字符串
 */
function stringToJson(data) {
  return JSON.parse(data);
}
/**
 *字符串转json
 */
function jsonToString(data) {
  return JSON.stringify(data);
}
/**
 *map转换为json
 */
function mapToJson(map) {
  return JSON.stringify(strMapToObj(map));
}
/**
 *json转换为map
 */
function jsonToMap(jsonStr) {
  return objToStrMap(JSON.parse(jsonStr));
}


/**
 *map转化为对象（map所有键都是字符串，可以将其转换为对象）
 */
function strMapToObj(strMap) {
  let obj = Object.create(null);
  for (let [k, v] of strMap) {
    obj[k] = v;
  }
  return obj;
}

/**
 *对象转换为Map
 */
function objToStrMap(obj) {
  let strMap = new Map();
  for (let k of Object.keys(obj)) {
    strMap.set(k, obj[k]);
  }
  return strMap;
}

function setResultData(path, resultData) {
  if (path && resultData) {
    let pages = getCurrentPages();
    if (pages.length > 1) {
      let prePage = pages[pages.length - 2]
      if (prePage && prePage.route === path) {
        prePage.setData({
          resultData
        })
      }
    }
  }
}

function findIndex(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}

function find(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return arr[i];
    }
  }
  return null;
}

/**
 * ArrayBuffer->String
 * @param {*} ab 
 */
function ab2str(ab) {
  // return String.fromCharCode.apply(null, new Uint8Array(ab));
  var arr = Array.prototype.map.call(new Uint8Array(ab), x => x)
  var str = ''
  for (var i = 0; i < arr.length; i++) {
    str += String.fromCharCode(arr[i])
  }
  return str
}

/**
 * String->ArrayBuffer
 * @param {*} str 
 */
function str2ab(str) {
  var array = new Uint8Array(str.length);
  for (var i = 0, l = str.length; i < l; i++) {
    array[i] = str.charCodeAt(i);
  }
  console.log(array);
  return array.buffer;
}

// ArrayBuffer转16进度字符串示例
function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}


function stringToHex(s) {
  var r = "";
  var hexes = new Array("0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f");
  for (var i = 0; i < s.length; i++) {
    r += hexes[s.charCodeAt(i) >> 4] + hexes[s.charCodeAt(i) & 0xf];
  }
  return r;
}

function hexToString(h) {
  var r = "";
  for (var i = (h.substr(0, 2) == "0x") ? 2 : 0; i < h.length; i += 2) {
    r += String.fromCharCode(parseInt(h.substr(i, 2), 16));
  }
  return r;
}


// 计算当前的年月日星期
function dateLater() {
  let dateObj = {};
  let show_day = new Array('0', '1', '2', '3', '4', '5', '6');
  let date = new Date();
  date.setDate(date.getDate());
  let day = date.getDay();
  dateObj.year = date.getFullYear();
  dateObj.month = ((date.getMonth() + 1) < 10 ? ("0" + (date.getMonth() + 1)) : date.getMonth() + 1);
  dateObj.day = (date.getDate() < 10 ? ("0" + date.getDate()) : date.getDate());
  dateObj.week = show_day[day];
  return dateObj;
}


/**
 * 当前时间+星期
 * 2020091603101350
 * yyyyMMdd0WHHmmss
 */
function currentWeekTime(){
  var date = new Date();
  //年  
  var Y = date.getFullYear();
  //月  
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  //日  
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  //时  
  var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  //分  
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  //秒  
  var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  // 星期
  var week = this.dateLater().week;
  if (week == '0') {
    week = '7'
  }
  week = '0' + week;
  return Y + M + D + week + h + m + s;
}




/**
 * 当前时间：yyyyMMddHHssmm
 * yyyyMMddHHmmss
 */
function currentTime() {
  var date = new Date();
  //年  
  var Y = date.getFullYear();
  //月  
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1);
  //日  
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  //时  
  var h = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
  //分  
  var m = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
  //秒  
  var s = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
  return Y + M + D + h + m + s
}

module.exports = {
  formatTime: formatTime,
  isArray: isArray,
  showToast: showToast,
  stringToJson: stringToJson,
  jsonToString: jsonToString,
  mapToJson: mapToJson,
  jsonToMap: jsonToMap,
  strMapToObj: strMapToObj,
  objToStrMap: objToStrMap,
  ab2hex,
  ab2str,
  str2ab,
  stringToHex,
  findIndex,
  find,
  setResultData
}