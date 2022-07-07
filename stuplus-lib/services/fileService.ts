import AWS from "aws-sdk";
import { config } from "../config/config";
import multer from "multer"
import multerS3 from "multer-s3"
import path from "path";
import { getMessage } from "../localization/responseMessages";
import { CustomRequest } from "../utils/base/baseOrganizers";
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID_S3 || config.S3.ACCESS_KEY_ID_S3,
  secretAccessKey: process.env.SECRET_ACCESS_KEY_S3 || config.S3.SECRET_ACCESS_KEY_S3,
})
const BUCKET_NAME = process.env.BUCKET_NAME_S3 || config.S3.BUCKET_NAME_S3

var s3 = new AWS.S3();

export const uploadFileS3 = {
  single: function (fileName: string, allowedExtensions: string[], filePath?: string | null, fileSizeLimit: number = 5242880) {
    return multer({
      storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req: CustomRequest<object>, file, cb) {
          var newFileName = Date.now().toString() + "-" + file.originalname;
          let fullPath = "public/";
          if (filePath)
            fullPath += filePath;
          else if (req.query.uploadPath)
            fullPath += req.query.uploadPath + "/";
          else {
            cb({ message: "No upload path founded." }, file.fieldname)
            return;
          }

          fullPath += newFileName;
          cb(null, fullPath.substring(0, 150))
        }
      }),
      fileFilter: function (req: any, file, callback) {
        var ext = path.extname(file.originalname);
        if (!req.fileValidationErrors)
          req.fileValidationErrors = [];
        if (allowedExtensions && allowedExtensions.length > 0) {
          if (!allowedExtensions.includes(ext.toLowerCase())) {
            req.fileValidationErrors.push({ param: file.fieldname, fileName: file.originalname, msg: getMessage("fileExtError", req.selectedLangs(), [ext]) })
            callback(null, false)
            return;
          }
        }

        if (file.originalname.length > 50) {
          req.fileValidationErrors.push({ param: file.fieldname, fileName: file.originalname, msg: getMessage("fileNameTooLongError", req.selectedLangs(), [file.originalname]) })
          callback(null, false)
          return;
        }

        const fileSize = parseInt(req.headers['content-length']);
        if (fileSize > fileSizeLimit) {
          req.fileValidationErrors.push({ param: file.fieldname, fileName: file.originalname, msg: getMessage("fileSizeError", req.selectedLangs(), ["5 MB"]) })
          callback(null, false)
          return;
        }
        callback(null, true)
      },
    }).single(fileName)
  },
  array: function (fileName: string, allowedExtensions: string[], fileLimit: number = 20, filePath?: string | null, fileSizeLimit: number = 5242880) {
    return multer({
      storage: multerS3({
        s3: s3,
        bucket: BUCKET_NAME,
        metadata: function (req, file, cb) {
          cb(null, { fieldName: file.fieldname });
        },
        key: function (req: CustomRequest<object>, file, cb) {
          var newFileName = Date.now().toString() + "-" + file.originalname;
          let fullPath = "public/";
          if (filePath)
            fullPath += filePath;
          else if (req.query.uploadPath)
            fullPath += req.query.uploadPath + "/";
          else {
            cb({ message: "No upload path founded." }, file.fieldname)
            return;
          }

          fullPath += newFileName;
          cb(null, fullPath.substring(0, 150))
        }
      }),
      fileFilter: function (req: any, file, callback) {
        var ext = path.extname(file.originalname);
        if (!req.fileValidationErrors)
          req.fileValidationErrors = [];
        if (allowedExtensions && allowedExtensions.length > 0) {
          if (!allowedExtensions.includes(ext.toLowerCase())) {
            req.fileValidationErrors.push({ param: file.fieldname, fileName: file.originalname, msg: getMessage("fileExtError", req.selectedLangs(), [ext]) })
            callback(null, false)
            return;
          }
        }

        if (file.originalname.length > 50) {
          req.fileValidationErrors.push({ param: file.fieldname, fileName: file.originalname, msg: getMessage("fileNameTooLongError", req.selectedLangs(), [file.originalname]) })
          callback(null, false)
          return;
        }

        const fileSize = parseInt(req.headers['content-length']);
        if (fileSize > fileSizeLimit) {
          req.fileValidationErrors.push({ param: file.fieldname, fileName: file.originalname, msg: getMessage("fileSizeError", req.selectedLangs(), ["5 MB"]) })
          callback(null, false)
          return;
        }
        callback(null, true)
      },
    }).array(fileName, fileLimit)
  }
}

