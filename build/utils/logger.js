"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = __importDefault(require("config"));
exports.Logger = pino_1.default({
    enabled: config_1.default.get('logger.enabled'),
    level: config_1.default.get('logger.level'),
});
