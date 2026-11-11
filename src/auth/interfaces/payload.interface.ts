import { UserRole } from "../../users/enums/user-role.enum";

export interface Payload {

    id: string;
    name: string;
    role: UserRole;
    
}