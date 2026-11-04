import { Body, Controller, Get, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { GetUser } from "./decorators/get-user.decorator";
import { LoginUserDto } from "./dto/login-user.dto";
import type { LoginResponse } from "./interfaces/login.interface";
import type { Payload } from "./interfaces/payload.interface";



@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService

    ) { }


    @Post('login')
    async login(@Body() loginDto: LoginUserDto): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }


    @Get('me')
    getMe(@GetUser() user: Payload) {
        return user;
    }

}