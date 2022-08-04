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
        MONGODB_URL: "mongodb://admin:QfWSuFYc9sa23cGAqbjRW59EZ@212.98.224.194/Stuplus?retryWrites=true&w=majority&authSource=admin",
        MONGODB_URL_LOCAL: "mongodb://localhost/stuplus",
    },
    JWT_SECRET: "FAKULTEMJWT!!@#!@$!@SECRE@$@$T",
    PORT: 25010,
    GOOGLE_VALIDATION_URL: "https://www.googleapis.com/oauth2/v3/tokeninfo"
}

export {
    config
}