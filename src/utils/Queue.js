/**
 * Process queued items if start condition is met.
 */

class QueueItem {
  constructor(parameters, resolve, reject) {
    this.parameters = parameters;
    this.resolve = resolve;
    this.reject = reject;
  }
}

export default class Queue {
  constructor(executorFunction, startConditionFunction, rejectionReason) {
    this.executorFunction = executorFunction;
    this.startConditionFunction = startConditionFunction;
    this.rejectionReason = rejectionReason;

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

      while(this.queue.length > 0) {
        const startConditionMet = await this.startConditionFunction();
        if(!startConditionMet) {
          this.rejectAll(this.rejectionReason);
        }

        this.currentItem = this.queue.pop();
        await this.executorFunction(this.currentItem);
      }

      this.running = false;
    }
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
    return new Promise((resolve, reject) => {
      const resolveCallback = (result) => resolve(result);
      const rejectCallback = (error) => reject(error);

      const item = new QueueItem(parameters, resolveCallback, rejectCallback);
      this.queue.push(item);

      this.process();
    });
  }
}
