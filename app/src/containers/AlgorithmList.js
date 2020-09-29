import React, { useState, useEffect } from "react";
import { API, Logger } from "aws-amplify";
import { useAppContext } from "../libs/contextLib";
import Container from "../components/Container";
import EntryCard from "../components/EntryCard";
import entries from '../entries';
import config from "../config";
import "./AlgorithmList.css";

const VOCODER_BUCKET_URL = config.VOCODER_BUCKET_URL;
const logger = new Logger("AlgorithmList", "DEBUG");

export default function AlgorithmList(props) {
  //const { isAuthenticated } = useAppContext();
  // eslint-disable-next-line
  const [algorithms, setAlgorithms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticating, isAuthenticated } = useAppContext();

  useEffect(() => {
    function loadAlgorithms() {
      //logger.debug("API: loadAlgorithms");
      return API.get("algorithms", "/algorithms");
    }

    async function onLoad() {
      try {
        const algorithms = await loadAlgorithms();
        //logger.debug("Found " + algorithms.length + " algorithms");
        setAlgorithms(algorithms);

        // Merge entries with valid algorithms
        for (let i = 0; i < algorithms.length; i++) {
          let key = algorithms[i].label;
          if (key in entries) {
            let merged = { ...entries[key], ...algorithms[i] };
            entries[key] = merged;
            //logger.debug(entries[label]);
          }
        }
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }

    if (!isAuthenticating && !isAuthenticated) {
      logger.debug('User is not authenticated')
      props.history.push("/login");
    }
    // wait for authentication before loading algorithms
    if (!isAuthenticating && isAuthenticated && isLoading) {
      onLoad(); // Load and render once
    }
    
  }, [isAuthenticating, isAuthenticated, isLoading, props]);

  function renderRow(tag) {
    let cards = [];
    let vocoderOutputURL = "";
    for (let key in entries) {
      let algorithm = entries[key];
      if (algorithm.tag !== tag) continue;
      if (algorithm.algorithmId) {
        if (algorithm.vocoder_output) {
          vocoderOutputURL = VOCODER_BUCKET_URL + algorithm.vocoder_output
          logger.debug(vocoderOutputURL)
        }
        cards.push(
          <div key={algorithm.label} className="col">
            <EntryCard
              id={algorithm.algorithmId}
              label={algorithm.label}
              description={algorithm.description}
              createdAt={algorithm.createdAt}
              vocoderOutputURL={vocoderOutputURL}
            />
          </div>
        );
      } else {
        // New entry
        cards.push(
          <div key={algorithm.label} className="col">
            <EntryCard
              label={algorithm.label}
              description={algorithm.description}
            />
          </div>
        );
      }
    }
    return <div className="row">{cards}</div>;
  }

  return (
    <>
      <Container>
        {!isLoading && renderRow("natural_speech")}
        {!isLoading && renderRow("cnc")}
        {!isLoading && renderRow("speech_in_noise")}
        {!isLoading && renderRow("music")}
      </Container>
    </>
  );
}
