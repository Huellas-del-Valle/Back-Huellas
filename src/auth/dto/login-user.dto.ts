import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";


export class LoginUserDto {

    @ApiProperty()
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    email?: string;

    @ApiProperty()
    @IsString()
    password: string;

}