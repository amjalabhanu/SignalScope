import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [events, setEvents] = useState([]);
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/events")
      .then((response) => response.json())
      .then((data) => setEvents(data));

    fetch("http://localhost:8000/entities")
      .then((response) => response.json())
      .then((data) => setEntities(data));
  }, []);

  return (
    <div className="container">
      <h1>SignalScope</h1>

      <p className="subtitle">
        Domain intelligence backed by evidence
      </p>

      <h2>Entities</h2>

      <div className="entities">
        {entities.map((entity) => (
          <span className="entity" key={entity.id}>
            {entity.name}
          </span>
        ))}
      </div>

      <h2>Recent Intelligence</h2>

      {events.length === 0 ? (
        <p>No intelligence detected yet.</p>
      ) : (
        events.map((event) => (
          <div className="event-card" key={event.id}>
            <div className="event-type">
              {event.event_type}
            </div>

            <h3>{event.entity.name}</h3>

            <p className="summary">
              {event.summary}
            </p>

            <div className="evidence">
              <h4>Evidence</h4>

              {event.evidence.map((document) => (
                <div className="evidence-item" key={document.url}>
                  <div className="evidence-title">
                    {document.title}
                  </div>

                  <div className="evidence-source">
                    {document.source}
                  </div>

                  <a
                    href={document.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default App;