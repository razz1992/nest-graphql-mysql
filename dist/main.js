"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = require("node:fs");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({
    path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env.local',
});
const app_module_1 = require("./app.module");
function getHttpsOptions() {
    const keyPath = process.env.SSL_KEY_PATH;
    const certPath = process.env.SSL_CERT_PATH;
    if (!keyPath && !certPath) {
        return undefined;
    }
    if (!keyPath || !certPath) {
        throw new Error('Both SSL_KEY_PATH and SSL_CERT_PATH must be set to enable HTTPS.');
    }
    return {
        key: (0, node_fs_1.readFileSync)(keyPath),
        cert: (0, node_fs_1.readFileSync)(certPath),
        passphrase: process.env.SSL_PASSPHRASE,
    };
}
async function bootstrap() {
    const httpsOptions = getHttpsOptions();
    const app = await core_1.NestFactory.create(app_module_1.AppModule, httpsOptions
        ? {
            httpsOptions,
        }
        : {});
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
//# sourceMappingURL=main.js.map