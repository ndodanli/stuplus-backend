const {
    workerData,
    parentPort
} = require('worker_threads');

const fs = require("fs");
const {
    createPath, isDirectoryEmpty
} = require('./utils');

const storage = "storage";

let {
    hosts
} = workerData;

try {
    for (let k = 0; k < hosts.length; k++) {
        let host = hosts[k];
        const domainPath = createPath(__dirname, storage, host.host);
        if (fs.existsSync(domainPath) && !isDirectoryEmpty(domainPath)) {
            let dateDirectory = fs.readdirSync(domainPath)[0];
            const domainFilesPath = createPath(domainPath, dateDirectory);
            const masterImageFiles = fs.readdirSync(domainFilesPath);
            if (masterImageFiles != null) {
                host.totalMasterImage = masterImageFiles.length;
                for (let i = 0; i < masterImageFiles.length; i++) {
                    const masterImageFile = masterImageFiles[i];
                    const typeFiles = fs.readdirSync(createPath(domainFilesPath, masterImageFile));
                    if (typeFiles != null) {
                        host.totalTransformation += typeFiles.length;
                        for (let j = 0; j < typeFiles.length; j++) {
                            const typeFile = typeFiles[j];
                            const stats = fs.statSync(createPath(domainFilesPath, masterImageFile, typeFile));
                            host.totalSize += stats.size;
                        }
                    }
                }
                host.totalSize /= 1024 * 1024;
            }
        }
    }
} catch (error) {
    console.log("setStats Worker error: ", error)
}
parentPort.postMessage(hosts);