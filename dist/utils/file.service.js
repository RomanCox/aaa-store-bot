"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveCsvToFile = saveCsvToFile;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
function resolvePath(p) {
    if (p.startsWith("~")) {
        return path_1.default.join(os_1.default.homedir(), p.slice(1));
    }
    return path_1.default.resolve(p);
}
function saveCsvToFile(csv) {
    const dir = resolvePath(process.env.EXPORT_CSV_PATH || "/var/data/exports");
    // 👉 создаем папку если нет
    if (!fs_1.default.existsSync(dir)) {
        fs_1.default.mkdirSync(dir, { recursive: true });
    }
    const filePath = path_1.default.join(dir, "products.csv");
    fs_1.default.writeFileSync(filePath, csv, "utf-8");
}
