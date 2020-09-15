// components/myComponent.js
var QRCode = require('../../utils/weapp-qrcode.js')
const util = require('../../utils/util')
const configManager = require('../../utils/configManager')

const W = wx.getSystemInfoSync().windowWidth;
const rate = 750.0 / W;

// 300rpx 在6s上为 150px
const qrcode_w = 400 / rate;

var qrcode;

Page({
    data: {
        text: '',
        bleOpened: true,
        devices: [],
        connected: {}, // 已连接
        deviceId:'',
        serviceId:'',
        characteristicId: '',
    },

    onUnload: function () {
        // 关闭蓝牙
        this.stopBluetoothDevicesDiscovery();
        this.closeBluetoothAdapter();
      },

    onLoad: function (options) {

        setTimeout(function () {
            this.openBluetoothAdapter();
        }.bind(this), 500);

        if (options.d) {
            let dataValue = options.d;
            this.setData({
                text: dataValue
            })
            qrcode = new QRCode('canvas', {
                usingIn: this,
                text: dataValue,
                width: 200,
                height: 200,
                colorDark: "#1CA4FC",
                colorLight: "white",
                correctLevel: QRCode.CorrectLevel.H,
            });
        }


    },

    confirmHandler: function (e) {
        var value = e.detail.value
        qrcode.makeCode(value)
    },
    inputHandler: function (e) {
        var value = e.detail.value
        this.setData({
            text: value
        })
    },
    tapHandler: function () {
        console.log('tap')
        // 传入字符串生成qrcode
        qrcode.makeCode(this.data.text)
    },
    save: function () {
        console.log('save')
        wx.showActionSheet({
            itemList: ['保存图片'],
            success: function (res) {
                console.log(res.tapIndex)
                if (res.tapIndex == 0) {
                    qrcode.exportImage(function (path) {
                        wx.saveImageToPhotosAlbum({
                            filePath: path,
                        })
                    })
                }
            }
        })
    },

    onSwitchChange: function (res) {
        this.setData({
            bleOpened: res.detail.value
        });
        if (res.detail.value) {
            this.openBluetoothAdapter();
        } else {
            this.closeBluetoothAdapter();
        }
    },

    startAnimation: function () {
        let that = this;
        if (this.startBluetoothDevicesDiscovery()) {
            wx.showNavigationBarLoading();

            // this.data._animationId = setInterval(function () {
            //   this.doRotate(++this.data._animationIndex);
            // }.bind(this), 500);
            setTimeout(function () {
                that.stopAnimation();
            }.bind(this), 45000);
        }
    },

    stopAnimation: function () {
        // if (this.data._animationId > 0) {
        //   clearInterval(this.data._animationId);
        //   this.data._animationId = 0;
        // }

        wx.hideNavigationBarLoading()
        if (this._discoveryStarted) {
            this.stopBluetoothDevicesDiscovery();
        }
    },

    /**
     * 打开蓝牙适配器
     */
    openBluetoothAdapter() {
        let cur = this;

        // 关闭蓝牙
        cur.stopBluetoothDevicesDiscovery();
        cur.closeBluetoothAdapter();

        wx.openBluetoothAdapter({
            success: (res) => {
                cur.startAnimation();
            },
            fail: (res) => {
                util.showToast(res.errCode === 10001 ? '请开启手机蓝牙功能' : res.errMsg);
                console.error('openBluetoothAdapter', res);
                // this.setData({
                //   bleOpened: false
                // });
                if (res.errCode === 10001) {
                    wx.onBluetoothAdapterStateChange(function (res) {
                        console.error('onBluetoothAdapterStateChange', res);
                        if (res.available) {
                            cur.startAnimation();
                        }
                    })
                }
            },
            complete: (res) => {},
        })
    },

    /**
     * 关闭蓝牙适配器
     */
    closeBluetoothAdapter() {
        if (this.data.connected && this.data.connected.deviceId) {
            this.closeBLEConnection(this.data.connected.deviceId);
        }
        wx.closeBluetoothAdapter({
            complete: (res) => {},
            fail: (res) => {},
            success: (res) => {},
        })
        this.setData({
            devices: []
        })
    },

    startBluetoothDevicesDiscovery() {
        console.error("startBluetoothDevicesDiscovery", this._discoveryStarted);
        if (this._discoveryStarted) {
            return false;
        }
        console.error("startBluetoothDevicesDiscovery -->");
        this._discoveryStarted = true
        wx.startBluetoothDevicesDiscovery({
            // services: ['\x03\x03\x12\x18'],
            //   services: ['0000FFF0'],
            allowDuplicatesKey: true,
            success: (res) => {
                this.onBluetoothDeviceFound();
            },
        })
        return true;
    },
    stopBluetoothDevicesDiscovery() {
        if (this._discoveryStarted) {
            wx.stopBluetoothDevicesDiscovery();
            this._discoveryStarted = false;
        }
    },

    onBluetoothDeviceFound() {
        wx.onBluetoothDeviceFound((res) => {
            res.devices.forEach(device => {
                if (!device.name && !device.localName) {
                    return
                }
                console.error('onBluetoothDeviceFound:', device);
                if(device.name.indexOf('FGBT') < 0 && device.localName.indexOf('FGBT') < 0){
                    return
                }
                const foundDevices = this.data.devices
                const idx = util.findIndex(foundDevices, 'deviceId', device.deviceId)
                const data = {}
                if (idx === -1) {
                    data[`devices[${foundDevices.length}]`] = device
                } else {
                    data[`devices[${idx}]`] = device
                }
                this.setData(data)
            })
        })
    },
    createBLEConnection(e) {
        const device = e.currentTarget.dataset.device;
        if (this.data.connected && this.data.connected.deviceId && this.data.connected.deviceId !== device.deviceId) {
            this.closeBLEConnection(this.data.connected.deviceId);
        }

        wx.showLoading({
            title: '正在发送...',
        })
        wx.createBLEConnection({
            deviceId: device.deviceId,
            success: (res) => {
                //wx.hideLoading()
                console.error('createBLEConnection:success', res, device);
                this.setData({
                    connected: device
                })
                this.getBLEDeviceServices(device.deviceId);
            },
            fail: (res) => {
                console.error('createBLEConnection:fail', res);
                wx.hideLoading()
                util.showToast('连接失败，请重新连接');
            }
        })
        this.stopAnimation();
    },
    closeBLEConnection(deviceId) {
        if (!deviceId) {
            return;
        }

        this.setData({
            connected: {}
        })
        wx.closeBLEConnection({
            deviceId: deviceId,
            success: (res) => {
                console.error('closeBLEConnection.success:', res);
            },
            fail: (res) => {
                console.error('closeBLEConnection.fail:', res);
            }
        })
    },


    getBLEDeviceServices(deviceId) {
        wx.getBLEDeviceServices({
          deviceId,
          success: (res) => {
            this.setData({
              modalKeyShow: true
            })
            console.error('getBLEDeviceServices.success:', res);
            let services = res.services;
            if (services && services.length > 0) {
              for (let i = 0; i < services.length; i++) {
                console.log('getBLEDeviceServices:[' + i + "]", services[i])
                if (services[i].isPrimary) {
                  // 获取 serviceId 
                  this.getBLEDeviceCharacteristics(deviceId, services[i].uuid, i)
                  return;
                }
              }
            }
          },
          fail: (res) => {
            console.error('getBLEDeviceServices.fail:', res);
            util.showToast('无法获取设备信息:' + JSON.stringify(res));
          }
        })
      },



  getBLEDeviceCharacteristics(deviceId, serviceId, index) {
    var that = this;
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics.success[' + index + ']:', res.characteristics)

        let characteristics = res.characteristics;
        if (characteristics && characteristics.length > 0) {
          for (let i = 0; i < characteristics.length; i++) {
            let item = characteristics[i]
            if (item.properties.write) {
              this.setData({
                deviceId:deviceId,
                serviceId:serviceId,
                characteristicId: item.uuid,
              })
            }
            if (item.properties.notify || item.properties.indicate) {
              wx.notifyBLECharacteristicValueChange({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
                state: true,
                success(res) {
                  console.log('notify 开启成功', res);
                  that.sendCmd();
                }
              })
            }
          }
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics.fail:', res)
      }
    })
    // // 操作之前先监听，保证第一时间获取数据
    wx.onBLECharacteristicValueChange((res) => {
      const value = util.ab2str(res.value);
      let timeBLEFlag = that.data.timeBLEFlag;
      console.error('onBLECharacteristicValueChange:', res.value, util.ab2str(res.value), timeBLEFlag);
    })
  },



  writeBLECharacteristicValue(options) {
    //let buffer = util.str2ab(options.cmd);
    //console.log('writeBLECharacteristicValue 发送命令：', options.cmd, buffer);
    wx.writeBLECharacteristicValue({
      deviceId: this.data.deviceId,
      serviceId: this.data.serviceId,
      characteristicId: this.data.characteristicId,
      value: options.cmd,
      success: (res) => {
        console.error('writeBLECharacteristicValue.success:', res);
        options.success && options.success(res);
      },
      fail: (res) => {
        console.error('writeBLECharacteristicValue.fail:', res);
        options.fail && options.fail(res);
      }
    })
  },


  sendCmd: function () {
    let that = this;
    let cmdText = this.data.text.substr(3,this.data.text.length);
    let cmdBuffer = this.hexStringToArrayBuffer(cmdText);
    // let cmd = util.ab2hex(cmdBuffer);
    console.error('sendCmd',cmdText,cmdBuffer);
    that.writeBLECharacteristicValue({
      cmd: cmdBuffer,
      success: (res) => {
        wx.hideLoading();
        util.showToast('发送成功');
      },
      fail: (res) => {
        wx.hideLoading();
        util.showToast('发送失败');
      }
    });
  },


  hexStringToArrayBuffer:function(str) {
    if(!str) {
        return new ArrayBuffer(0);
    }
    var buffer = new ArrayBuffer(str.length);
    let dataView = new DataView(buffer);
    let ind = 0;
    for(var i=0,len = str.length;i < len;i += 2){
        let code = parseInt(str.substr(i,2),16);
        dataView.setUint8(ind,code);
        ind++
    }
    return buffer;
  },
})