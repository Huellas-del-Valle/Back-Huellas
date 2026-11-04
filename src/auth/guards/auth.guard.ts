import { ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { Private } from "../decorators/private.decortator";
import { Public } from "../decorators/public.decorator";


@Injectable()
export default class AuthNGuard extends AuthGuard('jwt') {

    constructor(

        private readonly reflector: Reflector
        
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const isPublic = this.reflector.getAllAndOverride(Public, [
            context.getHandler(),
            context.getClass()
        ])

        if (isPublic) return true;

        const isPrivate = this.reflector.getAllAndOverride(Private, [
            context.getHandler(),
            context.getClass()
        ]);

        if (!isPrivate) return true;


        return await super.canActivate(context) as boolean;

    }

    handleRequest(err: any, user: any, info: any) {

        if (err || !user) {

            throw err || new UnauthorizedException();

        }

        return user;
    }
}