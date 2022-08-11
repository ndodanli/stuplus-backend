import { ObjectId } from "mongodb";
import { ReportType } from "../enums/enums";

const badWords = [
    "abaza",
    "abazan",
    "ağzına sıçayım",
    "ahmak",
    "am",
    "amarım",
    "ambiti",
    "am biti",
    "amcığı",
    "amcığın",
    "amcığını",
    "amcığınızı",
    "amcık",
    "amcık hoşafı",
    "amcıklama",
    "amcıklandı",
    "amcik",
    "amck",
    "amckl",
    "amcklama",
    "amcklaryla",
    "amckta",
    "amcktan",
    "amcuk",
    "amık",
    "amına",
    "amınako",
    "amına koy",
    "amına koyarım",
    "amına koyayım",
    "amınakoyim",
    "amına koyyim",
    "amına s",
    "amına sikem",
    "amına sokam",
    "amın feryadı",
    "amını",
    "amını s",
    "amın oglu",
    "amınoğlu",
    "amın oğlu",
    "amısına",
    "amısını",
    "amina",
    "amina g",
    "amina k",
    "aminako",
    "aminakoyarim",
    "amina koyarim",
    "amina koyayım",
    "amina koyayim",
    "aminakoyim",
    "aminda",
    "amindan",
    "amindayken",
    "amini",
    "aminiyarraaniskiim",
    "aminoglu",
    "amin oglu",
    "amiyum",
    "amk",
    "amkafa",
    "amk çocuğu",
    "amlarnzn",
    "amlı",
    "amm",
    "ammak",
    "ammna",
    "amn",
    "amna",
    "amnda",
    "amndaki",
    "amngtn",
    "amnn",
    "amona",
    "amq",
    "amsız",
    "amsiz",
    "amsz",
    "amteri",
    "amugaa",
    "amuğa",
    "amuna",
    "ana",
    "anaaann",
    "anal",
    "analarn",
    "anam",
    "anamla",
    "anan",
    "anana",
    "anandan",
    "ananı",
    "ananı",
    "ananın",
    "ananın am",
    "ananın amı",
    "ananın dölü",
    "ananınki",
    "ananısikerim",
    "ananı sikerim",
    "ananısikeyim",
    "ananı sikeyim",
    "ananızın",
    "ananızın am",
    "anani",
    "ananin",
    "ananisikerim",
    "anani sikerim",
    "ananisikeyim",
    "anani sikeyim",
    "anann",
    "ananz",
    "anas",
    "anasını",
    "anasının am",
    "anası orospu",
    "anasi",
    "anasinin",
    "anay",
    "anayin",
    "angut",
    "anneni",
    "annenin",
    "annesiz",
    "anuna",
    "aptal",
    "aq",
    "a.q",
    "a.q.",
    "aq.",
    "ass",
    "atkafası",
    "atmık",
    "attırdığım",
    "attrrm",
    "auzlu",
    "avrat",
    "ayklarmalrmsikerim",
    "azdım",
    "azdır",
    "azdırıcı",
    "babaannesi kaşar",
    "babanı",
    "babanın",
    "babani",
    "babası pezevenk",
    "bacağına sıçayım",
    "bacına",
    "bacını",
    "bacının",
    "bacini",
    "bacn",
    "bacndan",
    "bacy",
    "bastard",
    "basur",
    "beyinsiz",
    "bızır",
    "bitch",
    "biting",
    "bok",
    "boka",
    "bokbok",
    "bokça",
    "bokhu",
    "bokkkumu",
    "boklar",
    "boktan",
    "boku",
    "bokubokuna",
    "bokum",
    "bombok",
    "boner",
    "bosalmak",
    "boşalmak",
    "cenabet",
    "cibiliyetsiz",
    "cibilliyetini",
    "cibilliyetsiz",
    "cif",
    "cikar",
    "cim",
    "çük",
    "dalaksız",
    "dallama",
    "daltassak",
    "dalyarak",
    "dalyarrak",
    "dangalak",
    "dassagi",
    "diktim",
    "dildo",
    "domal",
    "domalan",
    "domaldı",
    "domaldın",
    "domalık",
    "domalıyor",
    "domalmak",
    "domalmış",
    "domalsın",
    "domalt",
    "domaltarak",
    "domaltıp",
    "domaltır",
    "domaltırım",
    "domaltip",
    "domaltmak",
    "dölü",
    "dönek",
    "düdük",
    "eben",
    "ebeni",
    "ebenin",
    "ebeninki",
    "ebleh",
    "ecdadını",
    "ecdadini",
    "embesil",
    "emi",
    "fahise",
    "fahişe",
    "feriştah",
    "ferre",
    "fuck",
    "fucker",
    "fuckin",
    "fucking",
    "gavad",
    "gavat",
    "geber",
    "geberik",
    "gebermek",
    "gebermiş",
    "gebertir",
    "gerızekalı",
    "gerizekalı",
    "gerizekali",
    "gerzek",
    "giberim",
    "giberler",
    "gibis",
    "gibiş",
    "gibmek",
    "gibtiler",
    "goddamn",
    "godoş",
    "godumun",
    "gotelek",
    "gotlalesi",
    "gotlu",
    "gotten",
    "gotundeki",
    "gotunden",
    "gotune",
    "gotunu",
    "gotveren",
    "goyiim",
    "goyum",
    "goyuyim",
    "goyyim",
    "göt",
    "göt deliği",
    "götelek",
    "göt herif",
    "götlalesi",
    "götlek",
    "götoğlanı",
    "göt oğlanı",
    "götoş",
    "götten",
    "götü",
    "götün",
    "götüne",
    "götünekoyim",
    "götüne koyim",
    "götünü",
    "götveren",
    "göt veren",
    "göt verir",
    "gtelek",
    "gtn",
    "gtnde",
    "gtnden",
    "gtne",
    "gtten",
    "gtveren",
    "hasiktir",
    "hassikome",
    "hassiktir",
    "has siktir",
    "hassittir",
    "haysiyetsiz",
    "hayvan herif",
    "hoşafı",
    "hödük",
    "hsktr",
    "huur",
    "ıbnelık",
    "ibina",
    "ibine",
    "ibinenin",
    "ibne",
    "ibnedir",
    "ibneleri",
    "ibnelik",
    "ibnelri",
    "ibneni",
    "ibnenin",
    "ibnerator",
    "ibnesi",
    "idiot",
    "idiyot",
    "imansz",
    "ipne",
    "iserim",
    "işerim",
    "itoğlu it",
    "kafam girsin",
    "kafasız",
    "kafasiz",
    "kahpe",
    "kahpenin",
    "kahpenin feryadı",
    "kaka",
    "kaltak",
    "kancık",
    "kancik",
    "kappe",
    "karhane",
    "kaşar",
    "kavat",
    "kavatn",
    "kaypak",
    "kayyum",
    "kerane",
    "kerhane",
    "kerhanelerde",
    "kevase",
    "kevaşe",
    "kevvase",
    "koca göt",
    "koduğmun",
    "koduğmunun",
    "kodumun",
    "kodumunun",
    "koduumun",
    "koyarm",
    "koyayım",
    "koyiim",
    "koyiiym",
    "koyim",
    "koyum",
    "koyyim",
    "krar",
    "kukudaym",
    "laciye boyadım",
    "lavuk",
    "liboş",
    "madafaka",
    "mal",
    "malafat",
    "malak",
    "manyak",
    "mcik",
    "meme",
    "memelerini",
    "mezveleli",
    "minaamcık",
    "mincikliyim",
    "mna",
    "monakkoluyum",
    "motherfucker",
    "mudik",
    "oc",
    "ocuu",
    "ocuun",
    "OÇ",
    "oç",
    "o. çocuğu",
    "oğlancı",
    "oğlu it",
    "orosbucocuu",
    "orospu",
    "orospucocugu",
    "orospu cocugu",
    "orospu çoc",
    "orospuçocuğu",
    "orospu çocuğu",
    "orospu çocuğudur",
    "orospu çocukları",
    "orospudur",
    "orospular",
    "orospunun",
    "orospunun evladı",
    "orospuydu",
    "orospuyuz",
    "orostoban",
    "orostopol",
    "orrospu",
    "oruspu",
    "oruspuçocuğu",
    "oruspu çocuğu",
    "osbir",
    "ossurduum",
    "ossurmak",
    "ossuruk",
    "osur",
    "osurduu",
    "osuruk",
    "osururum",
    "otuzbir",
    "öküz",
    "öşex",
    "patlak zar",
    "penis",
    "pezevek",
    "pezeven",
    "pezeveng",
    "pezevengi",
    "pezevengin evladı",
    "pezevenk",
    "pezo",
    "pic",
    "pici",
    "picler",
    "piç",
    "piçin oğlu",
    "piç kurusu",
    "piçler",
    "pipi",
    "pipiş",
    "pisliktir",
    "porno",
    "pussy",
    "puşt",
    "puşttur",
    "rahminde",
    "revizyonist",
    "s1kerim",
    "s1kerm",
    "s1krm",
    "sakso",
    "saksofon",
    "salaak",
    "salak",
    "saxo",
    "sekis",
    "serefsiz",
    "sevgi koyarım",
    "sevişelim",
    "sexs",
    "sıçarım",
    "sıçtığım",
    "sıecem",
    "sicarsin",
    "sie",
    "sik",
    "sikdi",
    "sikdiğim",
    "sike",
    "sikecem",
    "sikem",
    "siken",
    "sikenin",
    "siker",
    "sikerim",
    "sikerler",
    "sikersin",
    "sikertir",
    "sikertmek",
    "sikesen",
    "sikesicenin",
    "sikey",
    "sikeydim",
    "sikeyim",
    "sikeym",
    "siki",
    "sikicem",
    "sikici",
    "sikien",
    "sikienler",
    "sikiiim",
    "sikiiimmm",
    "sikiim",
    "sikiir",
    "sikiirken",
    "sikik",
    "sikil",
    "sikildiini",
    "sikilesice",
    "sikilmi",
    "sikilmie",
    "sikilmis",
    "sikilmiş",
    "sikilsin",
    "sikim",
    "sikimde",
    "sikimden",
    "sikime",
    "sikimi",
    "sikimiin",
    "sikimin",
    "sikimle",
    "sikimsonik",
    "sikimtrak",
    "sikin",
    "sikinde",
    "sikinden",
    "sikine",
    "sikini",
    "sikip",
    "sikis",
    "sikisek",
    "sikisen",
    "sikish",
    "sikismis",
    "sikiş",
    "sikişen",
    "sikişme",
    "sikitiin",
    "sikiyim",
    "sikiym",
    "sikiyorum",
    "sikkim",
    "sikko",
    "sikleri",
    "sikleriii",
    "sikli",
    "sikm",
    "sikmek",
    "sikmem",
    "sikmiler",
    "sikmisligim",
    "siksem",
    "sikseydin",
    "sikseyidin",
    "siksin",
    "siksinbaya",
    "siksinler",
    "siksiz",
    "siksok",
    "siksz",
    "sikt",
    "sikti",
    "siktigimin",
    "siktigiminin",
    "siktiğim",
    "siktiğimin",
    "siktiğiminin",
    "siktii",
    "siktiim",
    "siktiimin",
    "siktiiminin",
    "siktiler",
    "siktim",
    "siktim",
    "siktimin",
    "siktiminin",
    "siktir",
    "siktir et",
    "siktirgit",
    "siktir git",
    "siktirir",
    "siktiririm",
    "siktiriyor",
    "siktir lan",
    "siktirolgit",
    "siktir ol git",
    "sittimin",
    "sittir",
    "skcem",
    "skecem",
    "skem",
    "sker",
    "skerim",
    "skerm",
    "skeyim",
    "skiim",
    "skik",
    "skim",
    "skime",
    "skmek",
    "sksin",
    "sksn",
    "sksz",
    "sktiimin",
    "sktrr",
    "skyim",
    "slaleni",
    "sokam",
    "sokarım",
    "sokarim",
    "sokarm",
    "sokarmkoduumun",
    "sokayım",
    "sokaym",
    "sokiim",
    "soktuğumunun",
    "sokuk",
    "sokum",
    "sokuş",
    "sokuyum",
    "soxum",
    "sulaleni",
    "sülaleni",
    "sülalenizi",
    "sürtük",
    "şerefsiz",
    "şıllık",
    "taaklarn",
    "taaklarna",
    "tarrakimin",
    "tasak",
    "tassak",
    "taşak",
    "taşşak",
    "tipini s.k",
    "tipinizi s.keyim",
    "tiyniyat",
    "toplarm",
    "topsun",
    "totoş",
    "vajina",
    "vajinanı",
    "veled",
    "veledizina",
    "veled i zina",
    "verdiimin",
    "weled",
    "weledizina",
    "whore",
    "xikeyim",
    "yaaraaa",
    "yalama",
    "yalarım",
    "yalarun",
    "yaraaam",
    "yarak",
    "yaraksız",
    "yaraktr",
    "yaram",
    "yaraminbasi",
    "yaramn",
    "yararmorospunun",
    "yarra",
    "yarraaaa",
    "yarraak",
    "yarraam",
    "yarraamı",
    "yarragi",
    "yarragimi",
    "yarragina",
    "yarragindan",
    "yarragm",
    "yarrağ",
    "yarrağım",
    "yarrağımı",
    "yarraimin",
    "yarrak",
    "yarram",
    "yarramin",
    "yarraminbaşı",
    "yarramn",
    "yarran",
    "yarrana",
    "yarrrak",
    "yılışık",
    "yilisik",
    "yrrak",
    "zıkkımım",
    "zigsin",
    "zikeyim",
    "zikiiim",
    "zikiim",
    "zikik",
    "zikim",
    "ziksiiin",
    "ziksiin",
    "zulliyetini",
]

