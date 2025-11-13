import HomePage from "../pages/home/home-page";
import Login from "../pages/auth/login.js";
import Register from "../pages/auth/register.js";
import AddStory from "../pages/add/add-story.js";
import BookmarkPage from "../pages/bookmark/bookmark-page.js";


const routes = {
  "/": new HomePage(),
  "/login": new Login(),
  "/register": new Register(),
  "/add": new AddStory(),
  "/bookmark": new BookmarkPage(),
};

export default routes;