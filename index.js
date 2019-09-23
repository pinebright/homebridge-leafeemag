'use strict';

const cron = require('cron');

let hap;

module.exports = function(homebridge) {
  hap = homebridge.hap;
  homebridge.registerAccessory('homebridge-leafeemag', 'LeafeeMag', LeafeeMag);
}

class LeafeeMag {

  constructor(log, config) {
    log("LeafeeMag init");

    this.log = log;
    this.uuid = config.uuid || "FF:FF:FF:FF:FF:FF";
    this.schedule = '* * * * *';

    this.lockState = hap.Characteristic.CurrentDoorState.OPEN;
    this.batteryLevel = null;
    this.updater = new cron.CronJob({
      cronTime: this.schedule,
      onTick: () => {
        this._refreshState();
      },
      runOnInit: true
    });
    this.updater.start();
  }

  _refreshState() {
    this.log.debug("refreshing state: %s", this.uuid);
  }

  getServices() {
    const informationService = new hap.Service.AccessoryInformation();
    informationService
      .setCharacteristic(hap.Characteristic.Manufacturer, "Strobo")
      .setCharacteristic(hap.Characteristic.Model, "Leafee Mag")
      .setCharacteristic(hap.Characteristic.SerialNumber, "abcedf");

    const batteryService = new hap.Service.BatteryService();
    batteryService
      .getCharacteristic(hap.Characteristic.BatteryLevel)
        .on('get', this.getBatteryLevel.bind(this));
    batteryService
      .getCharacteristic(hap.Characteristic.ChargingState)
        .on('get', this.getBatteryChargingState.bind(this));
    batteryService
      .getCharacteristic(hap.Characteristic.StatusLowBattery)
        .on('get', this.getLowBatteryStatus.bind(this));

    const contactService = new hap.Service.ContactSensor("leafee mag");
    contactService
      .getCharacteristic(hap.Characteristic.ContactSensorState)
        .on('get', this.getContactSensorState.bind(this));

    return [informationService, batteryService, contactService];
  }

  getBatteryLevel(callback) {
    return callback(null, this.batteryLevel);
  }

  getLowBatteryStatus(callback) {
    if (this.batteryLevel <= 20) {
      callback(null, hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW);
    } else {
      callback(null, hap.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
    }
  }

  getBatteryChargingState(callback) {
    callback(null, hap.Characteristic.ChargingState.NOT_CHARGING);
  }

  getContactSensorState(callback) {
    this.log.info("call getContactSensorState: %s", this.uuid);
    return callback(null, this.lockState);
  }
}
