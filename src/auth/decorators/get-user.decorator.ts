///// Mover a USERS

import { createParamDecorator } from "@nestjs/common";
import { Payload } from "../interfaces/payload.interface";


export const GetUser = createParamDecorator(
    (data, ctx): Payload => {

        const req = ctx.switchToHttp().getRequest();
        return req.user;
        
    }
)