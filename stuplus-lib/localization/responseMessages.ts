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
            cantSendWithoutEmailConfirm: "Email adresini doğrulamadan bu işlemi gerçekleştiremeyiz. Üzgünüz.",
            schoolNotValid: "Girmiş olduğunuz email adresi seçtiğiniz okula ait değil. Bunu kabul edemeyiz.",
            accountEmailAlreadyConfirmed: "Hesabınızın emailini zaten onayladık, rahat ol.",
            schoolEmailAlreadyConfirmed: "okulunun emailini zaten onayladık, rahat ol.",
            noRecipientsFound: "Email göndermek için geçerli bir adres bulamadık.",
            schoolEmailNotFound: "Email göndermek için geçerli bir okul adresi bulamadık.",
            fileExtError: `İçeriye ${args ? args[0] : "bu uzantının"} tipinde dosya alamıyoruz maalesef, kusura bakmayın.`,
            fileSizeError: `İçeriye ${args ? args[0] : "5 MB"} boyutundan büyük dosya alamıyoruz maalesef, kusura bakmayın.`,
            fileNameTooLongError: `İçeriye "${args ? args[0].length > 20 ? args[0].substring(0, 20) + "..." : args[0] : "x"}" kadar uzun isimli dosya alamıyoruz maalesef, kusura bakma.`,
            photoUrlNotFound: "Fotoğraf yolu bulunamadı.",
            ppUpdated: "Profil fotoğrafınızı başarıyla güncelledik. Yeni fotoğrafınızı güle güle kullanın.",
            fileError: "Dosya yüklenirken hata oluştu.",
            emptyError: `${args ? args[0] : "Bu alan"} boş bırakılamaz.`,
            strongPassword: 'Parolanız en az 8 karakterden oluşmalı, en az bir sayı, bir büyük harf ve bir küçük harf içermelidir.',
            lengthTooLong: "Bu değer fazla uzun, bunu içeri alamayız.",
            passwordsDoesntMatch: "Parolalar eşleşmiyor.",
            schoolNotSelected: "Lütfen okulunu seç.",
            schoolSelectNotValid: "Lütfen geçerli bir okul seç.",
            facultyNotSelected: "Lütfen fakülteni seç.",
            facultySelectNotValid: "Lütfen geçerli bir fakülte seç.",
            departmentNotSelected: "Lütfen bölümünüzü seç.",
            departmentSelectNotValid: "Lütfen geçerli bir bölüm seç.",
            gradeNotSelected: "Lütfen bölümünüzü seç.",
            gradeSelectNotValid: "Lütfen geçerli bir sınıf seç.",
            xNotValid: `${args ? args[0] : "Bu alan"} geçerli değil.`,
            xNotFound: `${args ? args[0] : "Bu şey"} bulunamadı.`,
            usernameNotValidLength: "Kullanıcı adı en az 4, en fazla 18 karakterden oluşmalıdır.",
            usernameNotValid: "Kullanıcı adı geçersiz, lütfen uygun bir kullanıcı adı seç.",
            fillInReqFields: "Lütfen gerekli bilgileri doldurun.",
            phoneNumberNotValid: "Telefon numarası geçerli değil. Lütfen belirtilen formatta giriş yapınız.",
            invalidUsernameOrPassword: "Geçersiz kullanıcı adı ya da email.",
            codeNotFound: "Kod bulunamadı.",
            wrongInfo: "Hatalı bilgi.",
            invalidFormat: `Geçersiz format${args ? args[0] : ""}.`,
            minInterest: "En az 3 ilgi alanı seçmeniz gerekli, seni tanıyalım.",
            googleUserInvalid: "Google kullanıcısı geçersiz. Hesabınıza bir göz atın isterseniz.",
            userNotAuthorized: "Bu işlem için yetkiniz yok. Ne yapmaya çalışıyorsunuz?",
            unknown: "Bilinmiyor",
            unknownError: "Bilinmeyen bir hata oluştu. Arada olur böyle şeyler, çok şey yapma.",
            everyone: "Herkes",
            loginSuccess: "Başarıyla giriş yaptınız :)",
            mustBeArray: "Bu alan bir dizi olmalıdır.",
            unauthorized: "Yetkin yok. Yanlış işler peşindeysen hemen vazgeç.",
            announcementNotFound: "Duyuru bulunamadı.",
            announcementNotAvailable: "Artık bu duyuruya erişemiyoruz, üzgünüz.",
            alreadyLikedOrDisliked: "Buna zaten oy verdin ki :).",
            alreadyFollowing: "Bu kişiyi zaten takip ediyorsun.",
            alreadySentFollowReq: "Bu kişiye zaten takip isteği gönderdin.",
            noUserToUnfollow: "Takibi bırakacak kimseyi bulunamadık. Yok olmuş olabilir.",
            noUserToRemoveFollow: "Takibi silinecek kimseyi bulunamadık. Yok olmuş olabilir.",
            notValidDate: "Geçersiz tarih.",
            messageNotFound: "Mesaj bulunamadı.",
            incorrectId: "Id geçersiz, yanlış işler peşindeysen hemen bırak.",
            groupUsersRemovedSuccess: "Kullanıcıları başarıyla uçurduk. Uçan kullanıcılarda bir sorun varsa bize bildir ki bir daha konamasınlar.",
            groupUsersRemovedGuardSuccess: "Kullanıcıları uçururken beni silmek istediğini gördüm ve çok üzüldüm. Lütfen beni üzmeyin :'(.",
            groupAdminsAddedSuccess: "Yöneticileri başarıyla ekledim.",
            addedToGroup: "aramıza katıldı.",
            removedFromGroup: "aramızdan ayrıldı.",
            newAdmin: "admin oldu.",
            clearPMChatHistoryMeSuccess: "Mesajlarını uçurduk ve senin için tertemiz bir sayfa açtık.",
            clearPMChatHistoryBothSuccess: "Mesajlarınızı uçurduk ve sizin için tertemiz bir sayfa açtık.",
            singleMessageDeletedMeSuccess: "Mesajını uçurduk.",
            singleMessageDeletedBothSuccess: "Mesajı ikinizden de uçurduk.",
            userBlockedSuccess: "Kullanıcıyı engelledik, artık seni rahatsız edemez. Bu kullanıcıyla ilgili bi şikayetin varsa lütfen bize bildir ki ebediyen uçuralım.",
            userUnblockedSuccess: "Kullanıcının engelini kaldırdık ve sorunlarınızı çözdüğünüze sevindik. Yine de bir sorun olduğunu düşünüyorsan lütfen bize bildir ki ebediyen uçuralım.",
            thisUserBlockedYou: "Bu kullanıcı seni engelledi, daha fazla rahatsız etmemelisin belki de.",
            cantSendMessageFollow: `${args ? args[0] : ""} sadece takip ettiği kişilerden mesaj kabul ediyor.`,
            reportSuccess: "Şikayetin bize ulaştı. Olabildiğince hızlı harekete geçeceğiz, teşekkür ederiz.",
            invalidObjectId: "Geçersiz objekt id. Ne ayaksın?",
            groupChatNotFound: "Bu grubu bulamadık.",
            groupChatUserNotFound: "Seni bu grupta bulamadık, dolayısıyla da çıkaramadık.",
            leaveGroupSuccess: "Başarıyla gruptan ayrıldın, tebrikler.",
            groupCreatedSuccess: "grubunu başarıyla oluşturdum, güzel güzel konuşalım, anlaşalım.",
            groupUpdatedSuccess: "Grubu başarıyla güncelledim.",
            groupCreatedGuardSuccess: "grubunu başarıyla oluşturdum, güzel güzel konuşalım, anlaşalım. Ayrıca beni gruba eklemene gerek yok, grubu ben kuruyorum zaten.",
            groupUsersAddedSuccess: "Kullanıcıları başarıyla ekledim.",
            groupUsersAddedGuardSuccess: "Kullanıcıları başarıyla ekledim. Beni gruba eklemene gerek yok, ben zaten her yerdeyim...",
            usernameAlreadyExists: "Bu kullanıcı adı zaten var, başka bir şey seçsen?.",
            groupAdminsAddedGuardSuccess: "Yaa, şapşik. Sen beni admin mi yapmak istedin =). İstediğin kullanıcıları yönetici yaptım.",
            lastNameUpdateLimit: "Soyadını değiştireli çok olmadı, haftada bir kereye müsade ediyoruz. Tekrar değiştirebileceğin tarihi veriyorum,",
            firstNameUpdateLimit: "Adını değiştireli çok olmadı, haftada bir kereye müsade ediyoruz. Tekrar değiştirebileceğin tarihi veriyorum,",
            usernameUpdateLimit: "Kullanıcı adını sürekli değiştirmemelisin, haftada bir kereye müsade ediyoruz. Tekrar değiştirebileceğin tarihi veriyorum,",
            userBlockedShowProfile: "Bu kullanıcıdan uzak dur.",
            userBlockedFollowReq: "Bu kullanıcıdan uzak dur.",
            schoolUpdatedUser: "Okulunu başarıyla güncelledik, artık sen de bizden birisin, aramıza hoş geldin.",
            hashTagsLimitError: "Çok fazla hashgtag kullandın, en fazla 20 tane kullanabilirsin.",
            groupRemovedSuccess: "Grubu başarıyla sildik.",
            removeUsersLimit: "Çok fazla kullanıcı silmek istedin, bir sorun mu var? Varsa destek ekibine(o da biziz =) ) bildir lütfen. Bu arada en fazla 50 tanesini aynı anda silebilirsin.",
            groupHasNoMemberCannotDelete: "Bu grubun hiç üyesi yok ki sileyim, kendini silme de kapat git madem.",
            cannotRemoveOwner: "Yöneticini silmek? Buna izin veremem, kim yönetecek bizi sonra?",
            privacySettingsUpdated: "Gizlilik ayarlarınızı başarıyla güncelledik.",
            dailyCommentLimitExceeded: "Bugünlük bu kadar yorum yeter, yarın tekrar dene",
            dailyLikeLimitExceeded: "Bugünlük bu kadar beğenme yeter, yarın tekrar dene",
            dailyNewPMLimitExceeded: "Bugünlük bu kadar yeni mesaj yeter, yarın tekrar dene",
            dailyFollowLimitExceeded: "Bugünlük bu kadar takip yeter, yarın tekrar dene",
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