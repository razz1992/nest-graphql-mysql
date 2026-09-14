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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoadersFactory = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dataloader_1 = __importDefault(require("dataloader"));
const post_entity_1 = require("../posts/entities/post.entity");
let LoadersFactory = class LoadersFactory {
    postRepository;
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    createUserPostsLoader() {
        return new dataloader_1.default(async (userIds) => {
            console.log('UserPostsLoader batch:', userIds);
            const posts = await this.postRepository
                .createQueryBuilder('post')
                .leftJoinAndSelect('post.user', 'user')
                .where('user.id IN (:...userIds)', {
                userIds,
            })
                .getMany();
            const postsByUserId = new Map();
            for (const userId of userIds) {
                postsByUserId.set(userId, []);
            }
            for (const post of posts) {
                const userId = post.user.id;
                postsByUserId
                    .get(userId)
                    .push(post);
            }
            return userIds.map((userId) => postsByUserId.get(userId) ?? []);
        });
    }
};
exports.LoadersFactory = LoadersFactory;
exports.LoadersFactory = LoadersFactory = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(post_entity_1.Post)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], LoadersFactory);
//# sourceMappingURL=loaders.factory.js.map