<template>
  <section>
    <div class="flex">
      <div class="max-w-xs">
        <label for="wallet" class="block text-sm font-medium text-gray-700"
          >Тикер</label
        >
        <div class="mt-1 relative rounded-md shadow-md">
          <input
            v-model="ticker"
            @keydown.enter="add"
            @input="input"
            type="text"
            name="wallet"
            id="wallet"
            class="block w-full pr-10 border-gray-300 text-gray-900 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm rounded-md"
            placeholder="Например DOGE"
          />
        </div>
        <div
          v-if="filteredCoinList.length"
          class="flex bg-white shadow-md p-1 rounded-md shadow-md flex-wrap"
        >
          <span
            v-for="token in filteredCoinList"
            :key="token"
            @click="fastAdd(token)"
            class="inline-flex items-center px-2 m-1 rounded-md text-xs font-medium bg-gray-300 text-gray-800 cursor-pointer"
          >
            {{ token }}
          </span>
        </div>
        <div v-if="tickerIsExisting" class="text-sm text-red-600">
          Такой тикер уже добавлен
        </div>
      </div>
    </div>
    <add-button @click="add" :disabled="disabled" class="my-4" />
  </section>
</template>

<script>
import AddButton from "./AddButton.vue";

export default {
  components: {
    AddButton,
  },

  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    coinList: {
      type: Array,
      required: true,
      default: () => [],
    },
    tickers: {
      type: Array,
      required: true,
      default: () => [],
    },
  },

  emits: {
    "add-ticker": (value) => typeof value === "string" && value.length > 0,
  },

  data() {
    return {
      ticker: "",
      filteredCoinList: [],
      tickerIsExisting: false,
    };
  },

  methods: {
    checkExistingTickers() {
      if (this.tickers.find((t) => t.name === this.ticker)) {
        this.tickerIsExisting = true;
      } else this.tickerIsExisting = false;
    },
    add() {
      this.checkExistingTickers();
      if (this.tickerIsExisting || this.ticker.length === 0) {
        return;
      }
      this.$emit("add-ticker", this.ticker);
      this.ticker = "";
      this.filteredCoinList = [];
    },
    input() {
      this.showMatches();
      this.tickerIsExisting = false;
    },
    showMatches() {
      this.filteredCoinList = [];
      for (let i = 0; i < this.coinList.length; i++) {
        const el = this.coinList[i];
        if (this.filteredCoinList.length < 4) {
          if (
            this.ticker !== "" &&
            (el["Symbol"].indexOf(this.ticker) > -1 ||
              el["FullName"].indexOf(this.ticker) > -1)
          ) {
            this.filteredCoinList.push(el["Symbol"]);
          }
        } else break;
      }
    },
    fastAdd(token) {
      this.ticker = token;
      this.add();
    },
  },
};
</script>
