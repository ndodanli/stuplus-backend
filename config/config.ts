let config = {
    DOMAIN: process.env.DOMAIN || "http://46.101.160.93",
    EMAIL_SERVICE: {
        HOST_EMAIL: "fakultemdestekmail@gmail.com",
        HOST_EMAIL_PASSWORD: "yqplxujmtvszkwmx"
    },
    S3: {
        ACCESS_KEY_ID_S3: "AKIAZSLROSSN45L3NX63",
        SECRET_ACCESS_KEY_S3: "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",
        BUCKET_NAME_S3: "fakultembucket"
    },
    MONGODB: {
        MONGODB_URL: "mongodb+srv://testDevAdmin:63i12lVGGM9li1WB@testdevcluster.zo4yj.mongodb.net/Stuplus?retryWrites=true&w=majority",
        MONGODB_URL_LOCAL: "mongodb://localhost/fakultem",
    },
    JWT_SECRET: "FAKULTEMJWT!!@#!@$!@SECRE@$@$T",
    PORT: 25010,
    GOOGLE_VALIDATION_URL: "https://www.googleapis.com/oauth2/v3/tokeninfo"
}

export {
    config
}