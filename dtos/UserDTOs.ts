import { Role } from "../enums/enums"
export default class UserDTO {
    FirstName: string | null;
    LastName: string | null;
    Email: string | null;
    Password: string;
    Role: Role | null

    constructor(obj: any) {
        this.FirstName = null;
        this.LastName = null;
        this.Email = null;
        this.Password = "";
        this.Role = null
        if (obj) {
            Object.assign(this, obj)
        }
    }
}