import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { Post } from '../posts/entities/post.entity';
export declare class UsersService {
    private readonly userRepository;
    private readonly postRepository;
    constructor(userRepository: Repository<User>, postRepository: Repository<Post>);
    findAll(): Promise<User[]>;
    findOne(id: number): Promise<User>;
    create(input: CreateUserInput): Promise<User>;
    update(input: UpdateUserInput): Promise<User>;
    remove(id: number): Promise<boolean>;
}
