import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcrypt";
import { User } from "../users/entities/user.entity";
import { UsersService } from "../users/users.service";
import { LoginUserDto } from "./dto/login-user.dto";
import { LoginResponse } from "./interfaces/login.interface";
import { Payload } from "./interfaces/payload.interface";



@Injectable()
export class AuthService {

    constructor(

        private readonly usersService: UsersService,
        private readonly jwtService: JwtService

    ) { }



    async login(loginDto: LoginUserDto): Promise<LoginResponse> {

            const { password } = loginDto;

            if (loginDto.email === undefined && loginDto.name === undefined) throw new BadRequestException('Se debe proporcionar nombre de usuario o correo electronico para iniciar sesión');

            let user: User|undefined;
            
            if (loginDto.email) user = await this.usersService.findNull.Email(loginDto.email);
                else if (loginDto.name) user = await this.usersService.findNull.Name(loginDto.name);

            if (!user) throw new NotFoundException('Usuario no encontrado');

            const match = await compare(password, user.passwordHash);
            if (!match) throw new BadRequestException('Contraseña incorrecta');

            const payload: Payload = {
                id: user.id,
                name: user.fullName,
                role: user.role
            }
            

            return {
                message: 'Inicio de sesión exitoso',
                data: user,
                accessToken: await this.jwtService.signAsync(payload)
        }

    }
}