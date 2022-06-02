# PRISMA AND EXPRESS FOR AUTHENTICATION

##  INITIALIZATION PRISMA

- Clone this project and run `npm run setup`
- Create a new Database and launch your mysql server 
- On the cloned project, move to the backend folder
- Install these dependencies : `npm install prisma bcrypt jsonwebtoken @prisma/client`
- Run the command `npx prisma init` which will create a Prisma folder and a schema for our database
- Create a .env file in which you will add these keys :
```
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/nom_BDD" (change the informations according to the database you have just created)

ACCESS_TOKEN_SECRET=<CUSTOM_ACCESS_TOKEN>

APP_PORT=5005
FRONTEND_URL=http://localhost:3000
DB_HOST=localhost
DB_USER=user (change with your informations)
DB_PASSWORD=password (change with your informations)
DB_NAME=name_of_the_database (change with your informations)
```
- In the Prisma folder, on the schema, modify the datasource db and create a new model User :
 ```
datasource db { 
provider = "mysql" 
url = env("DATABASE_URL") 
}

model User { 
id Int @id @default(autoincrement()) 
email String @unique 
name String? 
password String? 
}
```
- Now, you need to create a migration in order to update your database :
`npx prisma migrate dev --name "init" --preview-feature`
With this command, a new folder migration is created in Prisma folder.

# SETTING UP THE ROUTES IN EXPRESS

- In the src folder, create 3 new folders : utils, services, middleware
- In the utils folder, we are going to setup our tokens. Create a file jwt.js
- First step, import the dependencies needed and add a signAccessToken :
```
const jwt = require("jsonwebtoken");
require("dotenv").config();


const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
module.exports = {
  signAccessToken(payload) {
    return new Promise((resolve, reject) => {
      jwt.sign({ payload }, accessTokenSecret, {}, (err, token) => {
        if (err) {
          console.log(err);
        }
        resolve(token);
      });
    });
  },
  ```
  - second step, adding a verifyAccessToken :
  ```
  verifyAccessToken(token) {
    return new Promise((resolve, reject) => {
      jwt.verify(token, accessTokenSecret, (err, payload) => {
        if (err) {
          const message =
            err.name == "JsonWebTokenError" ? "Unauthorized" : err.message;
          reject(message);
        }
        resolve(payload);
      });
    });
  },
};
```
- in the services folder, create a new file auth.services.js. This file will store our prisma requests.
- First step, import the dependencies needed and create a new error to throw :
```
const prisma = new PrismaClient();
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("../utils/jwt");

const throwError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  error.message = message;
  throw error;
};
```
- Second step, create a new AuthService Class in which we will define to function : register and login.
```
class AuthService {
  static async register(data) {
    data.password = bcrypt.hashSync(data.password, 8);
    const user = await prisma.user.create({
      data,
    });
    data.accessToken = await jwt.signAccessToken(user);
    return data;
  }

  static async login(data) {
    const { email, password } = data;
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });
    if (!user) {
      throwError("User not found");
    }
    const checkPassword = bcrypt.compareSync(password, user.password);
    if (!checkPassword) {
      throwError("Password is incorrect");
    }
    delete user.password;
    const accessToken = await jwt.signAccessToken(user);
    return { ...user, accessToken };
  }
}

module.exports = AuthService;
```
- Great ! grab a coffee, we are at the middle of the workshop ! ☕️
- In the controllers folder, create a new file auth.controller.js. This file will store some middlewares to control if the user is registered or logged in.
- We are going to create a new authController class in which we wille defined two middlewares register and login :
```
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
      res.status(200).cookie("userToken", data.accessToken, {
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

```
- In the middleware folder, create a new file auth.js. This one is for token verification.
- Now we need to create a auth function that will verify the token :
```
const jwt = require("../utils/jwt");

const auth = async (req, res, next) => {
  if (!req.headers.cookie) {
    return res.status(401).json({
      status: 401,
      error: "You are not authorized to access this resource",
    });
  }
  const token = req.headers.cookie.split("=")[1];
  if (!token) {
    return res.status(401).json({
      status: 401,
      error: "You are not authorized to access this resource",
    });
  }
  await jwt
    .verifyAccessToken(token)
    .then((user) => {
      console.warn("no user", user);
      req.user = user;
      next();
    })
    .catch((e) => {
      console.error(e);
      return res.status(401).json({
        status: 401,
        error: "You are not authorized to access this resource",
      });
    });
};
module.exports = auth;

```
- last step, in the src folder, open the router.js file. We need to create our routes post to add and verify users :
(⚠️ for this step, don't remove the others created routes in the file, they can be usefull for the rest of your application !)
```
const express = require("express");
const user = require("./controllers/auth.controller")
const auth = require("./middleware/auth");
const router = express.Router();

router.post("/auth", user.register);
router.post("/auth/login", user.login);
router.post("/test/login", auth, (req, res) => {
  res.json({
    message: "User correctly connected",
  });
});

module.exports = router;
```

## TESTING OUR SETUP IN POSTMAN

#### Creating a new user
- add a new POST request on `http://localhost:5005/auth`
- in the body of the request (JSON format...) create a new user :
```
{
    "email" : "johndoe@gmail.com",
    "name" : "John Doe",
    "password" : "newpassword"
}
```
- you should see in the response a "true" status with the "User created successfully"

#### Loggin a user

- add a new POST request on `http://localhost:5005/auth/login`
- in the body of the request (JSON format...) create a new user :
```
{
    "email" : "johndoe@gmail.com",
    "password" : "newpassword"
}
```
- you should see in the response a message "user correctly connected"

#### Testing the cookie
- add a new POST request on `http://localhost:5005/test/login`
- you should see in the response a "true" status with the "Account login successfully"

### 🎉 Congrats, you just create an authentication with Prisma and Express
