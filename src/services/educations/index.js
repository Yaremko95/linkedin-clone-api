const express = require("express");
const Education = require("../../db").Education;
const expCloudinary = require("../../lib/utils/cloudinary/educations");
const passport = require("passport");
const router = express.Router();

router
  .route("/")
  .post(
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      try {
        const { user } = req;
        const image = req.file && req.file.path;
        console.log(image, req.body);
        const { imgUrl, ...rest } = req.body;
        const newData = await Education.create({
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
  .route("/:eduId")
  .put(
    passport.authenticate("jwt", { session: false }),
    async (req, res, next) => {
      try {
        const { user } = req;
        const data = await Education.findByPk(req.params.eduId);
        if (data.userId === user.id) {
          const image = req.file && req.file.path;
          console.log(image, req.body);
          if (image) {
            req.body.imgUrl = image;
          }

          const updatedData = await Education.update(
            { ...req.body, userId: user.id },
            {
              where: { id: req.params.eduId },
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
        const data = await Education.findByPk(req.params.eduId);
        if (data.userId === user.id) {
          await Education.destroy({ where: { id: req.params.eduId } });
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
