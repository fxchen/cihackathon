import React, { useState, useEffect } from "react";
import { BrowserRouter, Switch, Route, useHistory } from "react-router-dom";
import { AppContext } from "./libs/contextLib";
import NavMenu from "./components/NavMenu";
import Layout from "./components/Layout";
import Login from "./containers/Login";
import Logout from "./containers/Logout";
import Profile from "./containers/Profile";
import Algorithms from "./containers/Algorithms";
import AlgorithmList from "./containers/AlgorithmList";
import NewAlgorithm from "./containers/NewAlgorithm";
import { Auth, Logger } from "aws-amplify";

const logger = new Logger("Router", "DEBUG");

const Router = () => {
  // eslint-disable-next-line
  const history = useHistory();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [user, setUser] = useState({});
  const [current, setCurrent] = useState("home");

  useEffect(() => {
    onLoad();
    setRoute();
    window.addEventListener("hashchange", setRoute);
    return () => window.removeEventListener("hashchange", setRoute);
  }, [isAuthenticating]);

  function setRoute() {
    const location = window.location.href.split("/");
    const pathname = location[location.length - 1];
    setCurrent(pathname ? pathname : "home");
  }

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
      const data = await Auth.currentUserPoolUser();
      setUser({ username: data.username, ...data.attributes });
    } catch (e) {
      if (e !== "No current user") {
        logger.debug(e);
      }
    }
    setIsAuthenticating(false);
  }

  return (
    <>
      <Layout>
        <AppContext.Provider 
            value={{ 
                isAuthenticated: isAuthenticated,
                isAuthenticating: isAuthenticating,
                setIsAuthenticating: setIsAuthenticating,
                userHasAuthenticated: userHasAuthenticated,
                user: user,
                setUser: setUser
            }}
        >
        <NavMenu current={current} />
          <BrowserRouter>
            <Switch>
              <Route exact path="/" component={Login} />
              <Route exact path="/algorithms" component={AlgorithmList} />
              <Route exact path="/algorithms/:id" component={Algorithms} />
              <Route exact path="/create" component={NewAlgorithm} />
              <Route exact path="/profile" component={Profile} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/logout" component={Logout} />
            </Switch>
          </BrowserRouter>
        </AppContext.Provider>
      </Layout>
    </>
  );
};

export default Router;
