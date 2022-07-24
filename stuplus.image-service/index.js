const express = require("express");
const app = express();
const port = 3005;
const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const Color = require("color");
const browser = require("browser-detect");
var bodyParser = require('body-parser')
require('dotenv').config()
const {
  isDirectoryEmpty,
  getEndDate,
  createPath,
  getDomainFromUrl,
} = require("./utils");
const { v4: uuidv4 } = require('uuid');
const AsyncLock = require("async-lock");
var lock = new AsyncLock();
module.exports = { lock: lock }
const HostRepo = require("./host");
var hostnames = [];
const storage = "storage";
const {
  Worker
} = require("worker_threads");
const config = require("./config");

app.use(bodyParser.json())
const axiosBackendInstance = axios.create({
  baseURL: process.env.BACKEND_BASEURL,
  timeout: 30000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  }
});
let cpus = require("os").cpus().length;
config.FIXED_NUMBER_OF_THREADS_PARTITION = (cpus * 2) - 1;

hostnames = ["stuplus-bucket.s3.eu-central-1.amazonaws.com"];

setup();

async function setup() {
  await HostRepo.addHosts(hostnames);
  await setStats();
  setInterval(async () => {
    await setStats();
  }, 600000);
  // }, 5000);
}
function isNumeric(x) {
  if (x == null || x == "null" || x == "" || isNaN(parseFloat(x))) {
    return false;
  }
  return true;
}

async function setStats() {
  return new Promise((resolve) => {
    lock.acquire(["key-set-stats"], async function (done) {
      try {
        let functions = [];
        const remainder = HostRepo.Hosts.length % config.FIXED_NUMBER_OF_THREADS_PARTITION;
        let numberOfTasksPerThread;
        let threadCount;
        const largerDirectorySize = config.FIXED_NUMBER_OF_THREADS_PARTITION > HostRepo.Hosts.length
        if (largerDirectorySize) {
          numberOfTasksPerThread = 1;
          threadCount = HostRepo.Hosts.length
        } else {
          numberOfTasksPerThread = Math.floor(HostRepo.Hosts.length / config.FIXED_NUMBER_OF_THREADS_PARTITION);
          threadCount = remainder == 0 ? config.FIXED_NUMBER_OF_THREADS_PARTITION : config.FIXED_NUMBER_OF_THREADS_PARTITION + 1;
        }
        console.time('timer setStats')
        for (let i = 0; i < threadCount; i++) {
          const from = (i * numberOfTasksPerThread)
          const to = (i == threadCount - 1) && !largerDirectorySize ? (((i + 1) * numberOfTasksPerThread) + remainder) : ((i + 1) * numberOfTasksPerThread)
          const selectedHosts = HostRepo.Hosts.slice(from, to);
          if (!selectedHosts.length)
            break;
          functions.push({
            func: statWorkerPromise,
            hosts: selectedHosts,
          });
        }
        Promise.all(functions.map(x => x.func(x.hosts)))
          .then(async () => {
            try {
              if (HostRepo.Hosts.length != 0) {
                const {
                  data
                } = await axiosBackendInstance.post("updateImageStats", {
                  stats: HostRepo.Hosts,
                  token: "spp8sumi2n7mv8f"
                });
              }
            } catch (error) {
              console.log("error setStats: ", error)
            }
            await HostRepo.resetHosts();
            console.timeEnd('timer setStats');
            done();
          })
      } catch (error) {
        console.log("error setStats: ", error);
        done();
      }
    },
      function (err) {
        if (err)
          console.log(err)
        resolve();
      });
  }).catch(err => console.log("err setStats: ", err));
}

const statWorkerPromise = async (hosts) => {
  return new Promise(async (resolve) => {
    const result = await runSetStatsService({
      hosts
    })
    result?.forEach(host => {
      let hostToBeChangeIndex = HostRepo.Hosts.findIndex(x => x.host == host.host)
      if (hostToBeChangeIndex != -1) {
        HostRepo.Hosts[hostToBeChangeIndex].totalMasterImage = host.totalMasterImage;
        HostRepo.Hosts[hostToBeChangeIndex].totalTransformation = host.totalTransformation;
        HostRepo.Hosts[hostToBeChangeIndex].totalSize = host.totalSize;
        HostRepo.Hosts[hostToBeChangeIndex].totalBandwidth = host.totalBandwidth;
        HostRepo.Hosts[hostToBeChangeIndex].totalView = host.totalView;
      }
    })
    resolve();
  }).catch(err => console.log("err statWorkerPromise: ", err));
}

async function runSetStatsService(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./setStats.js', {
      workerData
    });
    worker.on('message', result => {
      resolve(result);
    });
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    })
  }).catch(err => console.log("err runSetStatsService: ", err));
}

