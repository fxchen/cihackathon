import React from "react";
import ReactAudioPlayer from "react-audio-player";
import { Button } from "react-bootstrap";

export default function EntryCard({
  id,
  label,
  description,
  createdAt,
  vocoderOutputURL,
  vocoderStatus,
  ...props
}) {
  let border = "card mb-3";
  if (id) border = "card mb-3 border-primary";

  return (
    <div className="col">
      <div className={border}>
        <div className="card-body">
          <h5 className="card-title">{label}</h5>
          <h6 className="card-subtitle text-muted">{description}</h6>
        </div>

        {props.children}

        {!id && (
          <div className="card-body">
            <Button variant="outline-primary" href={`/create/${label}`}>
              Upload Entry
            </Button>
          </div>
        )}

        {id && (
          <>
            <div className="card-body text-left">
              {vocoderOutputURL && (
                <>
                  <div className="col text-center">
                    <ReactAudioPlayer src={`${vocoderOutputURL}`} controls />
                  </div>
                  <hr />
                </>
              )}

              <div className="row no-gutters">
                <div className="col-8 align-bottom text-left">
                  <h6>{new Date(createdAt).toDateString()} - {vocoderStatus}</h6>
                </div>
                <div className="col-4 text-right">
                  <Button variant="primary" href={`/algorithms/${id}`}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
