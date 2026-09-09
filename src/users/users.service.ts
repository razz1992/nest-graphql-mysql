import { Injectable, NotFoundException,} from '@nestjs/common';
import {  InjectRepository,} from '@nestjs/typeorm';
import {  Repository,} from 'typeorm';

import { User } from './user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
     constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

   findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  async findOne(id: number): Promise<User> {
    const user =
      await this.userRepository.findOne({
        where: { id },
      });

    if (!user) {
      throw new NotFoundException(
        `User ${id} not found`,
      );
    }
    return user;
  }

  async create(
    input: CreateUserInput,
  ): Promise<User> {
    const user =      this.userRepository.create(input);
    return this.userRepository.save(user);
  }


  async update(  input: UpdateUserInput,): Promise<User> {
 console.log (input) ;
  const user =    await this.findOne(input.id);
  Object.assign(
    user,
    input,
  );
  return this.userRepository.save(user);
}

async remove(  id: number,): Promise<boolean> {

  const result =
    await this.userRepository.delete(id);

  return (result.affected ?? 0) > 0;

}

}




