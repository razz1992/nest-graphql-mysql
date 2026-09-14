"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGraphQLContext = createGraphQLContext;
function createGraphQLContext(loadersFactory) {
    return {
        userPostsLoader: loadersFactory.createUserPostsLoader(),
    };
}
//# sourceMappingURL=graphql-context.js.map