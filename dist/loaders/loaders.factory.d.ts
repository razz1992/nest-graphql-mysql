import { Repository } from 'typeorm';
import DataLoader from 'dataloader';
import { Post } from '../posts/entities/post.entity';
export declare class LoadersFactory {
    private readonly postRepository;
    constructor(postRepository: Repository<Post>);
    createUserPostsLoader(): DataLoader<number, Post[], number>;
}
