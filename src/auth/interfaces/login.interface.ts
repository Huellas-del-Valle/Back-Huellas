import { User } from "../../users/entities/user.entity";

export interface LoginResponse {

    message: string;
    data: User;
    accessToken: string;
    
}