import express from 'express';
const router = express.Router();

router.get("/", (_req, res) => {
  res.json({ 
    statusCode: 200,
    statusMessage: "OK",
    content: {
      message: "pong!"
    }
  });
});

export default router;