export const mapToDTO = (oldObject: Record<string, any>, newObject: Record<string, any>) => {
    for (const oldKey in oldObject) {
        if (Object.hasOwnProperty.call(newObject, oldKey)) {
            oldObject[oldKey] = newObject[oldKey];
        }
        if (removable(oldObject[oldKey])) delete oldObject[oldKey]
    }
};

const removable = (obj: any): Boolean => obj == null || obj == undefined || obj.length == 0;

export const generateCode = () => Math.floor(10000 + Math.random() * 90000);

export const checkIfStudentEmail = (email: string): Boolean => email?.slice(email.length - 7, email.length) === ".edu.tr";

export const checkIfValidSchool = (email: string, emailFormat: string): Boolean => email?.slice(email.indexOf("@") + 1, email.length - 7) === emailFormat;

export const stringify = (obj: any): string => JSON.stringify(obj);

export const flatten: any = (arr: any[]) => arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten), []);

export const reverseArray = (arr: any[]): any[] => {
    const newArr = [];
    for (let i = arr.length - 1; i >= 0; i--) {
        newArr.push(arr[i]);
    }
    return newArr;
}

export const isValidObjectId = (id: string): Boolean => ObjectId.isValid(id);

export const sortByDate = (arr: any[], key: string): any[] => {
    return arr.sort((a, b) => {
        a[key] = new Date(a[key]);
        b[key] = new Date(b[key]);
        if (a[key] < b[key]) return 1;
        if (a[key] > b[key]) return -1;
        return 0;
    });
}

