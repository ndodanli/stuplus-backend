import { CustomRequest } from "../utils/base/baseOrganizers";

export default function customExtensions() {
    return function customExtensionsHandler(req: any, res: any, next: any) {
        req.selectedLanguages = () => getSelectedLanguages(req, res, next)
        return next()
    }
}

function getSelectedLanguages(req: CustomRequest<object>, res: any, next: any) {
    return req.headers["selected-languages"] ? req.headers["selected-languages"].split(",") : ["en"];
}