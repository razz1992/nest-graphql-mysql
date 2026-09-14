import { LoadersFactory } from '../loaders/loaders.factory';
export declare function createGraphQLContext(loadersFactory: LoadersFactory): {
    userPostsLoader: import("dataloader")<number, import("../posts/entities/post.entity").Post[], number>;
};
