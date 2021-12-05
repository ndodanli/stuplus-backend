
export const mapToDTO = (oldObject: Record<string, any>, newObject: Record<string, any>) => {
    for (const oldKey in oldObject) {
        if (Object.hasOwnProperty.call(newObject, oldKey)) {
            oldObject[oldKey] = newObject[oldKey];
        }
        if (oldObject[oldKey] == null || oldObject[oldKey] == undefined) delete oldObject[oldKey]
    }
};

export const generateCode = () => Math.floor(1000 + Math.random() * 9000)