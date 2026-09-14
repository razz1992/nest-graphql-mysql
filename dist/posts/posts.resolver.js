"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostsResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const post_entity_1 = require("./entities/post.entity");
const posts_service_1 = require("./posts.service");
const create_post_input_1 = require("./dto/create-post.input");
let PostsResolver = class PostsResolver {
    postsService;
    constructor(postsService) {
        this.postsService = postsService;
    }
    posts() {
        return this.postsService.findAll();
    }
    post(id) {
        return this.postsService.findOne(id);
    }
    createPost(createPostInput) {
        return this.postsService.create(createPostInput);
    }
};
exports.PostsResolver = PostsResolver;
__decorate([
    (0, graphql_1.Query)(() => [post_entity_1.Post]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "posts", null);
__decorate([
    (0, graphql_1.Query)(() => post_entity_1.Post),
    __param(0, (0, graphql_1.Args)('id', {
        type: () => graphql_1.Int,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "post", null);
__decorate([
    (0, graphql_1.Mutation)(() => post_entity_1.Post),
    __param(0, (0, graphql_1.Args)('createPostInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_post_input_1.CreatePostInput]),
    __metadata("design:returntype", void 0)
], PostsResolver.prototype, "createPost", null);
exports.PostsResolver = PostsResolver = __decorate([
    (0, graphql_1.Resolver)(() => post_entity_1.Post),
    __metadata("design:paramtypes", [posts_service_1.PostsService])
], PostsResolver);
//# sourceMappingURL=posts.resolver.js.map