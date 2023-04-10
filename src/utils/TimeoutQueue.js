/**
 * Process queued items.
 *
 * If the given timeout is reached processing an item, the item being processed
 * and every other item on the queue will be rejected. The timeout is being
 * reset for each new item popped from the queue.
 */

class TimeoutQueueItem {
  constructor(parameters, resolve, reject) {
    this.parameters = parameters;
    this.resolve = resolve;
    this.reject = reject;
  }
}

export default class TimeoutQueue {
  constructor(executorFunction, startConditionFunction, rejectionReason, timeoutMs = 60000) {
    this.executorFunction = executorFunction;
    this.startConditionFunction = startConditionFunction;
    this.rejectionReason = rejectionReason;
    this.timeoutMs = timeoutMs;

    this.running = false;
    this.queue = [];
    this.timeoutFunction = null;
    this.currentItem = null;
  }

  async rejectAll(reason) {
    // Reject the item being currently processed
    if(this.currentItem) {
      this.currentItem.reject(reason);
    }

    // Reject all other queued items
    while(this.queue.length > 0) {
      const currentItem = this.queue.pop();
      currentItem.reject(reason);
    }
  }

  async process() {
    if(!this.running) {
      this.running = true;

      const startConditionMet = await this.startConditionFunction();
      if(!startConditionMet) {
        this.rejectAll(this.rejectionReason);
      } else {
        while(this.queue.length > 0) {
          this.timeoutFunction = setTimeout(() => {
            this.rejectAll("Timeout reached");

            this.running = false;
          }, this.timeoutMs);

          this.currentItem = this.queue.pop();
          await this.executorFunction(this.currentItem);

          clearTimeout(this.timeoutFunction);
          this.timeoutFunction = null;
        }
      }

      this.running = false;
    }
  }

  setTimeout(timeoutMs) {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Add a new set of parameteres which will be added to the qeue and sonner or
   * later be processed and run through the executor. The executor then decides
   * to resolve or reject the initially returned promise.
   *
   * @param {*} parameters An array of parameters to be passed to the executor
   * @returns {Promise}
   */
  async add(parameters) {
    console.log("Queuing:", parameters, "queued items: ", this.queue.length);
    return new Promise((resolve, reject) => {
      const resolveCallback = (result) => resolve(result);
      const rejectCallback = (error) => reject(error);

      const item = new TimeoutQueueItem(parameters, resolveCallback, rejectCallback);
      this.queue.push(item);

      this.process();
    });
  }
}
