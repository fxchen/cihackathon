import React from "react";
import { Button } from "react-bootstrap";

export default function EntryCard({
  id,
  label,
  description,
  createdAt,
  ...props
}) {

  let border = "card mb-3"
  if (id) border = "card mb-3 border-primary"

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
            <div className="form-group">
              <div className="input-group mb-3">
                <div className="custom-file">
                  <input
                    type="file"
                    className="custom-file-input"
                    id="inputGroupFile02"
                  />
                  <label
                    className="custom-file-label"
                    htmlFor="inputGroupFile02"
                  >
                    Choose file
                  </label>
                </div>
                <div className="input-group-append">
                  <span className="input-group-text" id="">
                    Upload
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {id && (
          <>
            <div className="card-body">
              <Button variant="primary" href={`/algorithms/${id}`}>
                Update
              </Button>
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
