const { lock } = require("./index.js");

module.exports = class HostRepo {
    static Hosts = [];

    static addHosts(domains) {
        return new Promise((resolve, reject) => {
            lock.acquire(["hosts"], async function (done) {
                for (let i = 0; i < domains.length; i++) {
                    if (!HostRepo.Hosts.some(x => x.host == domains[i]))
                        HostRepo.Hosts.push(new Host(domains[i]))
                }
                done();
            }, function (err, ret) {
                if (err)
                    console.log(err)
                resolve();
            });
        });
    }

    static createHost(host) {
        return new Host(host.host, host.totalMasterImage, host.totalTransformation, host.totalSize, host.totalBandwidth, host.totalView);
    }

    static async getHost(domain) {
        return HostRepo.Hosts.find(x => x.host == domain);
    }

    static resetHosts() {
        return new Promise((resolve, reject) => {
            lock.acquire(["hosts"], async function (done) {
                HostRepo.Hosts = [];
                done();
            }, function (err, ret) {
                if (err)
                    console.log(err)
                resolve();
            });
        });
    }
}

class Host {
    constructor(host, totalMasterImage = 0, totalTransformation = 0, totalSize = 0, totalBandwidth = 0, totalView = 0) {
        this.host = host;
        this.totalMasterImage = totalMasterImage;
        this.totalTransformation = totalTransformation;
        this.totalSize = totalSize;
        this.totalBandwidth = totalBandwidth;
        this.totalView = totalView;
    }
}