"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleep = void 0;
exports.sleep = (hasFunc, timeOnMillseconds) => {
    return new Promise((resolve, reject) => {
        if (timeOnMillseconds > 0)
            setTimeout(() => resolve(hasFunc), timeOnMillseconds);
        reject();
    });
};
