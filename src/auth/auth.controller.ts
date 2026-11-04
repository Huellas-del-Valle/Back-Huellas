import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginUserDto } from "./dto/login-user.dto";
import type { LoginResponse } from "./interfaces/login.interface";



@Controller('auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService

    ) { }


    @Post('login')
    async login(@Body() loginDto: LoginUserDto): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }

}