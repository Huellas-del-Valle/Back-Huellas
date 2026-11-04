import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { UsersModule } from "../users/users.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";



@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),

        JwtModule.registerAsync({
            inject: [ ConfigService ],
            useFactory: (configService: ConfigService) => ({
                global: true,
                secret: configService.getOrThrow<string>('JWT_SECRET'),
                signOptions: {
                    expiresIn: configService.getOrThrow('JWT_EXPIRES_IN')
                }
            })
        }),

        UsersModule

    ],
    controllers: [ AuthController ],
    providers: [ AuthService ]
})
export class AuthModule { }