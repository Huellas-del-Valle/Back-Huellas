import { UserResponseDto } from "../../users/dto/user-response.dto";

export interface LoginResponse {

    message: string;
    accessToken: string;
    user: UserResponseDto;

    
}