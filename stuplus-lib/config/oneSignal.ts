const OneSignal = require("@onesignal/node-onesignal");
import { app_key_provider } from "./config";

const configuration = OneSignal.createConfiguration({
    authMethods: {
        app_key: {
            tokenProvider: app_key_provider
        }
    }
});
const oneSignalClient = new OneSignal.DefaultApi(configuration);

export default oneSignalClient;