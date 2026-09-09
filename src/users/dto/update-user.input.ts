import {  Field,  InputType,  Int,  PartialType,} from '@nestjs/graphql';
import {  IsInt,  IsNotEmpty,} from 'class-validator';
import {  CreateUserInput,} from './create-user.input';

@InputType()
export class UpdateUserInput
  extends PartialType(CreateUserInput) {

  @Field(() => Int)
  @IsInt()
  @IsNotEmpty()
  id: number;

}

