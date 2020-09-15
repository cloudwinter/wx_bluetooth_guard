const _STORAGE_KEY = 'bleBackup'
const _PROPS = {
  _NAME: 'name',
  _CONF: 'conf'
}

let _cache = []

/**
 * 初始化
 */
function init() {
  clear();
  load();
}

function put(name, conf) {
  console.log('backup.put:', name, conf);
  if (name) {
    let index = findIndex(_cache, name);
    if (index >= 0) {
      _cache[index][_PROPS._CONF] = conf;
    } else {
      _cache.push({
        [_PROPS._NAME]: name,
        [_PROPS._CONF]: conf
      });
    }
    console.log('backup.put.res:', _cache);
    commit();
  }
}

function remove(index,deleteCount) {
  _cache.splice(index,deleteCount);
  commit();
}

function findIndex(arr, name) {
  if (arr && name) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][_PROPS._NAME] === name) {
        return i;
      }
    }
  }
  return -1;
}

function commit() {
  console.log('backup.commit:', _cache);
  if (_cache && _cache.length > 0) {
    wx.setStorage({
      data: JSON.stringify(_cache),
      key: _STORAGE_KEY,
      success: (res) => {
        console.log('backup.commit.success:', res);
      },
      fail: (res) => {
        console.log('backup.commit.fail:', res);
      }
    })
  }
}

function clear() {
  _cache = [];
}

function load() {
  wx.getStorage({
    key: _STORAGE_KEY,
    success: (res) => {
      console.log('backup.init.success:', res);
      if (res.data) {
        const arr = JSON.parse(res.data);
        if (arr && arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            put(arr[i][_PROPS._NAME], arr[i][_PROPS._CONF]);
          }
        }
      }
    },
    fail: (res) => {
      console.log('backup.init.fail:', res);
    }
  })
}

function loadData(filterfn) {
  if (!filterfn) {
    filterfn = function (item) {
      return item && item[_PROPS._NAME] && item[_PROPS._CONF] && item[_PROPS._CONF].length > 0;
    }
  }
  return clone(_cache.filter(filterfn));
}

function clone(obj) {
  if (obj) {
    return JSON.parse(JSON.stringify(obj));
  }
  return null;
}

module.exports = {
  _PROPS,
  init,
  loadData,
  put,
  remove
}