import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cloneVoiceRouter from "./clone-voice";
import speakRouter from "./speak";
import expandPhraseRouter from "./expand-phrase";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cloneVoiceRouter);
router.use(speakRouter);
router.use(expandPhraseRouter);

export default router;
