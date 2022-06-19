export default class NotValidError extends SyntaxError {
    status: Number;
    constructor(message: string, status: Number = 200) {
        super();
        this.message = message;
        this.status = status
    }
}