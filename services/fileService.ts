import AWS from "aws-sdk";
import { config } from "../config/config";
import multer from "multer"
import multerS3 from "multer-s3"
AWS.config.update({
    accessKeyId: process.env.ACCESS_KEY_ID_S3 || config.S3.ACCESS_KEY_ID_S3,
    secretAccessKey: process.env.SECRET_ACCESS_KEY_S3 || config.S3.SECRET_ACCESS_KEY_S3,
})
const BUCKET_NAME = process.env.BUCKET_NAME_S3 || config.S3.BUCKET_NAME_S3

export const uploadFileToS3 = (fileContent: any, fileName: string, bucketName: string = BUCKET_NAME) => {
    const params = {
        Bucket: bucketName,
        Key: fileName, // File name you want to save as in S3
        Body: fileContent
    };
    var s3 = new AWS.S3({ params: params });
    // Uploading files to the bucket
    s3.upload(params, function (err: any, data: any) {
        if (err) {
            throw err;
        }
        console.log(`File uploaded successfully. ${data}`);
    });
}

var s3 = new AWS.S3();

export const uploadWithMulterS3 = multer({
    storage: multerS3({
      s3: s3,
      bucket: 'fakultembucket',
      metadata: function (req, file, cb) {
        cb(null, {fieldName: file.fieldname});
      },
      key: function (req, file, cb) {
        cb(null, Date.now().toString())
      }
    })
  })