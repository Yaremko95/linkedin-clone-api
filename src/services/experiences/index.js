const express = require("express");
const Experience = require("../../db").Experience;
const expCloudinary = require("../../lib/utils/cloudinary/experiences");
const passport = require("passport");
const router = express.Router();

router
  .route("/")
  .post(
    passport.authenticate("jwt", { session: false }),
    expCloudinary.single("image"),
    async (req, res, next) => {
      try {
        const { user } = req;
        const image = req.file && req.file.path;
        console.log(image, req.body);
        const { imgUrl, ...rest } = req.body;
        const newData = await Experience.create({
          ...rest,
          imgUrl: image ? image : "",
          userId: req.user.id,
        });
        res.send(newData);
      } catch (e) {
        console.log(e);
        next(e);
      }
    }
  );
router
  .route("/:userId")
  .get(
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      try {
        const data = await Experience.findAll({
          where: { userId: req.params.userId },
          order: [["startDate", "DESC"]],
        });
        console.log(data);
        res.send(data);
      } catch (e) {
        console.log(e);
        next(e);
      }
    }
  );
router
  .route("/:expId")
  .put(
    passport.authenticate("jwt", { session: false }),
    expCloudinary.single("image"),
    async (req, res, next) => {
      try {
        const { user } = req;
        const data = await Experience.findByPk(req.params.expId);
        if (data.userId === user.id) {
          const image = req.file && req.file.path;
          console.log(image, req.body);
          if (image) {
            req.body.imgUrl = image;
          }

          const updatedData = await Experience.update(
            { ...req.body, userId: user.id },
            {
              where: { id: req.params.expId },
              returning: true,
            }
          );
          res.send(updatedData);
        } else {
          res.status(401).send("Unauthorized");
        }
      } catch (e) {
        console.log(e);
        next(e);
      }
    }
  )
  .delete(
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      try {
        const { user } = req;
        const data = await Experience.findByPk(req.params.expId);
        if (data.userId === user.id) {
          await Experience.destroy({ where: { id: req.params.expId } });
          res.send("ok");
        } else {
          res.status(401).send("Unauthorized");
        }
      } catch (e) {
        console.log(e);
        next(e);
      }
    }
  );

module.exports = router;
