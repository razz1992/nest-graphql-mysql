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
exports.UsersResolver = void 0;
const graphql_1 = require("@nestjs/graphql");
const user_entity_1 = require("./user.entity");
const users_service_1 = require("./users.service");
const create_user_input_1 = require("./dto/create-user.input");
const update_user_input_1 = require("./dto/update-user.input");
const post_entity_1 = require("../posts/entities/post.entity");
let UsersResolver = class UsersResolver {
    usersService;
    constructor(usersService) {
        this.usersService = usersService;
    }
    users() {
        return this.usersService.findAll();
    }
    user(id) {
        return this.usersService.findOne(id);
    }
    createUser(createUserInput) {
        return this.usersService.create(createUserInput);
    }
    updateUser(updateUserInput) {
        return this.usersService.update(updateUserInput);
    }
    deleteUser(id) {
        return this.usersService.remove(id);
    }
    posts(user, context) {
        return context.userPostsLoader.load(user.id);
    }
};
exports.UsersResolver = UsersResolver;
__decorate([
    (0, graphql_1.Query)(() => [user_entity_1.User]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "users", null);
__decorate([
    (0, graphql_1.Query)(() => user_entity_1.User),
    __param(0, (0, graphql_1.Args)('id', {
        type: () => graphql_1.Int,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "user", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    __param(0, (0, graphql_1.Args)('createUserInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_input_1.CreateUserInput]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "createUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => user_entity_1.User),
    __param(0, (0, graphql_1.Args)('updateUserInput')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_user_input_1.UpdateUserInput]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "updateUser", null);
__decorate([
    (0, graphql_1.Mutation)(() => Boolean),
    __param(0, (0, graphql_1.Args)('id', {
        type: () => graphql_1.Int,
    })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "deleteUser", null);
__decorate([
    (0, graphql_1.ResolveField)(() => [post_entity_1.Post]),
    __param(0, (0, graphql_1.Parent)()),
    __param(1, (0, graphql_1.Context)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, Object]),
    __metadata("design:returntype", void 0)
], UsersResolver.prototype, "posts", null);
exports.UsersResolver = UsersResolver = __decorate([
    (0, graphql_1.Resolver)(() => user_entity_1.User),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersResolver);
//# sourceMappingURL=users.resolver.js.map