
interface String {
    toJSONObject(): object;
}

String.prototype.toJSONObject = function () {
    return JSON.parse(String(this))
};
