import React, { useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { API, Logger } from "aws-amplify";
import { s3Upload } from "../libs/awsLib";

import { FormGroup, FormControl, FormLabel } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import Container from "../components/Container";
// import { useDropzone } from "react-dropzone";
import config from "../config";

const logger = new Logger("NewAlgorithm", "DEBUG");

// function Basic(props) {
//   const { acceptedFiles, getRootProps, getInputProps } = useDropzone();

//   const files = acceptedFiles.map((file) => (
//     <li key={file.path}>
//       {file.path} - {file.size} bytes
//     </li>
//   ));

//   return (
//     <section className="container">
//       <div {...getRootProps({ className: "dropzone" })}>
//         <input {...getInputProps()} />
//         <p>Drag 'n' drop some files here, or click to select files</p>
//       </div>
//       <aside>
//         <h4>Files</h4>
//         <ul>{files}</ul>
//       </aside>
//     </section>
//   );
// }

export default function NewAlgorithm() {
  const file = useRef(null);
  const history = useHistory();
  const [label, setLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // function UploadToast() {
  //   logger.debug("toast");
  //   return (
  //     <Toast>
  //       <Toast.Header>
  //         <img src="holder.js/20x20?text=%20" className="rounded mr-2" alt="" />
  //         <strong className="mr-auto">Bootstrap</strong>
  //         <small>11 mins ago</small>
  //       </Toast.Header>
  //       <Toast.Body>Hello, world! This is a toast message.</Toast.Body>
  //     </Toast>
  //   );
  // }

  function validateForm() {
    return label.length > 0;
  }

  function handleFileChange(event) {
    file.current = event.target.files[0];
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (file.current && file.current.size > config.MAX_ATTACHMENT_SIZE) {
      alert(
        `Please pick a file smaller than ${
          config.MAX_ATTACHMENT_SIZE / 1000000
        } MB.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const attachment = file.current ? await s3Upload(file.current) : null;
      await createAlgorithm({ label, attachment });
      logger.debug("Success:" + label);
      
      // UploadToast();
      //setIsLoading(false);

      history.push("/algorithms");
    } catch (e) {
      logger.debug("Error in createAlgorithm:" + e);
      setIsLoading(false);
    }
  }

  function createAlgorithm(algorithm) {
    logger.debug(algorithm);
    var res = API.post("algorithms", "/algorithms", {
      body: algorithm,
    });
    logger.debug(res);
  }

  return (
    <>
      <Container>
        <form onSubmit={handleSubmit}>
          <FormGroup controlId="label">
            <FormControl
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </FormGroup>
          <FormGroup controlId="file">
            <FormLabel>Attachment</FormLabel>
            <FormControl onChange={handleFileChange} type="file" />
          </FormGroup>
          <LoaderButton
            block
            type="submit"
            //bsSize="large"
            //bsStyle="primary"
            isLoading={isLoading}
            disabled={!validateForm()}
          >
            Create
          </LoaderButton>
        </form>
      </Container>
    </>
  );
}
