import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // getHello(): string {
  //   return 'Hello user,\n if you came to this page it means the app is running.\n App name:  nest-graphql-mysql';
  // }

  getHello(): string {
  return `
  <center style="font-family: Arial; margin-top: 100px;">
      <h1>🎉 Welcome!</h1>
      <p style="font-size:18px;">
          If you can see this page, the application is running successfully.
      </p>
      <h2 style="color:#2E86DE;">
          nest-graphql-mysql
      </h2>
      <p>🚀 Ready to serve GraphQL requests.</p>
  </center>
  `;
}

  getHealth(): object {
    return {
      status: 'ok',
    };
  }

}
