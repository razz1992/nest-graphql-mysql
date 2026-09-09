import {  Column,  Entity,  PrimaryGeneratedColumn,  OneToMany,} from 'typeorm';
import {  Field,  ID,  ObjectType,} from '@nestjs/graphql';
import { Post } from '../posts/entities/post.entity';

@ObjectType()
@Entity()
export class User {

  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({
    unique: true,
  })
  email: string;

  @Field(() => [Post])
  @OneToMany(
    () => Post,
    (post) => post.user,
  )
  posts: Post[];



  
}


