import { ObjectId } from "mongodb";
import { ReportType } from "../enums/enums";

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