import { Router } from "express";
import dataPlanController from "../controllers/dataPlan.controller";
import { authenticateAdmin } from "../middlewares/auth.middleware";

const router = Router();

// All routes require admin authentication
router.post("/", authenticateAdmin, (req, res, next) =>
  dataPlanController.createDataPlan(req, res, next)
);

router.get("/", authenticateAdmin, (req, res, next) =>
  dataPlanController.getDataPlans(req, res, next)
);

router.get("/network/:networkName/types", authenticateAdmin, (req, res, next) =>
  dataPlanController.getPlanTypes(req, res, next)
);

router.get(
  "/network/:networkName/type/:planType",
  authenticateAdmin,
  (req, res, next) =>
    dataPlanController.getDataPlansByNetworkAndType(req, res, next)
);

router.get("/:id", authenticateAdmin, (req, res, next) =>
  dataPlanController.getDataPlanById(req, res, next)
);

router.patch("/:id", authenticateAdmin, (req, res, next) =>
  dataPlanController.updateDataPlan(req, res, next)
);

router.delete("/:id", authenticateAdmin, (req, res, next) =>
  dataPlanController.deleteDataPlan(req, res, next)
);

export default router;

