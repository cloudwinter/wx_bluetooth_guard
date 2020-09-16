// components/myComponent.js
var QRCode = require('../../utils/weapp-qrcode.js')
const util = require('../../utils/util')
const configManager = require('../../utils/configManager')
const DES3 = require('../../utils/DES3')
const key = 'e6test2020';

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
        deviceId: '',
        serviceId: '',
        characteristicId: '',
        type: '', // setHouseCode,syncTime,open
        stop:false, // 默认关闭stop
    },

    onUnload: function () {
        // 关闭蓝牙
        this.stopBluetoothDevicesDiscovery();
        this.closeBluetoothAdapter();
        this.setData({
            stop:true
        })
    },

    onLoad: function (options) {

        setTimeout(function () {
            this.openBluetoothAdapter();
        }.bind(this), 500);

        if (options.d) {
            let dataValue = options.d;
            let type = options.type;
            this.setData({
                text: dataValue,
                type: type
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
            this.refreshTask(type);
        }

    },

    /**
     * 定时刷新的任务
     * @param {*} type 类型
     */
    refreshTask:function(type) {
        if(this.data.stop) {
            console.info('停止刷新');
            return;
        }
        var that = this;
        var textVal = '';
        if (type == 'syncTime') {
            textVal = 'CFGCD000B1012' + util.currentWeekTime();
            console.info('定时刷新同步时间',textVal);
            that.setData({
                text: textVal
            })
            that.tapHandler();
            
            setTimeout(that.refreshTask, 5000, type);
        } else if (type == 'open') {
            var origDataPre = 'Q20991230235959T20200101000001';
            var currentTime = 'X' + util.currentTime();
            var S = 'S30'; //延迟时间默认30S
            var C = 'C12345678' // 手机号先默认12345678
            var D = 'D0'; // 默认D0
            var origData = origDataPre + currentTime + S + C + D;
            console.info('加密前数据',origData);
            var des3en = DES3.encrypt(key,origData);
            textVal = util.stringToHex(des3en);
            console.info('加密后后数据',textVal);
            console.info('定时刷新同步开门',textVal);
            that.setData({
                text: textVal
            })
            that.tapHandler();
            setTimeout(that.refreshTask, 10000, type);
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
        console.info('tapHandler')
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
            setTimeout(function () {
                that.stopAnimation();
            }.bind(this), 45000);
        }
    },

    stopAnimation: function () {
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
                // FIXME 测试时注释
                // if (device.name.indexOf('FGBT') < 0 && device.localName.indexOf('FGBT') < 0) {
                //     return
                // }
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
                                deviceId: deviceId,
                                serviceId: serviceId,
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
        console.log('writeBLECharacteristicValue 发送命令：', options.cmd);
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
        let type = this.data.type;
        let cmdText = this.data.text.substr(3, this.data.text.length);
        let cmdBuffer = this.hexStringToArrayBuffer(cmdText);
        console.error('sendCmd', cmdText, cmdBuffer);
        if (type != 'open') {
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
        } else {
            // 开门要循环发送
            separateWriteBLE(cmdBuffer);
        }

    },


    hexStringToArrayBuffer: function (str) {
        if (!str) {
            return new ArrayBuffer(0);
        }
        var buffer = new ArrayBuffer(str.length);
        let dataView = new DataView(buffer);
        let ind = 0;
        for (var i = 0, len = str.length; i < len; i += 2) {
            let code = parseInt(str.substr(i, 2), 16);
            dataView.setUint8(ind, code);
            ind++
        }
        return buffer;
    },




    separateWriteBLE: function (buffer) {
        let that = this;
        let pos = 0;
        let byteLength = buffer.byteLength;
        this.writeBLECharacteristicBuffer(pos, byteLength, buffer);
    },
    // 循环发送命令
    writeBLECharacteristicBuffer: function (pos, byteLength, buffer) {
        var time = util.formatTime(new Date());
        console.error('writeBLECharacteristicBuffer 发送时间:', time);
        let that = this;
        let tmpBuffer;
        if (byteLength <= 0) {
            wx.hideLoading();
            util.showToast('发送成功');
            return;
        }
        if (byteLength > 20) {
            tmpBuffer = buffer.slice(pos, pos + 20);
            pos += 20;
            byteLength -= 20;
        } else {
            tmpBuffer = buffer.slice(pos, pos + byteLength);
            pos += byteLength;
            byteLength -= byteLength;
        }
        console.log('writeBLECharacteristicBuffer 发送命令：', pos, byteLength, tmpBuffer);
        wx.writeBLECharacteristicValue({
            deviceId: this.data.deviceId,
            serviceId: this.data.serviceId,
            characteristicId: this.data.characteristicId,
            value: tmpBuffer,
            success: (res) => {
                console.error('writeBLECharacteristicValue.success:', pos, res);
                setTimeout(() => {
                    that.writeBLECharacteristicBuffer(pos, byteLength, buffer);
                }, 100);
            },
            fail: (res) => {
                console.error('writeBLECharacteristicValue.fail:', res);
                util.showToast('发送失败');
            }
        })
    },
})