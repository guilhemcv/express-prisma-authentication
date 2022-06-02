const auth = require("../services/auth.services");

class authController {
  static register = async (req, res, next) => {
    try {
      const user = await auth.register(req.body);
      res.status(200).json({
        status: true,
        message: "User created successfully",
        data: user,
      });
    } catch (error) {
      next(console.error(error));
    }
  };

  static login = async (req, res, next) => {
    try {
      const data = await auth.login(req.body);
      res
        .status(200)
        .cookie("userToken", data.accessToken, {
          httpOnly: true,
          expires: new Date(Date.now() + 900000),
        })
        .json({
          status: true,
          message: "Account login successful",
          data,
        });
    } catch (error) {
      next(console.error(error));
    }
  };
}
module.exports = authController;
