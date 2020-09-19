import React, { useState, useEffect } from "react";
import { API, Logger } from "aws-amplify";
//import { useAppContext } from "../libs/contextLib";

import Container from "../components/Container";
import EntryCard from "../components/EntryCard";
import "./AlgorithmList.css";

const logger = new Logger("AlgorithmList", "DEBUG");

const entries = {
  // Natural speech
  natural_speech_1: {
    tag: "natural_speech",
    label: "Natural_Speech_1",
    description: "Is your refrigerator running?",
  },
  natural_speech_2: {
    tag: "natural_speech",
    label: "Natural_Speech_2",
    description: "Well, you better go catch it",
  },
  natural_speech_3: {
    tag: "natural_speech",
    label: "Natural_Speech_3",
    description: "That was a horrible joke",
  },
  // CNC words
  cnc_1: {
    tag: "cnc",
    label: "CNC_1",
    description: "Say the word baseball",
  },
  cnc_2: {
    tag: "cnc",
    label: "CNC_2",
    description: "Say the word coat",
  },
  cnc_3: {
    tag: "cnc",
    label: "CNC_3",
    description: "Say the word foam",
  },
  // Speech in noise
  speech_in_noise_1: {
    tag: "speech_in_noise",
    label: "Speech_in_Noise_1",
    description: "Please ask for the check",
  },
  speech_in_noise_2: {
    tag: "speech_in_noise",
    label: "Speech_in_Noise_2",
    description: "Where is the restroom",
  },
  speech_in_noise_3: {
    tag: "speech_in_noise",
    label: "Speech_in_Noise_3",
    description: "Does this dish smell funny",
  },
  // Music
  music_1: {
    tag: "music",
    label: "Music_Sample_1",
    description: "Guitar solo",
  },
  music_2: {
    tag: "music",
    label: "Music_Sample_2",
    description: "Classical music",
  },
  music_3: {
    tag: "music",
    label: "Music_Sample_3",
    description: "Skrillex Dubstep",
  },
};

export default function AlgorithmList(props) {
  //const { isAuthenticated } = useAppContext();
  // eslint-disable-next-line
  const [algorithms, setAlgorithms] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function loadAlgorithms() {
      logger.debug("API: loadAlgorithms");
      return API.get("algorithms", "/algorithms");
    }

    async function onLoad() {
      try {
        const algorithms = await loadAlgorithms();
        //logger.debug("Found " + algorithms.length + " algorithms");
        setAlgorithms(algorithms);

        // Merge entries with valid algorithms
        for (let i = 0; i < algorithms.length; i++) {
          let label = algorithms[i].label;
          if (label in entries) {
            let merged = { ...entries[label], ...algorithms[i] };
            entries[label] = merged;
            //logger.debug(entries[label]);
          }
        }
      } catch (e) {
        logger.debug(e);
      }
      setIsLoading(false);
    }
    if (isLoading) onLoad(); // Load and render once
  }, [isLoading]);

  function renderRow(tag) {
    let cards = [];
    for (let key in entries) {
      let algorithm = entries[key];
      if (algorithm.tag !== tag) continue;
      if (algorithm.algorithmId) {
        cards.push(
          <div key={algorithm.label} className="col">
            <EntryCard
              id={algorithm.algorithmId}
              label={algorithm.label}
              description={algorithm.description}
              createdAt={algorithm.createdAt}
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
