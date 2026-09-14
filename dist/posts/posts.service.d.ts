import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { User } from '../users/user.entity';
import { CreatePostInput } from './dto/create-post.input';
export declare class PostsService {
    private readonly postRepository;
    private readonly userRepository;
    constructor(postRepository: Repository<Post>, userRepository: Repository<User>);
    create(input: CreatePostInput): Promise<Post>;
    findAll(): Promise<Post[]>;
    findOne(id: number): Promise<Post>;
}
