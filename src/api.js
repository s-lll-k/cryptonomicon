const API_KEY =
  "fbe0a0ae76c94bc30d564d7ec763f9df611a5d0ef8f654ace783ffbc69c6c1dc";

const tickersHandlers = new Map();
const tickersCacheForCrossсonversion = new Map();
const socket = new WebSocket(
  `wss://streamer.cryptocompare.com/v2?api_key=${API_KEY}`
);

const AGGREGATE_INDEX = "5";

socket.addEventListener("message", (e) => {
  const {
    TYPE: type,
    FROMSYMBOL: currency,
    PRICE: newPrice,
    MESSAGE: sub,
    PARAMETER: parameter,
    SUB: subMessage,
  } = JSON.parse(e.data);
  const paramArr = parameter?.split("~");
  let subArr, handlers;

  if (subMessage) {
    subArr = subMessage.split("~");
  }
  // Нужно по ключам ответа, сделать задачу 2
  if (tickersCacheForCrossсonversion.has(currency)) {
    tickersCacheForCrossсonversion.set(currency, newPrice);
  }

  if (currency === "ETH") {
    if (type !== AGGREGATE_INDEX || newPrice === undefined) {
      return;
    }
    tickersCacheForCrossсonversion.forEach((tickerPrice, idx) => {
      handlers = tickersHandlers.get(idx);
      handlers.forEach((fn) => fn(newPrice * tickerPrice, true));
    });
    return;
  } else {
    handlers =
      tickersHandlers.get(
        currency ?? (paramArr !== undefined ? paramArr[2] : undefined)
      ) ?? [];
  }

  if (sub === "INVALID_SUB") {
    tickersCacheForCrossсonversion.delete(paramArr[2]);
    // Добавить перевод на эфир
    if (paramArr[3] === "USD") {
      subscribeToTickerOnWs(paramArr[2], "ETH");
      return;
    }
    if (paramArr[3] === "ETH") {
      handlers.forEach((fn) => fn("-", false));
      return;
    }
  }
  if (sub === "SUBSCRIBECOMPLETE" && subArr[3] === "ETH") {
    subscribeToTickerOnWs("ETH", "USD");
    return;
  }

  if (type !== AGGREGATE_INDEX || newPrice === undefined) {
    return;
  }

  handlers.forEach((fn) => fn(newPrice, true));
});

function sendToWebSocket(message) {
  const stringifiedMessage = JSON.stringify(message);

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(stringifiedMessage);
    return;
  }

  socket.addEventListener(
    "open",
    () => {
      socket.send(stringifiedMessage);
    },
    { once: true }
  );
}

function subscribeToTickerOnWs(ticker, cur) {
  if (cur === "ETH") {
    tickersCacheForCrossсonversion.set(ticker);
  }
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${cur}`],
  });
}

function unsubscribeFromTickerOnWs(ticker, cur) {
  if (cur === "ETH") {
    tickersCacheForCrossсonversion.delete(ticker);
  }
  sendToWebSocket({
    action: "SubRemove",
    subs: [`5~CCCAGG~${ticker}~${cur}`],
  });
}

export const subscribeToTicker = (ticker, cb) => {
  const subscribers = tickersHandlers.get(ticker) || [];
  tickersHandlers.set(ticker, [...subscribers, cb]);
  subscribeToTickerOnWs(ticker, "USD");
};
export const unsubscribeFromTicker = (ticker) => {
  tickersHandlers.delete(ticker);
  if (tickersCacheForCrossсonversion.has(ticker)) {
    unsubscribeFromTickerOnWs(ticker, "ETH");
    if (tickersCacheForCrossсonversion.size === 0) {
      unsubscribeFromTickerOnWs("ETH", "USD");
      return;
    }
  }

  unsubscribeFromTickerOnWs(ticker, "USD");
};