export const searchableWithSpaces = (str: string) => {
    var maxLength = 40;
    let returnString = str.toLowerCase();
    returnString = returnString.replace(/ö/g, 'o');
    returnString = returnString.replace(/ç/g, 'c');
    returnString = returnString.replace(/ş/g, 's');
    returnString = returnString.replace(/ı/g, 'i');
    returnString = returnString.replace(/ğ/g, 'g');
    returnString = returnString.replace(/ü/g, 'u');

    // if there are other invalid chars, convert them into blank spaces
    returnString = returnString.replace(/[^a-z0-9\s-]/g, "");
    // convert multiple spaces and hyphens into one space       
    returnString = returnString.replace(/[\s-]+/g, " ");
    // trims current string
    returnString = returnString.replace(/^\s+|\s+$/g, "");

    // cuts string (if too long)
    if (returnString.length > maxLength)
        returnString = returnString.substring(0, maxLength);

    return returnString;
}


export const searchables = (stringForHashtags: string) => {
    let strArr = stringForHashtags.split(' ');
    let convertedArr = [];
    strArr.unshift(stringForHashtags);
    for (let i = 0; i < strArr.length; i++) {
        let returnString = searchable(strArr[i]);

        if (returnString)
            convertedArr.push(returnString)
    }

    return convertedArr;
}

