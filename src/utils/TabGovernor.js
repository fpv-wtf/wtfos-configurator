/**
 * Handling master/slave state
 *
 * The "master" tab should be the only tab the user should be able to
 * interact with, basically it should lock out all other "slave" tabs
 * from interacting with devices and such.
 *
 * Once a new tab is opened or focus on a tab is gained, a ping is sent.
 * If no pong from a master is returned in a given timeframe, it is assumed
 * that the current tab is the (new) master.
 */
class TabGovernor {
  constructor(callback, claimCallback, channel = "governor") {
    this.callback = callback;
    this.bc = new BroadcastChannel(channel);

    this.setMaster = (state) => {
      this.isMaster = state;
      callback(state);
    };

    this.setCanClaim = (state) => {
      claimCallback(state);
    };

    this.claimed = false;
    this.isMaster = true;
    this.timeout = 200;
  }

  connect() {
    this.bc.onmessage = (event) => {
      console.log(event.data);
      const type = event.data.type;

      switch(type) {
        /**
         * Respond to a ping request with a pong and master state
         */
        case "ping": {
          this.bc.postMessage({
            type: "pong",
            master: this.isMaster,
            claimed: this.claimed,
          });
        } break;

        /**
         * Check if pong is master, if so, we are not.
         */
        case "pong": {
          if(event.data.master) {
            clearTimeout(this.timeout);
            this.setMaster(false);
          }

          if(event.data.claimed) {
            this.setCanClaim(false);
          }
        } break;

        case "claimed": {
          this.setCanClaim(false);
        } break;

        case "unclaimed": {
          this.setCanClaim(true);
        } break;

        default: {
          console.log("Message type not implemented", type);
        }
      }
    };

    const checkMaster = () => {
      if(!this.isMaster) {
        this.ping();
      }
    };
    checkMaster.bind(this);

    /**
     * If the tab gains focus, let's see if we should be the next
     * master (if we are not yet).
     */
    window.addEventListener("focus", checkMaster);

    this.ping();
  }

  ping() {
    this.timeout = setTimeout(() => {
      this.setMaster(true);
    }, this.timeout);

    // Ping other tabs and wait for response
    this.bc.postMessage({ type: "ping" });
  }

  deviceClaimed(claimed) {
    this.claimed = claimed;
    this.bc.postMessage({ type: this.claimed ? "claimed" : "unclaimed" });
  }

  disconnect() {
    clearTimeout(this.timeout);
    this.bc.close();
  }
}

export default TabGovernor;
