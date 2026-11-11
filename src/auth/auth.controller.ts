import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOperation, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { GetUser } from "../users/decorators/get-user.decorator";
import { Private } from "./decorators/private.decortator";
import { LoginUserDto } from "./dto/login-user.dto";
import type { LoginResponse } from "./interfaces/login.interface";
import type { Payload } from "./interfaces/payload.interface";



@Controller('v1/auth')
export class AuthController {

    constructor(
        private readonly authService: AuthService

    ) { }


    @ApiOperation({ summary: 'Inicio de sesión via email o name' })
    @ApiBadRequestResponse({ })
    @ApiUnauthorizedResponse({ })
    @ApiNotFoundResponse({ })
    @Post('login')
    async login(@Body() loginDto: LoginUserDto): Promise<LoginResponse> {
        return this.authService.login(loginDto);
    }

    @ApiOperation({ summary: 'Datos del payload' })
    @ApiUnauthorizedResponse({ })
    @Private()
    @Get('me')
    getMe(@GetUser() user: Payload) {
        return user;
    }

}