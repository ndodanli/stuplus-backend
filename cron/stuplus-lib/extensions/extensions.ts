import { CustomRequest } from "../utils/base/baseOrganizers";

export default function customExtensions() {
    return function customExtensionsHandler(req: any, res: any, next: any) {
        req.selectedLangs = () => getselectedLangs(req, res, next)
        return next()
    }
}

function getselectedLangs(req: CustomRequest<object>, res: any, next: any) {
    const sLangs = req.headers["selected-languages"];
    return sLangs && typeof sLangs === "string" ? sLangs.split(",") : ["tr"];
}