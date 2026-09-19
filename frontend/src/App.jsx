import { useEffect, useState } from "react";
import { getEvents, getEntities } from "./api";
import "./App.css";

// Defines how known event types should appear in the UI.
// Keeping this in one place makes it easy to add new event types later.
const EVENT_TYPE_STYLES = {
  product_launch: {
    label: "Product Launch",
    className: "event-type-product-launch",
  },
  price_change: {
    label: "Price Change",
    className: "event-type-price-change",
  },
};

function App() {
  const [events, setEvents] = useState([]);
  const [entities, setEntities] = useState([]);

  useEffect(() => {
    getEvents().then((data) => setEvents(data));

    getEntities().then((data) => setEntities(data));
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
        events.map((event) => {
          const eventType =
            EVENT_TYPE_STYLES[event.event_type] || {
              label: event.event_type,
              className: "event-type-default",
            };

          return (
            <div className="event-card" key={event.id}>
              <div className={`event-type ${eventType.className}`}>
                {eventType.label}
              </div>

              <h3>{event.entity.name}</h3>

              <p className="summary">
                {event.ai_summary}
              </p>

              <div className="evidence">
                <h4>Evidence</h4>

                {event.evidence.map((document) => (
                  <div
                    className="evidence-item"
                    key={document.url}
                  >
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
          );
        })
      )}
    </div>
  );
}

export default App;