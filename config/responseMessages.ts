const systemLangs: Record<string, Function> = {
    "tr-TR": function (args?: string[]) {
        return {
            profileUpdated: "Profiliniz başarıyla güncellendi.",
            interestsUpdated: "İlgi alanlarınız başarıyla güncellendi.",
            passwordUpdated: "Parolanız başarıyla güncellendi.",
            fpCodeSended: "Parola sıfırlama kodunuz başarıyla e-mail adresinize gönderildi.",
            emailVerified: "Email adresiniz başarıyla doğrulandı.",
            fpVerified: "Parola sıfırlama kodunuz başarıyla doğrulandı.",
            passwordReset: "Parolanız başarıyla sıfırlandı.",
            accountCreated: "Hesabınızı başarıyla oluşturduk ve hesabınızı doğrulamanız için email adresinize bir link gönderdik.",
            userNotFound: "Kullanıcı bulunamadı.",
            schoolNotFound: "Okul bulunamadı.",
            passwordNotTrue: "Parolanız doğru değil.",
            passwordCanNotBeSameAsOld: "Yeni parolanız eskisiyle aynı olamaz.",
            userAlreadyRegistered: "Bu kullanıcı zaten kayıtlı.",
            userNotFoundWithEnteredInfo: "Girilen bilgilere ait bir kullanıcımız bulunmamaktadır.",
            userNotFoundWithThisEmail: "Bu e-maile sahip bir kullanıcımız bulunmamaktadır.",
            codeRecentlySent: "Parola sıfırlama kodunuz kısa süre önce gönderildi. Lütfen bir dakika bekleyip tekrar deneyin.",
            noUserFoundWithRelEmail: "İlgili e-maile sahip kullanıcı bulunamadığından doğrulama sağlanamadı.",
            confirmationNotValidExpTime: "Doğrulama adresiniz geçersiz. Biraz geç mi kaldınız? Lütfen tekrar deneyin.",
            confirmationNotValid: "Doğrulama adresiniz geçersiz.",
            codeNotValidExpTime: "Doğrulama kodunuz geçersiz. Biraz geç mi kaldınız? Lütfen tekrar deneyin.",
            codeNotValid: "Doğrulama kodunuz geçersiz.",
            codeNotValidNoTry: "Doğrulama kodunuz geçersiz. Yasadışı işler yapmaya çalışıyorsanız lütfen uzak durun.",
            cantSendWithoutEmailConfirm: "Email adresinizi doğrulamadan bu işlemi gerçekleştiremeyiz. Üzgünüz.",
            schoolNotValid: "Girmiş olduğunuz email adresi seçtiğiniz okula ait değil. Bunu kabul edemeyiz.",
            accountEmailAlreadyConfirmed: "Hesabınızın emailini zaten onayladık, rahat olun.",
            schoolEmailAlreadyConfirmed: "Okulunuzun emailini zaten onayladık, rahat olun.",
            noRecipientsFound: "Email göndermek için geçerli bir adres bulamadık.",
            schoolEmailNotFound: "Email göndermek için geçerli bir okul adresi bulamadık.",
            fileExtError: `İçeriye ${args ? args[0] : "x"} tipinde dosya alamıyoruz maalesef, kusura bakmayın.`,
            fileSizeError: `İçeriye ${args ? args[0] : "x"} boyutundan büyük dosya alamıyoruz maalesef, kusura bakmayın.`,
            fileNameTooLongError: `İçeriye "${args ? args[0] : "x"}" kadar uzun isimli dosya alamıyoruz maalesef, kusura bakmayın.`,
            photoUrlNotFound: "Fotoğraf yolu bulunamadı.",
            ppUpdated: "Profil fotoğrafınızı başarıyla güncelledik. Yeni fotoğrafınızı güle güle kullanın.",
            fileError: "Dosya yüklenirken hata oluştu.",
        }
    },
    "en-US": function (args: string[] = []) {
        return {
        }
    }
}

export const getMessage = (messageKey: string, languages: string[], args?: string[]): string => {
    let message: string = "";
    let language = undefined;
    for (let i = 0; i < languages.length; i++) {
        language = systemLangs[languages[i]];
        if (language) {
            message = language(args)[messageKey];
            break;
        }
    }
    if (!language || !message)
        message = systemLangs["tr-TR"](args)[messageKey] || "MESSAGE_NOT_FOUND";

    return message;
}