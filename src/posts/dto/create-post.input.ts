import {  Field,  InputType,  Int,} from '@nestjs/graphql';
import { IsInt, IsNotEmpty } from 'class-validator';
@InputType()
export class CreatePostInput {

  @Field()
  @IsNotEmpty()
  title: string;

  @Field()
  @IsNotEmpty()
  content: string;
 

  @Field(() => Int)
  @IsInt()
  userId: number;
}

