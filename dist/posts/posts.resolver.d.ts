import { Post } from './entities/post.entity';
import { PostsService } from './posts.service';
import { CreatePostInput } from './dto/create-post.input';
export declare class PostsResolver {
    private readonly postsService;
    constructor(postsService: PostsService);
    posts(): Promise<Post[]>;
    post(id: number): Promise<Post>;
    createPost(createPostInput: CreatePostInput): Promise<Post>;
}
