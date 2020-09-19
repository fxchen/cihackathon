import React from "react";
import { Button } from "react-bootstrap";

export default function EntryCard({
  id,
  label,
  description,
  createdAt,
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
              <div className="row">
                <div className="col">
                  <Button variant="primary" href={`/algorithms/${id}`}>
                    View Details
                  </Button>
                </div>
              </div>
            </div>
            <div className="card-footer text-muted">
              Created {new Date(createdAt).toLocaleString()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
