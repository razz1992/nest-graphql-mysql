import {
  LoadersFactory,
} from '../loaders/loaders.factory';

export function createGraphQLContext(
  loadersFactory: LoadersFactory,
) {

  return {
    userPostsLoader:
      loadersFactory.createUserPostsLoader(),
  };
}