import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import { User } from '@/modules/users/entities/user.entity';

export const GetUser = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});