app.get("/http*", async (req, res) => {
  res.set("Cache-control", "public, max-age=3000");

  var url = req.path.substring(1);
  var urlParts = url.split("/");
  var fileName = urlParts[urlParts.length - 1];
  res.set("Link", "<" + url + '>;rel="canonical"');

  let domain = getDomainFromUrl(url);
  var hostRegistered = hostnames.includes(domain)

  if (!hostRegistered) {
    return res.status(404).send();
  }


  var mode = req.query.mode;

  if (mode == null || mode == undefined || mode == "null" || mode == "") {
    mode = "cover";
  }

  var availableModes = "contain,cover,fill,inside,outside".split(",");
  if (!availableModes.some((x) => x == mode)) {
    return res.status(400).json({
      status: 400,
      message: "invalid mode."
    });
  }

  var position = req.query.position;

  if (
    position == null ||
    position == undefined ||
    position == "null" ||
    position == ""
  ) {
    position = "centre";
  }

  var availablePositions = "centre,top,right top,right,right bottom,bottom,left,left bottom,left top".split(
    ","
  );
  if (!availablePositions.some((x) => x == position)) {
    return res.status(400).json({
      status: 400,
      message: "invalid position."
    });
  }

  var width = isNumeric(req.query.width) ? parseInt(req.query.width) : null;
  var height = isNumeric(req.query.height) ? parseInt(req.query.height) : null;
  if (width && width < 10 || height && height < 10)
    return res.status(400).send({
      ok: false
    });
  var blur = isNumeric(req.query.blur) ? parseInt(req.query.blur) : null;
  var grayscale = isNumeric(req.query.grayscale) ?
    parseInt(req.query.grayscale) :
    null;
  var disableWebP = isNumeric(req.query.disableWebP) ?
    parseInt(req.query.disableWebP) :
    null;
  var flip = isNumeric(req.query.flip) ? parseInt(req.query.flip) : null;
  var flop = isNumeric(req.query.flop) ? parseInt(req.query.flop) : null;
  var gamma = isNumeric(req.query.gamma) ? parseFloat(req.query.gamma) : null;
  var negate = isNumeric(req.query.negate) ?
    parseFloat(req.query.negate) :
    null;
  var brightness = isNumeric(req.query.brightness) ?
    parseFloat(req.query.brightness) :
    null;
  var hue = isNumeric(req.query.hue) ? parseFloat(req.query.hue) : null;
  var lightness = isNumeric(req.query.lightness) ? parseFloat(req.query.lightness) : null;
  var rotate = isNumeric(req.query.rotate) ?
    parseFloat(req.query.rotate) :
    null;
  var extract = req.query.extract != null ? req.query.extract : null;

  if (extract != null) {
    if (width == null || height == null) {
      return res.status(400).json({
        status: 400,
        message: "extract operation can be used with width and height params.",
      });
    }

    extract = extract.split(",");
    if (extract.length != 4) {
      return res.status(400).json({
        status: 400,
        message: "invalid extract operation, extract params should be top,left,width,height etc (10,10,100,75).",
      });
    }

    for (var i = 0; i < 4; i++) {
      if (!isNumeric(extract[i])) {
        return res.status(400).json({
          status: 400,
          message: "all extract params should be integer.",
        });
      }
    }

    if (width < parseInt(extract[0]) + parseInt(extract[2])) {
      return res.status(400).json({
        status: 400,
        message: "bad extract area. width < (left + extract.width)",
      });
    }

    if (height < parseInt(extract[1]) + parseInt(extract[3])) {
      return res.status(400).json({
        status: 400,
        message: "bad extract area. height < (top + extract.height)",
      });
    }
  }

  if (gamma != null && (gamma > 3 || gamma < 1)) {
    return res.status(400).json({
      status: 400,
      message: "parameter gamma should be between 1 and 3",
    });
  }

  if (brightness != null && brightness < 1) {
    return res.status(400).json({
      status: 400,
      message: "parameter brightness should be bigger than 1",
    });
  }

  var tint = req.query.tint;
  var background = req.query.background;

  var color;

  if (background != null && background != "null" && background != "") {
    var color = "#" + background;
    var color2 = Color("#" + background);
  }

  var cacheString = "";

  var format = "webp";

  const {
    name,
    versionNumber
  } = browser(req.headers["user-agent"]);

  if (name == "ie") {
    format = "png";
  }

  if (name == "safari" && versionNumber < 15) {
    format = "png";
  }

  if (name == "firefox" && versionNumber < 65) {
    format = "png";
  }

  if (name != null && name != undefined && name.toString().indexOf("ope") != -1) {
    format = "png";
  }

  if (domain != null && (domain.toString().indexOf('isbul') != -1 || domain.toString().indexOf('savapa') != -1)) {
    format = "png";
  }

  if (name == "crios") {
    format = "png";
  }

  cacheString += format + "-";

  cacheString += width != null ? width.toString() : "-";
  cacheString += height != null ? height.toString() : "-";
  cacheString += mode != null ? mode.toString() : "-";
  cacheString += position != null ? position.toString() : "-";
  cacheString += blur != null ? blur.toString() : "-";
  cacheString += grayscale != null ? grayscale.toString() : "-";
  cacheString += disableWebP != null ? disableWebP.toString() : "-";
  cacheString += flip != null ? flip.toString() : "-";
  cacheString += flop != null ? flop.toString() : "-";
  cacheString += negate != null ? negate.toString() : "-";
  cacheString += gamma != null ? gamma.toString() : "-";
  cacheString += brightness != null ? brightness.toString() : "-";
  cacheString += lightness != null ? lightness.toString() : "-";
  cacheString += hue != null ? hue.toString() : "-";
  cacheString += rotate != null ? rotate.toString() : "-";
  cacheString += extract != null ? extract.toString() : "-";

  cacheString +=
    background != null && background != "null" && background != "" ?
      background.toString() :
      "-";
  cacheString +=
    tint != null && tint != "null" && tint != "" ?
      tint.toString() :
      "-";

  // cacheString += filePath.replace(/\//g, "-");

  const domainPath = createPath(storage, domain);
  let dateDirectory = null;
  let fileExist = false;

  //kayıtlı olmayan domainlerden gelen dosyaları da cachelemek istediğimiz için her istekte kontrol ediyoruz
  try {
    if (fs.existsSync(domainPath)) {
      if (isDirectoryEmpty(domainPath)) {
        dateDirectory = getEndDate(1);
        fs.mkdirSync(createPath(domainPath, dateDirectory));
        fs.mkdirSync(createPath(domainPath, dateDirectory, fileName));
      } else {
        dateDirectory = fs.readdirSync(domainPath)[0];
        if (!fs.existsSync(createPath(domainPath, dateDirectory, fileName))) {
          fs.mkdirSync(createPath(domainPath, dateDirectory, fileName));
        } else {
          fileExist = fs.existsSync(createPath(domainPath, dateDirectory, fileName, cacheString));
        }
      }
    } else {
      dateDirectory = getEndDate(1);
      fs.mkdirSync(domainPath);
      fs.mkdirSync(createPath(domainPath, dateDirectory));
      fs.mkdirSync(createPath(domainPath, dateDirectory, fileName));
    }
  } catch (err) {
    console.log("err", err)
    return res.status(404).send();
  }
  if (!fileExist) {
    var buffer = await axios({
      method: "get",
      url: url,
      responseType: "arraybuffer",
    })
      .then(function (response) {
        return Buffer.from(response.data, "binary");
      })
      .catch(() => {
        return res.status(404).send();
      });

  } else {
    // goruntulenme olarak ekle
    const stats = fs.statSync(createPath(domainPath, dateDirectory, fileName, cacheString));
    let host = await HostRepo.getHost(domain);
    host.totalView += 1;
    host.totalBandwidth += stats.size;
    return res.sendFile(createPath(__dirname, domainPath, dateDirectory, fileName, cacheString))
  }

  var resSharp = sharp(buffer);

  if (color != null) {
    resSharp.flatten({
      background: color
    });
  }

  resSharp.resize(width, height, {
    fit: mode,
    position: position,
    background: color != null ? color2.object() : {
      r: 0,
      g: 0,
      b: 0,
      alpha: 0
    },
  });

  if (blur != null) {
    resSharp = resSharp.blur(blur);
  }

  if (grayscale != null) {
    resSharp = resSharp.grayscale();
  }

  if (disableWebP == null && format != "png") {
    resSharp = resSharp.webp();
  }

  if (flip != null) {
    resSharp = resSharp.flip();
  }

  if (flop != null) {
    resSharp = resSharp.flop();
  }

  if (gamma != null) {
    resSharp = resSharp.gamma(gamma);
  }

  if (negate != null) {
    resSharp = resSharp.negate();
  }

  if (brightness != null) {
    resSharp = resSharp.modulate({
      brightness: brightness
    });
  }

  if (tint) {
    resSharp = resSharp.tint("#" + tint);
  }

  if (hue != null) {
    resSharp = resSharp.modulate({
      hue: hue
    });
  }

  if (lightness != null) {
    resSharp = resSharp.modulate({
      lightness: lightness
    });
  }

  if (rotate != null) {
    resSharp = resSharp.rotate(rotate);
  }

  if (extract != null) {
    resSharp = resSharp.extract({
      left: parseInt(extract[0]),
      top: parseInt(extract[1]),
      width: parseInt(extract[2]),
      height: parseInt(extract[3]),
    });
  }

  resSharp.toBuffer((err, data) => {
    if (disableWebP == null && format == "webp") {
      res.contentType("image/webp");
    }

    res.send(data);
  });

  if (!fileExist) {
    await resSharp.toFile(createPath(domainPath, dateDirectory, fileName, cacheString));
    const stats = fs.statSync(createPath(domainPath, dateDirectory, fileName, cacheString));
    let host = await HostRepo.getHost(domain);
    if (host) {
      host.totalView += 1;
      host.totalBandwidth += stats.size;
    }
  }
});

app.listen(port, () => {
  console.log(`Image service is running on port ${port}`);
});