export const searchable = (str: string) => {
    var maxLength = 40;
    let returnString = str.toLowerCase();
    returnString = returnString.replace(/ö/g, 'o');
    returnString = returnString.replace(/ç/g, 'c');
    returnString = returnString.replace(/ş/g, 's');
    returnString = returnString.replace(/ı/g, 'i');
    returnString = returnString.replace(/ğ/g, 'g');
    returnString = returnString.replace(/ü/g, 'u');

    // if there are other invalid chars, convert them into blank spaces
    returnString = returnString.replace(/[^a-z0-9\s-]/g, "");
    // convert multiple spaces and hyphens into one space       
    returnString = returnString.replace(/[\s-]+/g, " ");
    // trims current string
    returnString = returnString.replace(/^\s+|\s+$/g, "");

    // cuts string (if too long)
    if (returnString.length > maxLength)
        returnString = returnString.substring(0, maxLength);

    returnString = returnString.replace(/\s/g, '')

    return returnString;
}

export const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//chunks an array into smaller arrays of a specific size
export function chunk<T>(arr: T[], size: number): T[][] {
    var chunks = [];
    while (arr.length) {
        chunks.push(arr.splice(0, size));
    }
    return chunks;
}

//detect if file is video by its mime type
export const isVideo = (mimeType: string): Boolean => {
    return mimeType.includes('video');
}

