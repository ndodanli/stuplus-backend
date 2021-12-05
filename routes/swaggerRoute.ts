import { Router } from "express";
const router = Router();
import swaggerUi from "swagger-ui-express";
var path = require('path');
var swagger_path =  path.resolve(__dirname,'../swagger.yaml');
console.log(swagger_path)
const YAML = require('yamljs');
const swaggerDocument = YAML.load(swagger_path);

router.use('/' , swaggerUi.serve);
router.get('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;
