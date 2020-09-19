import React, { useEffect } from "react";
import { Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";

const logger = new Logger("Profile", "DEBUG");

export default function Profile(props) {
  const { isAuthenticated, isAuthenticating, user } = useAppContext();

  useEffect(() => {
    function onLoad() {
      if (!isAuthenticating && !isAuthenticated) {
        logger.debug('user is not authenticated')
        props.history.push("/login");
      }
    }
    onLoad();
  }, [isAuthenticating, isAuthenticated, props]);

  return (
    !isAuthenticating && (
    <>
      <Container>
        <h1>Profile</h1>
        <h3>Name: {user.name}</h3>
        <h3>Email: {user.email}</h3>
      </Container>
    </>
    )
  );
}
