"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const posts_service_1 = require("./posts.service");
const posts_resolver_1 = require("./posts.resolver");
const post_entity_1 = require("./entities/post.entity");
const user_entity_1 = require("../users/user.entity");
let PostsModule = class PostsModule {
};
exports.PostsModule = PostsModule;
exports.PostsModule = PostsModule = __decorate([
    (0, common_1.Module)({
        providers: [posts_service_1.PostsService, posts_resolver_1.PostsResolver,],
        imports: [
            typeorm_1.TypeOrmModule.forFeature([post_entity_1.Post, user_entity_1.User,]),
        ],
    })
], PostsModule);
//# sourceMappingURL=posts.module.js.map