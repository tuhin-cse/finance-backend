import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Custom decorator to extract the user from the request object
 * Usage: @GetUser() user: UserType
 * Can also be used to extract a specific field: @GetUser('email') email: string
 */
export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const request: any = ctx.switchToHttp().getRequest();

    // If no specific data field is provided, return the entire user object
    if (!data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
      return request.user;
    }

    // If a specific field is provided, return just that field
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
    return request.user[data];
  },
);