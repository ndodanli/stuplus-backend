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

export const hashtaggable = (phrase: string) => {
    var maxLength = 40;

    var returnString = phrase.toLowerCase();
    //Convert Characters
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
    // add hyphens
    return returnString;
}
let generateHashtag = function (str: string) {
    str = hashtaggable(str)

    str = str.replace(/\s+/g, ' ') // remove extra ' '
        .replace(/[\'\".,\/#!$%\\^&\*;:{}=\-_`~()\[\]|+@?<>]/g, '')
        .replace(/\s{2,}/g, ' '); // remove extra ' ' from punctuation
    if (str === '') { // if str is empty return ''
        return '';
    } else { // else generate hashtag

        let capEachWord = (str: string) => str
            .trim() // trim spaces around str
            //.toLowerCase() // default to lower case (optional)
            .split(' ') // Split str to array of substrings
            .map(word => word[0] + word.slice(1))
            .join('') // join array to string
        // prepend #

        // return hashtagIt(capEachWord(str)); // return hashtag result
        return capEachWord(str); // return hashtag result
    }
}

export const generateHashtags = function (stringForHashtags: string): string[] {
    let strArr = stringForHashtags.split(' ');
    let convertedArr: string[] = [];
    strArr.unshift(generateHashtag(stringForHashtags))
    for (let i = 0; i < strArr.length; i++) {
        let str = strArr[i];
        str = hashtaggable(str)

        str = str.replace(/\s+/g, ' ') // remove extra ' '
            .replace(/[\'\".,\/#!$%\\^&\*;:{}=\-_`~()\[\]|+@?<>]/g, '')
            .replace(/\s{2,}/g, ' '); // remove extra ' ' from punctuation
        if (str !== '') { // if str is empty return ''
            let capEachWord = (str: string) => str
                .trim() // trim spaces around str
                //.toLowerCase() // default to lower case (optional)
                .split(' ') // Split str to array of substrings
                .map(word => word[0] + word.slice(1))
                .join('') // join array to string
            // prepend #

            // return hashtagIt(capEachWord(str)); // return hashtag result
            convertedArr.push(capEachWord(str)); // return hashtag result
        }
    }
    convertedArr.unshift(generateHashtag(stringForHashtags))

    return strArr;
}
let hashtagIt = (str: string) => '#' + str;

export const generateRandomNumber = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}