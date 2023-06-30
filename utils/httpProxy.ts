import { Agent, ProxyAgent, setGlobalDispatcher } from "undici";

export function setupHttpProxy() {
  const PROXY_URI = process.env.API_HTTP_PROXY_URI;
  if (PROXY_URI != null && PROXY_URI.length > 0) {
    const dispatcher = new ProxyAgent(PROXY_URI);
    setGlobalDispatcher(dispatcher);
  }
}

export function clearHttpProxy() {
  setGlobalDispatcher(new Agent());
}
