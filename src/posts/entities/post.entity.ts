import {  Column,  Entity,  PrimaryGeneratedColumn,  ManyToOne,} from 'typeorm';
import {  Field,  ID,  ObjectType,} from '@nestjs/graphql';
import { User } from '../../users/user.entity';

@ObjectType()
@Entity()
export class Post {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column('text')
  content: string;


  @Field(() => User)
  @ManyToOne(
    () => User,
    (user) => user.posts,
  )
  user: User;


}
