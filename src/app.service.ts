import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World-Mysql-gerpaql-nestjs!';
  }

  getHealth(): object {
    return {
      status: 'ok',
    };
  }

}
