const fs = require("fs");
const path = require("path")

/**
 * 
 * @param {string} path 
 * @returns 
 */
function isDirectoryEmpty(path) {
    return fs.readdirSync(path).length === 0;
}

/**
 * 
 * @param {integer} daysToAdd 
 * @returns 
 */
function getEndDate(daysToAdd = 1) {
    let endDate = new Date();
    return endDate.setDate(endDate.getDate() + daysToAdd).toString();
}

/**
 * 
 * @param  {...string} directories 
 */
function createPath(...directories) {
    return path.join(...directories)
}

/**
 * 
 * @param {string} url 
 */
function getDomainFromUrl(url) {
    url = url.replace("https://", "");
    url = url.replace("http://", "");
    url = url.replace("www.", "");
    return url.split("/")[0];
}

/**
 * 
 * @param {string} path 
 * @returns 
 */
function createDirectoryIfNotExist(path) {
    if (!fs.existsSync(path))
        fs.mkdirSync(path);
    return path;
}

module.exports = {
    isDirectoryEmpty,
    getEndDate,
    createPath,
    getDomainFromUrl,
    createDirectoryIfNotExist
};