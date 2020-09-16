const util = require('../../utils/util')
const configManager = require('../../utils/configManager')
const DES3 = require('../../utils/DES3')
const key = 'e6test2020';

//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    password: '1029',
    inputPsw: '',
    inputValue: '',
    modalKeyShow: false,
  },

  onInputChange: function (e) {
    this.data.inputPsw = e.detail.value;
  },


  onModalKeyClick: function () {
    if (this.data.inputPsw == '') {
      util.showToast('请输入密码');
      return;
    }
    if (this.data.password != this.data.inputPsw) {
      util.showToast('密码错误！');
      return;
    }
    this.setData({
      modalKeyShow: false
    })
  },


  houseInput: function (e) {
    let inputVal = e.detail.value;
    inputVal = inputVal.replace(/[^\w\/]/ig, '')
    this.setData({
      inputValue: inputVal
    })
    return inputVal
  },

  // 设置小区
  setHouseCode: function () {
    let inputVal = this.data.inputValue;
    // console.error('setHouseCode',inputVal,('00' + );
    if (inputVal == '') {
      util.showToast('请输入小区编号');
      return;
    }

    let dateVal = 'CFGCD';

    let house = '1029';
    var array = new Uint8Array(inputVal);
    for (var i = 0, l = inputVal.length; i < l; i++) {
      house += inputVal.charCodeAt(i).toString(16);
    }
    // house = house + inputVal.toString(16);
    house = house + '00';
    let buffer = util.str2ab(inputVal);
    // 默认加3位字节（头1029，尾部00）
    let valLength16Str = (buffer.byteLength + 3).toString(16);
    if (valLength16Str.length == 1) {
      valLength16Str = '000' + valLength16Str;
    } else if (valLength16Str.length == 2) {
      valLength16Str = '00' + valLength16Str;
    } else if (valLength16Str.length == 3) {
      valLength16Str = '0' + valLength16Str;
    }
    valLength16Str = valLength16Str.toUpperCase();

    dateVal = dateVal + valLength16Str + house;
    console.error('setHouseCode', dateVal, house, valLength16Str);
    wx.navigateTo({
      url: '/pages/qrcode/qrcode?d=' + dateVal+"&type=setHouseCode",
    })
  },

  // 同步时间
  syncTime: function () {
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

    let dateValue = 'CFGCD000B1012' + Y + M + D + week + h + m + s;
    console.error('syncTime', dateValue);
    wx.navigateTo({
      url: '/pages/qrcode/qrcode?d=' + dateValue+"&type=syncTime",
    })
  },

  /**
   * 开门
   */
  open: function () {
    //var origData = 'Q20991230235959T20200101000001X20200914093455S30C13812345678D0';
    var origDataPre = 'Q20991230235959T20200101000001';
    var currentTime = 'X'+this.currentTime;
    var S = 'S30'; //延迟时间默认30S
    var C = 'C12345678' // 手机号先默认12345678
    var D = 'D0'; // 默认D0
    var origData = origDataPre+currentTime+S+C+D;
    console.info('原始数据',origData);
    var des3en = DES3.encrypt(key,origData);
    var encryData = util.stringToHex(des3en);
    console.info('加密后后数据',encryData);

    let dateValue = '53' + encryData+ 'Od';
    console.error('openData', dateValue);
    wx.navigateTo({
      url: '/pages/qrcode/qrcode?d=' + dateValue+"&type=open",
    })

  },



  // 计算当前的年月日星期
  dateLater: function () {
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
  },

  /**
   * 当前时间：yyyyMMddHHmmmm
   */
  currentTime:function() {
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
  },
})