import { ObjectId } from "mongodb";

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