import React, { useEffect } from "react";
import { Logger } from "aws-amplify";
import { LinkContainer } from "react-router-bootstrap";
import { ListGroup, ListGroupItem, Button, Row, Col } from "react-bootstrap";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import "./AlgorithmList.css";

import { FaPlus } from "react-icons/fa";

const logger = new Logger("AlgorithmList", "DEBUG");

export default function AlgorithmList() {
  const { isLoadingAlgorithms, setIsLoadingAlgorithms, algorithms, user } = useAppContext();
  // const [algorithms, setAlgorithms] = useState([]);
  // const [isLoading, setIsLoading] = useState(true);

  //setIsLoading(true); // force state change

  useEffect(() => {
    logger.debug("algorithms:" + algorithms)
    logger.debug(user);
  }, [isLoadingAlgorithms, setIsLoadingAlgorithms, algorithms, user])

  // useEffect(() => {
  //   function loadAlgorithms() {
  //     logger.debug("loadAlgorithms");
  //     return API.get("algorithms", "/algorithms");
  //   }

  //   async function onLoad() {
  //     if (!isAuthenticated) {
  //       return;
  //     }
  //     try {
  //       const algorithms = await loadAlgorithms();
  //       setAlgorithms(algorithms);
  //       //logger.debug(algorithms);
  //     } catch (e) {
  //       logger.debug(e);
  //     }
  //     setIsLoading(false);
  //     logger.debug("4. leave useEffect");
  //   }

  //   onLoad();
  // }, [isAuthenticated]);
  //}, [isAuthenticated, isLoading, props]);

  function renderAlgorithmsList(algorithms) {
    logger.debug("5. renderAlgorithmsList");
    return [{}].concat(algorithms).map(
      (algorithm, i) =>
        i !== 0 && (
          <LinkContainer
            key={algorithm.algorithmId}
            to={`/algorithms/${algorithm.algorithmId}`}
          >
            <ListGroupItem>
              <Row>
                <Col>{algorithm.label.trim().split("\n")[0]}</Col>
                <Col xs lg="3">
                  {new Date(algorithm.createdAt).toLocaleString()}
                </Col>
              </Row>
            </ListGroupItem>
          </LinkContainer>
        )
    );
  }

  return (
    <>
      <Container>
        <div className="Algorithms">
          <div className="algorithm">
            <Row>
              <Col><h3>Your Algorithms</h3></Col>
                {" "}
              <Col lg="auto">
                <Button variant="primary" href="/create">
                  <FaPlus /> New
                </Button>{" "}
              </Col>
            </Row>
            <ListGroup>
              <ListGroupItem variant="primary">
                <Row>
                  <Col>
                    <b>Label</b>
                  </Col>
                  <Col xs lg="3">
                    <b>Created</b>
                  </Col>
                </Row>
              </ListGroupItem>
              {!isLoadingAlgorithms && renderAlgorithmsList(algorithms)}
            </ListGroup>
          </div>
        </div>
      </Container>
    </>
  );
}
