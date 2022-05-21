export default class BaseResponse<T> {

    hasError: boolean;
    validationErrors: Array<object>;
    data: T | null;
    message: string | null;

    constructor(hasError: boolean = false,
        validationErrors: Array<object> = [],
        data: T | null = null,
        message: string | null = null
    ) {
        this.hasError = hasError;
        this.validationErrors = validationErrors;
        this.data = data;
        this.message = message;
    }

    setMessage(message: string | null = "Bir hata oluştu.") {
        if (this.validationErrors.length) {
            throw new Error("Validasyon hatası varken başarı mesajı oluşturamazsınız.")
        }
        this.hasError = false;
        this.message = message
    }

    setErrorMessage(message: string | null = "Bir hata oluştu.") {
        this.hasError = true;
        this.message = message;
    }
}