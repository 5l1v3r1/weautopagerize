import MIMEType from "whatwg-mimetype";
import checkOrigin from "../checkOrigin";
import sleep from "../sleep";
import waitForEvent from "./waitForEvent";

async function nativeFetch(url) {
  const response = await fetch(url, {credentials: "include", redirect: "follow"});
  const responseURL = new URL(response.url);
  
  const contentType = response.headers.get("Content-Type");
  if (contentType === null) {
    throw new Error(`Content-Type Error: ${contentType}`);
  }
  const mimeType = new MIMEType(contentType);
  if (!mimeType.isHTML() && mimeType.essence !== "application/xhtml+xml") {
    throw new Error(`Content-Type Error: ${contentType}`);
  }
  
  const ab = await response.arrayBuffer();
  const charset = mimeType.parameters.get("charset") || document.characterSet;
  const textDecoder = new TextDecoder(charset);
  const responseText = textDecoder.decode(ab);
  
  return {responseURL, responseText};
}

async function userFetch(url) {
  document.dispatchEvent(new CustomEvent("AutoPagerizeUserFetchRequest", {
    bubbles: true,
    detail: {
      url: url.href,
    },
  }));
  
  const ev = await waitForEvent(document, "AutoPagerizeUserFetchResponse");
  const {responseURL, responseText} = ev.detail;
  return {responseURL: new URL(responseURL), responseText};
}

const REQUEST_INTERVAL = 1000;
let lastRequestTime = 0;

export default async function fetchHTMLText(url, useUserFetch = false) {
  if (!checkOrigin(url)) {
    throw new Error(`Same-Origin Error: ${url.href}`);
  }
  
  const now = Date.now();
  if (now < lastRequestTime + REQUEST_INTERVAL) {
    await sleep((lastRequestTime + REQUEST_INTERVAL) - now + 10);
    return fetchHTMLText(url);
  }
  lastRequestTime = now;
  
  const response = await (useUserFetch ? userFetch(url) : nativeFetch(url));
  if (!checkOrigin(response.responseURL)) {
    throw new Error(`Same-Origin Error: ${response.responseURL.href}`);
  }
  
  return response;
}