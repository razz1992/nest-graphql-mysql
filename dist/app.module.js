"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const graphql_1 = require("@nestjs/graphql");
const apollo_1 = require("@nestjs/apollo");
const typeorm_1 = require("@nestjs/typeorm");
const loaders_factory_1 = require("./loaders/loaders.factory");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const posts_module_1 = require("./posts/posts.module");
const loaders_module_1 = require("./loaders/loaders.module");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: '.env.local' });
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            graphql_1.GraphQLModule.forRootAsync({
                driver: apollo_1.ApolloDriver,
                imports: [
                    loaders_module_1.LoadersModule,
                ],
                inject: [
                    loaders_factory_1.LoadersFactory,
                ],
                useFactory: (loadersFactory) => ({
                    autoSchemaFile: true,
                    graphiql: true,
                    context: () => ({
                        userPostsLoader: loadersFactory
                            .createUserPostsLoader(),
                    }),
                }),
            }),
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.MYSQL_DB_HOST,
                port: Number(process.env.MYSQL_DB_PORT),
                username: process.env.MYSQL_DB_USER,
                password: process.env.MYSQL_DB_PASSWORD,
                database: 'graphql_demo',
                autoLoadEntities: true,
                synchronize: true,
            }),
            users_module_1.UsersModule,
            posts_module_1.PostsModule,
            loaders_module_1.LoadersModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map