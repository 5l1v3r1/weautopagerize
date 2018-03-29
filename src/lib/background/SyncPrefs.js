import Prefs from "./Prefs";

export default class SyncPrefs {
  constructor(keys) {
    this._values = new Map();
    this._keys = keys;
  }
  async init() {
    this._keys.forEach((key) => {
      Prefs.on(key, (newValue) => {
        this._values.set(key, newValue);
      });
    });

    const obj = await Prefs.get(this._keys);
    for (const [key, value] of Object.entries(obj)) {
      this._values.set(key, value);
    }
  }
  get(key) {
    return this._values.get(key);
  }
}
