import DataLoader from 'dataloader';
import { User } from './user.entity';
import { UsersService } from './users.service';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { Post } from '../posts/entities/post.entity';
export declare class UsersResolver {
    private readonly usersService;
    constructor(usersService: UsersService);
    users(): Promise<User[]>;
    user(id: number): Promise<User>;
    createUser(createUserInput: CreateUserInput): Promise<User>;
    updateUser(updateUserInput: UpdateUserInput): Promise<User>;
    deleteUser(id: number): Promise<boolean>;
    posts(user: User, context: {
        userPostsLoader: DataLoader<number, Post[]>;
    }): Promise<Post[]>;
}
