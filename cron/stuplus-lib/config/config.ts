let config = {
    DOMAIN: process.env.DOMAIN || "http://212.98.224.208",
    EMAIL_SERVICE: {
        HOST_EMAIL: "fakultemdestekmail@gmail.com",
        HOST_EMAIL_PASSWORD: "yqplxujmtvszkwmx"
    },
    S3: {
        ACCESS_KEY_ID_S3: "AKIAZSLROSSN45L3NX63",
        SECRET_ACCESS_KEY_S3: "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",
        BUCKET_NAME_S3: "stuplus-bucket"
    },
    MONGODB: {
        MONGODB_URL: "mongodb+srv://testDevAdmin:63i12lVGGM9li1WB@testdevcluster.zo4yj.mongodb.net/Stuplus?retryWrites=true&w=majority",
        MONGODB_URL_LOCAL: "mongodb://localhost/fakultem",
    },
    JWT_SECRET: "FAKULTEMJWT!!@#!@$!@SECRE@$@$T",
    PORT: 25010,
    GOOGLE_VALIDATION_URL: "https://www.googleapis.com/oauth2/v3/tokeninfo",
    BATCH_SIZES: {
        PM_BATCH_SIZE: 100,
        GM_BATCH_SIZE: 300,
        ANNOUNCEMENT_LD_BATCH_SIZE: 500,
        ANNOUNCEMENT_COMMENT_BATCH_SIZE: 100,
        ANNOUNCEMENT_COMMENT_LD_BATCH_SIZE: 100,
    }
}

export {
    config
}