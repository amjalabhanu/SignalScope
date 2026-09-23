const API_BASE_URL = "http://localhost:8000";

async function fetchJson(endpoint, resourceName, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);

    if (!response.ok) {
      let message = `Unable to load ${resourceName}. Server returned ${response.status}.`;

      try {
        const errorBody = await response.json();
        if (errorBody?.detail) {
          message = errorBody.detail;
        }
      } catch {
        // Keep the default HTTP error message.
      }

      throw new Error(message);
    }

    // DELETE subscription returns 204 No Content.
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(
        `Unable to connect to the backend while loading ${resourceName}.`,
        { cause: error }
      );
    }

    throw error;
  }
}

function jsonHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Existing public APIs

export function getEvents() {
  return fetchJson("/events", "events");
}

export function getEntities() {
  return fetchJson("/entities", "entities");
}

// Entity discovery APIs

export function searchEntities({
  q,
  type,
  page = 1,
  limit = 20,
  token,
}) {
  const params = new URLSearchParams({
    q,
    page: String(page),
    limit: String(limit),
  });

  if (type) {
    params.set("type", type);
  }

  return fetchJson(
    `/entities/search?${params.toString()}`,
    "entity search",
    {
      headers: jsonHeaders(token),
    }
  );
}

export function getEntity(entityId, token) {
  return fetchJson(`/entities/${entityId}`, "entity", {
    headers: jsonHeaders(token),
  });
}

// Authentication APIs

export function registerUser({ name, email, password }) {
  return fetchJson("/auth/register", "registration", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ name, email, password }),
  });
}

export function loginUser({ email, password }) {
  return fetchJson("/auth/login", "login", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password }),
  });
}

export function getCurrentUser(token) {
  return fetchJson("/auth/me", "current user", {
    headers: jsonHeaders(token),
  });
}

// Subscription APIs

export function getSubscriptions(token) {
  return fetchJson("/subscriptions/me", "subscriptions", {
    headers: jsonHeaders(token),
  });
}

export function followEntity(entityId, token) {
  return fetchJson(`/subscriptions/${entityId}`, "subscription", {
    method: "POST",
    headers: jsonHeaders(token),
  });
}

export function unfollowEntity(entityId, token) {
  return fetchJson(`/subscriptions/${entityId}`, "subscription", {
    method: "DELETE",
    headers: jsonHeaders(token),
  });
}

export function getFeed({
  page = 1,
  limit = 20,
  token,
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return fetchJson(`/feed?${params.toString()}`, "feed", {
    headers: jsonHeaders(token),
  });
}

export function getRelatedEntities(entityId, token) {
  return fetchJson(
    `/entities/${entityId}/related`,
    "related entities",
    {
      headers: jsonHeaders(token),
    }
  );
}

export function getRecommendations({ page = 1, limit = 20, token }) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return fetchJson(
    `/recommendations?${params.toString()}`,
    "recommendations",
    {
      headers: jsonHeaders(token),
    }
  );
}

export function getEntityIntelligence({
  entityId,
  page = 1,
  limit = 20,
  token,
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return fetchJson(
    `/entities/${entityId}/intelligence?${params.toString()}`,
    "entity intelligence",
    {
      headers: jsonHeaders(token),
    }
  );
}

export function getEntityEvents({
  entityId,
  page = 1,
  limit = 20,
  eventType,
  token,
}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (eventType) {
    params.set("event_type", eventType);
  }

  return fetchJson(
    `/entities/${entityId}/events?${params.toString()}`,
    "entity events",
    {
      headers: jsonHeaders(token),
    }
  );
}