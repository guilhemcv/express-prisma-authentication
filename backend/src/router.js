const express = require("express");

const user = require("./controllers/auth.controller");
const auth = require("./middleware/auth");
const { ItemController } = require("./controllers");

const router = express.Router();

router.get("/items", ItemController.browse);
router.get("/items/:id", ItemController.read);
router.put("/items/:id", ItemController.edit);
router.post("/items", ItemController.add);
router.delete("/items/:id", ItemController.delete);
router.post("/auth", user.register);
router.post("/auth/login", user.login);
router.post("/test/login", auth, (req, res) => {
  res.json({
    message: "User correctly connected",
  });
});

module.exports = router;
