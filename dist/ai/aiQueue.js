"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiLimiter = void 0;
const bottleneck_1 = __importDefault(require("bottleneck"));
exports.aiLimiter = new bottleneck_1.default({
    maxConcurrent: 5,
    minTime: 200,
});
