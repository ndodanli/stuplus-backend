
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
