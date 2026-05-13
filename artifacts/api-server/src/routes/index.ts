import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import objectivesRouter from "./objectives";
import salimStepsRouter from "./salim-steps";
import tasksRouter from "./tasks";
import reviewsRouter from "./reviews";
import habitsRouter from "./habits";
import journalRouter from "./journal";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(objectivesRouter);
router.use(salimStepsRouter);
router.use(tasksRouter);
router.use(reviewsRouter);
router.use(habitsRouter);
router.use(journalRouter);
router.use(dashboardRouter);

export default router;
