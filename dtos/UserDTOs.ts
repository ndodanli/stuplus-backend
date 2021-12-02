import { Role } from "../enums/enums"
export default class UserDTO {
    FirstName: string | null;
    LastName: string | null;
    Email: string;
    Password: string;
    Role: Role | null;
    Title: string | null;

    constructor(obj: any) {
        this.FirstName = null;
        this.LastName = null;
        this.Email = "";
        this.Password = "";
        this.Role = null;
        this.Title = null;
        if (obj) {
            Object.assign(this, obj)
        }
    }
}