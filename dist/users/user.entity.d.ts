import { Post } from '../posts/entities/post.entity';
export declare class User {
    id: number;
    name: string;
    email: string;
    posts: Post[];
}
