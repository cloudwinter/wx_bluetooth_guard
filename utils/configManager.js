const backup = require('./backupManager');
const _STORAGE_KEY = 'bleConf'
const _PROPS = {
  _ID: 'id',
  _REMARKNAME: 'remarkName',
  _CONF: 'conf'
}
let _cache = []

/**
 * 创建配置
 * @param {*} id 
 * @param {*} remarkName 
 * @param {*} conf 
 */
function createConf(id, remarkName, conf) {
  return {
    [_PROPS._ID]: id,
    [_PROPS._REMARKNAME]: remarkName || '',
    [_PROPS._CONF]: conf || []
  }
}

/**
 * 初始化
 */
function init() {
  clear();
  load();
  backup.init();
}

function put(id, conf) {
  console.log('config.put:', id, conf);
  if (id) {
    let index = findIndex(_cache, id);
    if (index >= 0) {
      _cache[index] = conf;
    } else {
      _cache.push(conf);
    }
    console.log('config.put.res:', _cache);
  }
}

/**
 * 添加设备配置
 * @param {*} id 设备id
 * @param {*} key 
 * @param {*} value 
 */
function putKeyValue(id, key, value) {
  console.log('config.putKeyValue:', id, key, value);
  if (id && key) {
    let index = findIndex(_cache, id);
    if (index >= 0) {
      _cache[index][key] = value || '';
    } else {
      _cache.push({
        [_PROPS._ID]: id,
        [key]: value || ''
      });
    }
    console.log('config.putKeyValue:', _cache);
    commit();
  }
}

function get(id) {
  return clone(find(_cache, id));
}

function find(arr, id) {
  if (arr && id) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][_PROPS._ID] === id) {
        return arr[i];
      }
    }
  }
  return null;
}

function findIndex(arr, id) {
  if (arr && id) {
    for (let i = 0; i < arr.length; i++) {
      if (arr[i][_PROPS._ID] === id) {
        return i;
      }
    }
  }
  return -1;
}

function commit() {
  console.log('config.commit:', _cache);
  if (_cache && _cache.length > 0) {
    wx.setStorage({
      data: JSON.stringify(_cache),
      key: _STORAGE_KEY,
      success: (res) => {
        console.log('config.commit.success:', res);
      },
      fail: (res) => {
        console.log('config.commit.fail:', res);
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
      console.log('config.init.success:', res);
      if (res.data) {
        const arr = JSON.parse(res.data);
        if (arr && arr.length > 0) {
          for (let i = 0; i < arr.length; i++) {
            put(arr[i][_PROPS._ID], arr[i]);
          }
        }
      }
    },
    fail: (res) => {
      console.log('config.init.fail:', res);
    }
  })
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
  reload: load,
  get,
  putKeyValue,
  clear,
  createConf
}