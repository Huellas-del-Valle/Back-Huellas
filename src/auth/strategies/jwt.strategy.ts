import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { UsersService } from "../../users/users.service";
import { Payload } from "../interfaces/payload.interface";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(

        private readonly configService: ConfigService,
        private readonly userService: UsersService

    ) {

        super({

            jwtFromRequest: ExtractJwt.fromExtractors([

                (request: Request) => {
                    return request?.cookies?.['accessToken'] ?? null;
                },

                ExtractJwt.fromAuthHeaderAsBearerToken()

            ]),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET')

        })
        
    }

    async validate(payload: Payload) {

        const { id } = payload;

        await this.userService.findOneBy.id(id);
        
        return payload;

    }


}