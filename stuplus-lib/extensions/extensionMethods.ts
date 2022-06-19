
declare global {
    interface String {
        toJSONObject(): object;
    }
    interface Object {
        toJSONString(): string;
    }
}

String.prototype.toJSONObject = function (): object {
    return JSON.parse(String(this));
};

Object.prototype.toJSONString = function (): string {
    return JSON.stringify(this);
};

export { };
