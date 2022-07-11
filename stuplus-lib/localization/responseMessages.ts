const systemLangs: Record<string, Function> = {
    "tr": function (args?: string[]) {
        return {
            profileUpdated: "Profiliniz başarıyla güncellendi.",
            interestsUpdated: "İlgi alanlarınız başarıyla güncellendi.",
            passwordUpdated: "Parolanız başarıyla güncellendi.",
            fpCodeSended: "Parola sıfırlama kodunuz başarıyla e-mail adresinize gönderildi.",
            emailVerified: "Email adresiniz başarıyla doğrulandı.",
            fpVerified: "Parola sıfırlama kodunuz başarıyla doğrulandı.",
            passwordReset: "Parolanız başarıyla sıfırlandı.",
            accountCreated: "Hesabınızı başarıyla oluşturduk ve hesabınızı doğrulamanız için email adresinize bir link gönderdik.",
            announcementAdded: "Duyurunuzu başarıyla oluşturduk.",
            questionAdded: "Sorunuzu başarıyla oluşturduk.",
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
            fileExtError: `İçeriye ${args ? args[0] : "bu uzantının"} tipinde dosya alamıyoruz maalesef, kusura bakmayın.`,
            fileSizeError: `İçeriye ${args ? args[0] : "5 MB"} boyutundan büyük dosya alamıyoruz maalesef, kusura bakmayın.`,
            fileNameTooLongError: `İçeriye "${args ? args[0].length > 20 ? args[0].substring(0, 20) + "..." : args[0] : "x"}" kadar uzun isimli dosya alamıyoruz maalesef, kusura bakmayın.`,
            photoUrlNotFound: "Fotoğraf yolu bulunamadı.",
            ppUpdated: "Profil fotoğrafınızı başarıyla güncelledik. Yeni fotoğrafınızı güle güle kullanın.",
            fileError: "Dosya yüklenirken hata oluştu.",
            emptyError: `${args ? args[0] : "Bu alan"} boş bırakılamaz.`,
            strongPassword: 'Parolanız en az 8 karakterden oluşmalı, en az bir sayı, bir büyük harf ve bir küçük harf içermelidir.',
            lengthTooLong: "Bu değer fazla uzun, bunu içeri alamayız.",
            passwordsDoesntMatch: "Parolalar eşleşmiyor.",
            schoolNotSelected: "Lütfen okulunuzu seçiniz.",
            schoolSelectNotValid: "Lütfen geçerli bir okul seçiniz.",
            facultyNotSelected: "Lütfen fakültenizi seçiniz.",
            facultySelectNotValid: "Lütfen geçerli bir fakülte seçiniz.",
            departmentNotSelected: "Lütfen bölümünüzü seçiniz.",
            departmentSelectNotValid: "Lütfen geçerli bir bölüm seçiniz.",
            gradeNotSelected: "Lütfen bölümünüzü seçiniz.",
            gradeSelectNotValid: "Lütfen geçerli bir sınıf seçiniz.",
            xNotValid: `${args ? args[0] : "Bu alan"} geçerli değil.`,
            xNotFound: `${args ? args[0] : "Bu şey"} bulunamadı.`,
            usernameNotValidLength: "Kullanıcı adı en az 4, en fazla 18 karakterden oluşmalıdır.",
            usernameNotValid: "Kullanıcı adı geçersiz, lütfen uygun bir kullanıcı adı seçiniz.",
            fillInReqFields: "Lütfen gerekli bilgileri doldurun.",
            phoneNumberNotValid: "Telefon numarası geçerli değil. Lütfen belirtilen formatta giriş yapınız.",
            invalidUsernameOrPassword: "Geçersiz kullanıcı adı ya da email.",
            codeNotFound: "Kod bulunamadı.",
            wrongInfo: "Hatalı bilgi.",
            invalidFormat: `Geçersiz format${args ? args[0] : ""}.`,
            minInterest: "En az 3 ilgi alanı seçmeniz gerekli, sizi tanıyalım.",
            googleUserInvalid: "Google kullanıcısı geçersiz. Hesabınıza bir göz atın isterseniz.",
            userNotAuthorized: "Bu işlem için yetkiniz yok. Ne yapmaya çalışıyorsunuz?",
            unknown: "Bilinmiyor",
            unknownError: "Bilinmeyen bir hata oluştu. Arada olur böyle şeyler, çok şey yapma.",
            everyone: "Herkes",
            loginSuccess: "Başarıyla giriş yaptınız :)",
            mustBeArray: "Bu alan bir dizi olmalıdır.",
            unauthorized: "Yetkiniz yok.",
            announcementNotFound: "Duyuru bulunamadı.",
            announcementNotAvailable: "Artık bu duyuruya erişemiyoruz, üzgünüz.",
            alreadyLikedOrDisliked: "Buna zaten oy verdin ki :).",
            alreadyFollowing: "Zaten bu kişiye takip ediyorsun.",
            alreadySentFollowReq: "Bu kişiye zaten takip isteği gönderdin.",
            noUserToUnfollow: "Takibi bırakacak kimseyi bulunamadık. Yok olmuş olabilir.",
            noUserToRemoveFollow: "Takibi silinecek kimseyi bulunamadık. Yok olmuş olabilir.",
            notValidDate: "Geçersiz tarih.",
            messageNotFound: "Mesaj bulunamadı.",
            incorrectId: "Bulunamadı.",
            groupUsersRemovedSuccess: "Kullanıcıları başarıyla uçurduk. Uçan kullanıcılarda bir sorun varsa bize bildir ki bir daha konamasınlar.",
            groupAdminsAddedSuccess: "Yöneticileri başarıyla ekledik.",
            addedToGroup: "aramıza katıldı.",
            removedFromGroup: "aramızdan ayrıldı.",
            newAdmin: "admin oldu.",
            clearPMChatHistoryMeSuccess: "Mesajlarını uçurduk ve senin için tertemiz bir sayfa açtık.",
            clearPMChatHistoryBothSuccess: "Mesajlarınızı uçurduk ve sizin için tertemiz bir sayfa açtık.",
            singleMessageDeletedMeSuccess: "Mesajını uçurduk.",
            singleMessageDeletedBothSuccess: "Mesajı ikinizden de uçurduk.",
            userBlockedSuccess: "Kullanıcıyı engelledik, artık seni rahatsız edemez. Bu kullanıcıyla ilgili bi şikayetin varsa lütfen bize bildir ki ebediyen uçuralım.",
            thisUserBlockedYou: "Bu kullanıcı seni engelledi, daha fazla rahatsız etmemelisin belki de.",
            cantSendMessageFollow: `${args ? args[0] : ""} sadece takip ettiği kişilerden mesaj kabul ediyor.`,
        }
    },
    "en": function (args: string[] = []) {
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
        message = systemLangs["tr"](args)[messageKey] || "MESSAGE_NOT_FOUND";

    return message;
}