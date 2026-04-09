import { Router, type IRouter } from "express";
import healthRouter from "./health";
import cloneVoiceRouter from "./clone-voice";
import speakRouter from "./speak";
import expandPhraseRouter from "./expand-phrase";
import suggestResponsesRouter from "./suggest-responses";

const router: IRouter = Router();

router.use(healthRouter);
router.use(cloneVoiceRouter);
router.use(speakRouter);
router.use(expandPhraseRouter);
router.use(suggestResponsesRouter);

export default router;
