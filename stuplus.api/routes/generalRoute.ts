import { Router } from "express";
import logger from "../../stuplus-lib/config/logger";
import { ImageStatisticEntity } from "../../stuplus-lib/entities/BaseEntity";
import { CustomRequest } from "../../stuplus-lib/utils/base/baseOrganizers";
import { InternalError } from "../../stuplus-lib/utils/base/ResponseObjectResults";
import { stringify } from "../../stuplus-lib/utils/general";



const router = Router();

router.post("/updateImageStats", async (req: CustomRequest<any>, res: any) => {
  try {
    const payload = req.body;
    if (payload.token != "spp8sumi2n7mv8f")
      throw new Error("Invalid token");

    for (let i = 0; i < payload.stats.length; i++) {
      const stat = payload.stats[i];
      await ImageStatisticEntity.findOneAndUpdate({
        host: stat.host
      }, {
        totalMasterImage: stat.totalMasterImage,
        totalTransformation: stat.totalTransformation,
        totalSize: stat.totalSize,
        totalBandwidth: stat.totalBandwidth,
        totalView: stat.totalView
      }, {
        upsert: true
      });
    }

  } catch (err: any) {
    logger.error({ err: err }, `notifyReadNotifications failed. {Data}`, stringify({ ErorMessage: err.message }));
  }

  return res.status(200);
});

export default router;