//detect if file is image by its mime type
export const isImage = (mimeType: string): Boolean => {
    return mimeType.includes('image');
}

//remove duplicated strings from an array
export const removeDuplicates = (arr: string[]): string[] => {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

export const sortByCreatedAtDesc = (arr: any[]): any[] => {
    if (arr.length > 1) {
        arr.sort((a, b) => {
            if (a.createdAt > b.createdAt)
                return -1;
            if (a.createdAt < b.createdAt)
                return 1;
            return 0;
        });
    }
    return arr;
}

export const isValidUrl = (url: string): Boolean => {
    try {
        return Boolean(new URL(url));
    }
    catch (e) {
        return false;
    }
}

export function getReportTypeFromValue(value: number): ReportType {
    switch (value) {
        case 0:
            return ReportType.JustDontLike;
        case 1:
            return ReportType.BullyingOrHarassment;
        case 2:
            return ReportType.FalseInformation;
        case 3:
            return ReportType.Spam;
        case 4:
            return ReportType.NudityOrSexualActivity;
        case 5:
            return ReportType.HateSpeechOrSymbols;
        case 6:
            return ReportType.ViolanceOrDangerousOrganizations;
        case 7:
            return ReportType.ScamOrFraud;
        case 8:
            return ReportType.IntellectualPropertyViolation;
        case 9:
            return ReportType.SaleOfIllegalOrRegulatedGoods;
        case 10:
            return ReportType.SuicideOrSelfInjury;
        case 11:
            return ReportType.EatingDisorders;
        case 12:
            return ReportType.Other;
        default:
            return ReportType.Other;
    }
}

export function isIncludingBadWord(str: string): boolean {
    let isBadWord = false;
    const words = str.split(" ");
    for (let i = 0; i < words.length; i++) {
        if (badWords.includes(words[i])) {
            isBadWord = true;
            break;
        }
    }
    return isBadWord;
}