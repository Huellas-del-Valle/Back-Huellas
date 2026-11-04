import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Payload } from "../interfaces/payload.interface";


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(

        private readonly configService: ConfigService

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

        return payload;

    }


}