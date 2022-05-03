const API_KEY =
  "fbe0a0ae76c94bc30d564d7ec763f9df611a5d0ef8f654ace783ffbc69c6c1dc";

const tickersHandlers = new Map();
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
  } = JSON.parse(e.data);
  const paramArr = parameter?.split("~");
  // Нужно по ключам ответа, сделать задачу 2
  const handlers =
    tickersHandlers.get(
      currency ?? (paramArr !== undefined ? paramArr[2] : undefined)
    ) ?? [];
  console.log(JSON.parse(e.data));
  if (sub === "INVALID_SUB") {
    // Добавить перевод на биток
    if (paramArr[3] === "USD") {
      subscribeToTickerOnWs(paramArr[2], "BTC");
      return;
    }
    if (paramArr[3] === "BTC") {
      handlers.forEach((fn) => fn("-", false));
      return;
    }
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
  sendToWebSocket({
    action: "SubAdd",
    subs: [`5~CCCAGG~${ticker}~${cur}`],
  });
}

function unsubscribeFromTickerOnWs(ticker, cur) {
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
  unsubscribeFromTickerOnWs(ticker, "USD");
};
