//app.js
const configManager = require('./utils/configManager')
App({
  onLaunch: function () {
    configManager.init();
  },
  globalData: {
    userInfo: null
  }
})